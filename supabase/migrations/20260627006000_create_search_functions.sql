-- PostgreSQL functions สำหรับ smart search
-- ดู docs/07-SMART-SEARCH-GUIDE.md sections 2–3

-- ฟังก์ชัน expand query ด้วย synonym dictionary
CREATE OR REPLACE FUNCTION expand_query_with_synonyms(input_query TEXT)
RETURNS TEXT AS $$
DECLARE
  expanded   TEXT;
  syn_record RECORD;
BEGIN
  expanded := lower(input_query);

  FOR syn_record IN
    SELECT canonical, synonyms FROM search_synonyms
    WHERE lower(input_query) LIKE '%' || lower(canonical) || '%'
       OR EXISTS (
         SELECT 1 FROM unnest(synonyms) AS s
         WHERE lower(input_query) LIKE '%' || lower(s) || '%'
       )
  LOOP
    expanded := expanded
      || ' ' || syn_record.canonical
      || ' ' || array_to_string(syn_record.synonyms, ' ');
  END LOOP;

  RETURN expanded;
END;
$$ LANGUAGE plpgsql STABLE;

-- ฟังก์ชัน smart_search หลัก
-- รวม FTS + trigram + synonym ในการ query เดียว
-- parameters ส่วนใหญ่ optional ใช้ NULL สำหรับ "ไม่ filter"
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
  -- ถ้า query สั้นเกิน 2 ตัวอักษร return ว่าง
  IF length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  -- expand query ด้วย synonym
  expanded_query := expand_query_with_synonyms(trim(p_query));

  -- สร้าง tsquery (websearch_to_tsquery tolerant กว่า to_tsquery)
  BEGIN
    ts_query := websearch_to_tsquery('simple', expanded_query);
  EXCEPTION WHEN OTHERS THEN
    ts_query := plainto_tsquery('simple', expanded_query);
  END;

  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.sku,
    p.name_th,
    p.name_en,
    p.brand,
    p.price,
    p.category_id,
    GREATEST(
      -- FTS score (× 2.0 เพราะ structured match น่าเชื่อถือกว่า)
      ts_rank_cd(p.search_vector, ts_query) * 2.0,
      -- Trigram score (สำคัญสำหรับไทย + typo)
      similarity(p.searchable_text, lower(p_query)) * 1.5,
      -- Exact substring (สำคัญสำหรับ part number)
      CASE WHEN p.searchable_text LIKE '%' || lower(p_query) || '%'
           THEN 1.0 ELSE 0 END
    ) AS relevance
  FROM products p
  LEFT JOIN product_vehicles pv ON pv.product_id = p.id
  LEFT JOIN product_inventory pinv ON pinv.product_id = p.id
  WHERE
    p.is_active = true
    -- match อย่างน้อย 1 ใน 3 วิธี
    AND (
      p.search_vector @@ ts_query
      OR p.searchable_text % lower(p_query)
      OR p.searchable_text LIKE '%' || lower(p_query) || '%'
    )
    -- optional filters
    AND (p_vehicle_id  IS NULL OR pv.vehicle_id = p_vehicle_id)
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_brand       IS NULL OR p.brand ILIKE p_brand)
    AND (p_min_price   IS NULL OR p.price >= p_min_price)
    AND (p_max_price   IS NULL OR p.price <= p_max_price)
    AND (p_in_stock    IS NULL OR (COALESCE(pinv.quantity, 0) > 0) = p_in_stock)
  ORDER BY relevance DESC, COALESCE(pinv.quantity, 0) > 0 DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
