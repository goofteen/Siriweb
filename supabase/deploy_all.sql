-- เปิดใช้ extensions สำหรับ smart search
-- pg_trgm: trigram similarity สำหรับ fuzzy search (typo tolerance)
-- unaccent: ลบ accent จากตัวอักษร (ช่วย search ภาษาไทย-อังกฤษ)

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ตั้งค่า trigram similarity threshold (0.2 = รับ typo ได้ดี)
-- ค่า default คือ 0.3 ซึ่งเข้มเกินไปสำหรับ Thai-English mixed search
SELECT set_limit(0.2);
-- ตารางรถยนต์ที่รองรับ
-- Phase 1: รองรับเฉพาะยี่ห้อญี่ปุ่น 8 ยี่ห้อ (ดู DECISIONS.md)

CREATE TABLE vehicles (
  id         SERIAL PRIMARY KEY,
  brand      VARCHAR(50)  NOT NULL,
  model      VARCHAR(100) NOT NULL,
  year_from  INTEGER      NOT NULL,
  year_to    INTEGER      NOT NULL,
  engine     VARCHAR(50),
  created_at TIMESTAMP    DEFAULT NOW(),
  UNIQUE(brand, model, year_from, year_to, engine)
);

CREATE INDEX idx_vehicles_brand ON vehicles(brand);
CREATE INDEX idx_vehicles_model ON vehicles(model);
CREATE INDEX idx_vehicles_brand_model ON vehicles(brand, model);
-- หมวดหมู่สินค้า (2 ระดับ: หลัก + ย่อย)

CREATE TABLE product_categories (
  id          SERIAL  PRIMARY KEY,
  parent_id   INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
  name_th     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100),
  slug        VARCHAR(100) UNIQUE NOT NULL,
  icon        VARCHAR(50),
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_parent   ON product_categories(parent_id);
CREATE INDEX idx_categories_slug     ON product_categories(slug);
CREATE INDEX idx_categories_sort     ON product_categories(sort_order);
-- ตารางสินค้าหลัก พร้อม search columns และ trigger

CREATE TABLE products (
  id               SERIAL PRIMARY KEY,
  sku              VARCHAR(50)   UNIQUE NOT NULL,
  oem_part_number  VARCHAR(100),
  name_th          VARCHAR(255)  NOT NULL,
  name_en          VARCHAR(255),
  description_th   TEXT,
  description_en   TEXT,
  brand            VARCHAR(100),          -- ยี่ห้ออะไหล่ (เช่น Bosch, Brembo, Denso)
  category_id      INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
  price            DECIMAL(10,2) NOT NULL,
  is_active        BOOLEAN       DEFAULT true,

  -- search columns — auto-populated by trigger
  search_vector    tsvector,
  searchable_text  TEXT,

  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- Indexes สำหรับ performance
CREATE INDEX idx_products_fts      ON products USING GIN (search_vector);
CREATE INDEX idx_products_trgm     ON products USING GIN (searchable_text gin_trgm_ops);
CREATE INDEX idx_products_brand    ON products (brand);
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_sku      ON products (sku);
CREATE INDEX idx_products_oem      ON products (oem_part_number);
CREATE INDEX idx_products_active   ON products (is_active) WHERE is_active = true;

-- Trigger auto-update search columns ทุกครั้งที่ INSERT หรือ UPDATE
CREATE OR REPLACE FUNCTION update_product_search_columns()
RETURNS trigger AS $$
BEGIN
  -- search_vector: น้ำหนัก A=SKU/OEM B=ชื่อ C=brand D=description
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.sku, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.oem_part_number, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.name_th, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.name_en, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.brand, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_th, '')), 'D') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_en, '')), 'D');

  -- searchable_text: ทุกอย่างรวมกัน lowercase สำหรับ trigram
  NEW.searchable_text := lower(
    COALESCE(NEW.sku, '') || ' ' ||
    COALESCE(NEW.oem_part_number, '') || ' ' ||
    COALESCE(NEW.name_th, '') || ' ' ||
    COALESCE(NEW.name_en, '') || ' ' ||
    COALESCE(NEW.brand, '') || ' ' ||
    COALESCE(NEW.description_th, '') || ' ' ||
    COALESCE(NEW.description_en, '')
  );

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_columns();
-- ตารางสนับสนุนสินค้า: รูปภาพ, ความเข้ากันได้กับรถ, สต็อก

-- รูปภาพสินค้า (เก็บ URL จาก Supabase Storage)
CREATE TABLE product_images (
  id          SERIAL  PRIMARY KEY,
  product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  url         VARCHAR(500) NOT NULL,
  alt_text    VARCHAR(255),
  sort_order  INTEGER DEFAULT 0,
  is_primary  BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- ความสัมพันธ์สินค้า ↔ รถยนต์ (many-to-many)
CREATE TABLE product_vehicles (
  product_id INTEGER REFERENCES products(id)  ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id)  ON DELETE CASCADE,
  PRIMARY KEY (product_id, vehicle_id)
);

CREATE INDEX idx_product_vehicles_product ON product_vehicles(product_id);
CREATE INDEX idx_product_vehicles_vehicle ON product_vehicles(vehicle_id);

-- สต็อกสินค้า (mock Phase 1 — Win ใส่เองผ่าน Supabase Studio)
CREATE TABLE product_inventory (
  product_id      INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  quantity        INTEGER NOT NULL DEFAULT 0,
  warehouse_code  VARCHAR(20) DEFAULT 'MAIN',
  last_updated    TIMESTAMP DEFAULT NOW()
);

-- View: availability ที่ query สะดวก
CREATE VIEW product_availability AS
SELECT
  p.id,
  p.sku,
  p.name_th,
  p.price,
  COALESCE(pi.quantity, 0) AS quantity,
  CASE WHEN COALESCE(pi.quantity, 0) > 0 THEN true ELSE false END AS in_stock
FROM products p
LEFT JOIN product_inventory pi ON pi.product_id = p.id
WHERE p.is_active = true;
-- ตาราง search_synonyms และ search_logs

-- Synonym dictionary สำหรับ expand query
-- canonical = คำหลัก, synonyms = คำอื่นๆ ที่ลูกค้าใช้
CREATE TABLE search_synonyms (
  id         SERIAL  PRIMARY KEY,
  canonical  VARCHAR(100) NOT NULL,
  synonyms   TEXT[]       NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_synonyms_canonical ON search_synonyms(canonical);

-- Search logs สำหรับ analytics และ zero-result tracking
-- ดู docs/07-SMART-SEARCH-GUIDE.md section 6
CREATE TABLE search_logs (
  id             SERIAL  PRIMARY KEY,
  query          TEXT    NOT NULL,
  results_count  INTEGER NOT NULL,
  session_id     VARCHAR(100),
  vehicle_filter INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Index สำหรับ zero-result analysis (query รายสัปดาห์)
CREATE INDEX idx_search_logs_zero    ON search_logs(created_at) WHERE results_count = 0;
CREATE INDEX idx_search_logs_created ON search_logs(created_at DESC);
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
-- ตาราง sessions, garage, wishlist, inquiries
-- Phase 1: ทุกอย่างทำงานแบบ guest ผ่าน session_id (ไม่ต้อง login)

-- Session tracking สำหรับ guest user
CREATE TABLE sessions (
  id          VARCHAR(100) PRIMARY KEY,
  data        JSONB        DEFAULT '{}',
  expires_at  TIMESTAMP    NOT NULL,
  created_at  TIMESTAMP    DEFAULT NOW(),
  updated_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Garage — รถที่ลูกค้าเพิ่ม (เก็บ 30 วัน)
CREATE TABLE user_vehicles (
  id            SERIAL  PRIMARY KEY,
  session_id    VARCHAR(100) NOT NULL,
  vehicle_id    INTEGER REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  nickname      VARCHAR(100),    -- ลูกค้าตั้งชื่อเอง เช่น "ซีวิคแดง"
  license_plate VARCHAR(20),
  is_primary    BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_vehicles_session ON user_vehicles(session_id);
CREATE INDEX idx_user_vehicles_vehicle ON user_vehicles(vehicle_id);

-- Wishlist — สินค้าที่ลูกค้า save ไว้ (แทน cart ใน Phase 1)
CREATE TABLE wishlist_items (
  id          SERIAL  PRIMARY KEY,
  session_id  VARCHAR(100) NOT NULL,
  product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  note        TEXT,            -- ลูกค้าใส่ note เช่น "สำหรับรถลูก"
  added_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, product_id)
);

CREATE INDEX idx_wishlist_session ON wishlist_items(session_id);

-- Inquiry form — ลูกค้าติดต่อร้าน
CREATE TABLE inquiries (
  id              SERIAL PRIMARY KEY,
  session_id      VARCHAR(100),

  -- ข้อมูลลูกค้า
  customer_name   VARCHAR(255) NOT NULL,
  contact_phone   VARCHAR(20),
  contact_line    VARCHAR(100),    -- Line ID
  contact_email   VARCHAR(255),

  -- บริบท
  vehicle_id      INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  message         TEXT NOT NULL,

  -- สินค้าที่สนใจ (optional, หลายชิ้นได้)
  product_ids     INTEGER[],

  -- status สำหรับ admin
  status          VARCHAR(20) DEFAULT 'new',  -- new | contacted | closed
  admin_notes     TEXT,

  -- metadata
  source          VARCHAR(50),    -- product_page | search | contact_form
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_contact CHECK (
    contact_phone IS NOT NULL OR
    contact_line  IS NOT NULL OR
    contact_email IS NOT NULL
  )
);

CREATE INDEX idx_inquiries_status  ON inquiries(status);
CREATE INDEX idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX idx_inquiries_session ON inquiries(session_id);
-- Row Level Security (RLS) policies
-- สำคัญมากเมื่อใช้ Supabase — frontend เรียก DB ตรงโดยไม่ผ่าน backend

-- เปิด RLS ทุกตาราง
ALTER TABLE vehicles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_vehicles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory  ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_synonyms    ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vehicles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries          ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- Catalog — public read
-- =========================================================

CREATE POLICY "public_read_vehicles"
  ON vehicles FOR SELECT USING (true);

CREATE POLICY "public_read_categories"
  ON product_categories FOR SELECT USING (true);

CREATE POLICY "public_read_products"
  ON products FOR SELECT USING (is_active = true);

CREATE POLICY "public_read_product_images"
  ON product_images FOR SELECT USING (true);

CREATE POLICY "public_read_product_vehicles"
  ON product_vehicles FOR SELECT USING (true);

CREATE POLICY "public_read_product_inventory"
  ON product_inventory FOR SELECT USING (true);

-- =========================================================
-- Catalog — admin write (role ตั้งค่าใน Supabase Auth user metadata)
-- =========================================================

CREATE POLICY "admin_write_vehicles"
  ON vehicles FOR ALL
  USING     ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "admin_write_categories"
  ON product_categories FOR ALL
  USING     ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "admin_write_products"
  ON products FOR ALL
  USING     ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "admin_write_product_images"
  ON product_images FOR ALL
  USING     ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "admin_write_product_vehicles"
  ON product_vehicles FOR ALL
  USING     ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "admin_write_product_inventory"
  ON product_inventory FOR ALL
  USING     ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "admin_write_synonyms"
  ON search_synonyms FOR ALL
  USING     ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK((auth.jwt() ->> 'user_role') = 'admin');

-- =========================================================
-- Search synonyms — public read (เพื่อให้ frontend ดึงได้ถ้าจำเป็น)
-- =========================================================

CREATE POLICY "public_read_synonyms"
  ON search_synonyms FOR SELECT USING (true);

-- =========================================================
-- Search logs — anyone can insert (anonymous tracking)
-- =========================================================

CREATE POLICY "public_insert_search_logs"
  ON search_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_read_search_logs"
  ON search_logs FOR SELECT
  USING ((auth.jwt() ->> 'user_role') = 'admin');

-- =========================================================
-- Sessions — ใช้ session_id จาก header x-session-id
-- =========================================================

CREATE POLICY "session_manage_own_session"
  ON sessions FOR ALL
  USING (
    id = current_setting('request.headers', true)::json->>'x-session-id'
  )
  WITH CHECK (
    id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- =========================================================
-- Garage (user_vehicles) — เฉพาะ session ของตัวเอง
-- =========================================================

CREATE POLICY "session_manage_own_garage"
  ON user_vehicles FOR ALL
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  )
  WITH CHECK (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- =========================================================
-- Wishlist — เฉพาะ session ของตัวเอง
-- =========================================================

CREATE POLICY "session_manage_own_wishlist"
  ON wishlist_items FOR ALL
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  )
  WITH CHECK (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- =========================================================
-- Inquiries — ทุกคนสร้างได้, เฉพาะ admin อ่าน/แก้ได้
-- =========================================================

CREATE POLICY "public_insert_inquiry"
  ON inquiries FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_read_inquiries"
  ON inquiries FOR SELECT
  USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "admin_update_inquiries"
  ON inquiries FOR UPDATE
  USING     ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK((auth.jwt() ->> 'user_role') = 'admin');
