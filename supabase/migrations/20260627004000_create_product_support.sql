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
