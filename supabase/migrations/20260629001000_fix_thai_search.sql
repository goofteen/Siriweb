-- แก้ปัญหา smart_search ไม่พบสินค้าเมื่อค้นด้วยภาษาไทย
-- Root causes:
--   1. SELECT DISTINCT + ORDER BY expression ที่ไม่อยู่ใน select list → error 42P10
--   2. set_limit(0.2) ตั้งแค่ deploy session — RPC session ใหม่ใช้ threshold 0.3
--   3. FTS ไม่รองรับ prefix match ภาษาไทย (ผ้าเบรกหน้า ≠ ผ้าเบรก)
--   4. Synonym expansion ใช้ websearch_to_tsquery (AND logic) → ต้องการทุก token
--      ทำให้ "ผ้าเบรค" expand ได้ "ผ้าเบรก" แต่ FTS ยังหา product ไม่เจอ
-- Fix:
--   - เปลี่ยนจาก SELECT DISTINCT เป็น GROUP BY
--   - เพิ่ม ILIKE บน name_th/name_en โดยตรง
--   - เพิ่ม synonym-aware ILIKE: query → canonical lookup → ILIKE บน canonical
--   - set_limit(0.2) ใน function body ทุก call

-- ========================================================
-- 1. Backfill searchable_text ที่อาจ NULL ถ้า trigger ไม่ fire ตอน seed
-- ========================================================
UPDATE products SET name_th = name_th WHERE searchable_text IS NULL;

-- ========================================================
-- 2. Replace smart_search พร้อม synonym-aware ILIKE
-- ========================================================
CREATE OR REPLACE FUNCTION smart_search(
  p_query       TEXT,
  p_vehicle_id  INTEGER DEFAULT NULL,
  p_category_id INTEGER DEFAULT NULL,
  p_brand       TEXT    DEFAULT NULL,
  p_min_price   DECIMAL DEFAULT NULL,
  p_max_price   DECIMAL DEFAULT NULL,
  p_in_stock    BOOLEAN DEFAULT NULL,
  p_limit       INTEGER DEFAULT 20,
  p_offset      INTEGER DEFAULT 0
) RETURNS TABLE (
  id          INTEGER,
  sku         VARCHAR,
  name_th     VARCHAR,
  name_en     VARCHAR,
  brand       VARCHAR,
  price       DECIMAL,
  category_id INTEGER,
  relevance   REAL
) AS $$
DECLARE
  expanded_query TEXT;
  ts_query       tsquery;
BEGIN
  IF length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  -- ตั้ง trigram threshold ต่อ session (default 0.3 เข้มเกินสำหรับไทย)
  PERFORM set_limit(0.2);

  expanded_query := expand_query_with_synonyms(trim(p_query));

  -- สร้าง tsquery — nested exception เพื่อรับมือ query ที่ parse ไม่ได้
  BEGIN
    ts_query := websearch_to_tsquery('simple', expanded_query);
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      ts_query := plainto_tsquery('simple', expanded_query);
    EXCEPTION WHEN OTHERS THEN
      ts_query := NULL;
    END;
  END;

  RETURN QUERY
  SELECT
    p.id, p.sku, p.name_th, p.name_en, p.brand, p.price, p.category_id,
    CAST(MAX(
      GREATEST(
        -- FTS score
        CASE WHEN ts_query IS NOT NULL
             THEN ts_rank_cd(p.search_vector, ts_query) * 2.0
             ELSE 0 END,
        -- Trigram (typo tolerance ภาษาอังกฤษ)
        COALESCE(similarity(p.searchable_text, lower(p_query)), 0) * 1.5,
        -- Substring บน searchable_text
        CASE WHEN p.searchable_text LIKE '%' || lower(p_query) || '%' THEN 1.0 ELSE 0 END,
        -- ILIKE บน name_th โดยตรง — safety net สำหรับภาษาไทย
        CASE WHEN p.name_th ILIKE '%' || p_query || '%' THEN 1.2 ELSE 0 END,
        -- ILIKE บน name_en
        CASE WHEN p.name_en ILIKE '%' || p_query || '%' THEN 1.0 ELSE 0 END,
        -- Synonym-aware ILIKE: หา canonical form ของ query แล้ว ILIKE บน canonical
        -- ตัวอย่าง: "ผ้าเบรค" → canonical "ผ้าเบรก" → name_th ILIKE '%ผ้าเบรก%'
        CASE WHEN EXISTS (
          SELECT 1 FROM search_synonyms ss
          WHERE (
            lower(p_query) LIKE '%' || lower(ss.canonical) || '%'
            OR EXISTS (
              SELECT 1 FROM unnest(ss.synonyms) AS s
              WHERE lower(p_query) LIKE '%' || lower(s) || '%'
            )
          )
          AND p.name_th ILIKE '%' || ss.canonical || '%'
        ) THEN 1.1 ELSE 0 END
      )
    ) AS REAL) AS relevance
  FROM products p
  LEFT JOIN product_vehicles pv ON pv.product_id = p.id
  LEFT JOIN product_inventory pinv ON pinv.product_id = p.id
  WHERE
    p.is_active = true
    AND (
      (ts_query IS NOT NULL AND p.search_vector @@ ts_query)
      OR (p.searchable_text IS NOT NULL AND p.searchable_text % lower(p_query))
      OR (p.searchable_text IS NOT NULL AND p.searchable_text LIKE '%' || lower(p_query) || '%')
      OR p.name_th ILIKE '%' || p_query || '%'
      OR p.name_en ILIKE '%' || p_query || '%'
      -- Synonym-aware: match canonical form ของ query ใน name_th
      OR EXISTS (
        SELECT 1 FROM search_synonyms ss
        WHERE (
          lower(p_query) LIKE '%' || lower(ss.canonical) || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(ss.synonyms) AS s
            WHERE lower(p_query) LIKE '%' || lower(s) || '%'
          )
        )
        AND p.name_th ILIKE '%' || ss.canonical || '%'
      )
    )
    AND (p_vehicle_id  IS NULL OR pv.vehicle_id = p_vehicle_id)
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_brand       IS NULL OR p.brand ILIKE p_brand)
    AND (p_min_price   IS NULL OR p.price >= p_min_price)
    AND (p_max_price   IS NULL OR p.price <= p_max_price)
    AND (p_in_stock    IS NULL OR (COALESCE(pinv.quantity, 0) > 0) = p_in_stock)
  GROUP BY p.id, p.sku, p.name_th, p.name_en, p.brand, p.price, p.category_id
  ORDER BY relevance DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
