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
