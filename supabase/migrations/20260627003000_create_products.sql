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
