-- แก้ปัญหา: ค้นหาด้วย filter อย่างเดียว (เลือกรุ่นรถ/หมวดหมู่) โดยไม่พิมพ์คำค้นหา → return ผลลัพธ์ว่าง
-- สาเหตุ: function RETURN ทันทีถ้า query < 2 ตัวอักษร แม้จะมี filter อยู่
-- Fix: ถ้า query สั้น/ว่าง แต่มี filter → ข้าม text search, ใช้ filter อย่างเดียว

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
  has_query       BOOLEAN;
  has_filters     BOOLEAN;
BEGIN
  has_query := length(trim(COALESCE(p_query, ''))) >= 2;
  has_filters := p_vehicle_id IS NOT NULL
    OR p_category_id IS NOT NULL
    OR p_brand IS NOT NULL
    OR p_min_price IS NOT NULL
    OR p_max_price IS NOT NULL
    OR p_in_stock IS NOT NULL;

  -- ไม่มีทั้ง query และ filter → return ว่าง
  IF NOT has_query AND NOT has_filters THEN
    RETURN;
  END IF;

  -- ตั้ง trigram threshold ต่อ session
  PERFORM set_limit(0.2);

  -- เตรียม text search (เฉพาะเมื่อมี query)
  IF has_query THEN
    expanded_query := expand_query_with_synonyms(trim(p_query));

    BEGIN
      ts_query := websearch_to_tsquery('simple', expanded_query);
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        ts_query := plainto_tsquery('simple', expanded_query);
      EXCEPTION WHEN OTHERS THEN
        ts_query := NULL;
      END;
    END;
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.sku, p.name_th, p.name_en, p.brand, p.price, p.category_id,
    CAST(MAX(
      CASE WHEN has_query THEN
        GREATEST(
          CASE WHEN ts_query IS NOT NULL
               THEN ts_rank_cd(p.search_vector, ts_query) * 2.0
               ELSE 0 END,
          COALESCE(similarity(p.searchable_text, lower(p_query)), 0) * 1.5,
          CASE WHEN p.searchable_text LIKE '%' || lower(p_query) || '%' THEN 1.0 ELSE 0 END,
          CASE WHEN p.name_th ILIKE '%' || p_query || '%' THEN 1.2 ELSE 0 END,
          CASE WHEN p.name_en ILIKE '%' || p_query || '%' THEN 1.0 ELSE 0 END,
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
      ELSE
        -- filter-only: เรียงตาม created_at (ใหม่สุดก่อน)
        0.5
      END
    ) AS REAL) AS relevance
  FROM products p
  LEFT JOIN product_vehicles pv ON pv.product_id = p.id
  LEFT JOIN product_inventory pinv ON pinv.product_id = p.id
  WHERE
    p.is_active = true
    -- text search condition (ข้ามถ้าไม่มี query)
    AND (
      NOT has_query
      OR (ts_query IS NOT NULL AND p.search_vector @@ ts_query)
      OR (p.searchable_text IS NOT NULL AND p.searchable_text % lower(p_query))
      OR (p.searchable_text IS NOT NULL AND p.searchable_text LIKE '%' || lower(p_query) || '%')
      OR p.name_th ILIKE '%' || p_query || '%'
      OR p.name_en ILIKE '%' || p_query || '%'
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
  ORDER BY
    CASE WHEN has_query THEN 0 ELSE 1 END,  -- query results first
    relevance DESC,
    p.created_at DESC  -- fallback: ใหม่สุดก่อน
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
