-- แก้ปัญหา: ค้นหาหลายคำ เช่น "ใบปัด Honda" ดึงสินค้าที่ match แค่บางคำ
-- สาเหตุ: ILIKE/trigram fallback ใช้ query ทั้งก้อน ไม่ได้เช็คทีละคำ
-- Fix: เพิ่ม helper function ที่เช็คว่าทุกคำใน query อยู่ใน text

-- helper: เช็คว่าทุกคำ (แยกด้วย space) อยู่ใน text หรือไม่
CREATE OR REPLACE FUNCTION all_words_match(search_text TEXT, query TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  word TEXT;
BEGIN
  IF search_text IS NULL OR query IS NULL THEN RETURN FALSE; END IF;
  FOREACH word IN ARRAY string_to_array(trim(query), ' ')
  LOOP
    IF length(word) < 1 THEN CONTINUE; END IF;
    IF lower(search_text) NOT LIKE '%' || lower(word) || '%' THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- อัปเดต smart_search ให้ใช้ all_words_match แทน ILIKE ทั้งก้อน
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

  IF NOT has_query AND NOT has_filters THEN
    RETURN;
  END IF;

  PERFORM set_limit(0.2);

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
          -- FTS (ใช้ AND logic อยู่แล้ว)
          CASE WHEN ts_query IS NOT NULL
               THEN ts_rank_cd(p.search_vector, ts_query) * 2.0
               ELSE 0 END,
          -- ทุกคำต้อง match ใน name_th
          CASE WHEN all_words_match(p.name_th, p_query) THEN 1.2 ELSE 0 END,
          -- ทุกคำต้อง match ใน name_en
          CASE WHEN all_words_match(p.name_en, p_query) THEN 1.0 ELSE 0 END,
          -- ทุกคำต้อง match ใน searchable_text (รวม name + brand + sku)
          CASE WHEN all_words_match(p.searchable_text, p_query) THEN 1.0 ELSE 0 END,
          -- Synonym-aware: ถ้า query มี synonym → เช็คทุกคำเหมือนกัน
          CASE WHEN all_words_match(p.name_th, expanded_query) AND expanded_query <> trim(p_query)
               THEN 1.1 ELSE 0 END
        )
      ELSE
        0.5
      END
    ) AS REAL) AS relevance
  FROM products p
  LEFT JOIN product_vehicles pv ON pv.product_id = p.id
  LEFT JOIN product_inventory pinv ON pinv.product_id = p.id
  WHERE
    p.is_active = true
    AND (
      NOT has_query
      -- FTS (AND logic ทุกคำ)
      OR (ts_query IS NOT NULL AND p.search_vector @@ ts_query)
      -- ทุกคำต้อง match (แทน ILIKE ทั้งก้อน)
      OR all_words_match(p.name_th, p_query)
      OR all_words_match(p.name_en, p_query)
      OR all_words_match(p.searchable_text, p_query)
      -- Synonym-aware: expanded query ทุกคำต้อง match
      OR (expanded_query <> trim(p_query) AND all_words_match(p.name_th, expanded_query))
    )
    AND (p_vehicle_id  IS NULL OR pv.vehicle_id = p_vehicle_id)
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_brand       IS NULL OR p.brand ILIKE p_brand)
    AND (p_min_price   IS NULL OR p.price >= p_min_price)
    AND (p_max_price   IS NULL OR p.price <= p_max_price)
    AND (p_in_stock    IS NULL OR (COALESCE(pinv.quantity, 0) > 0) = p_in_stock)
  GROUP BY p.id, p.sku, p.name_th, p.name_en, p.brand, p.price, p.category_id
  ORDER BY
    CASE WHEN has_query THEN 0 ELSE 1 END,
    relevance DESC,
    p.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
