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
