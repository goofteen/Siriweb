-- ตารางสาขา
CREATE TABLE branches (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  code       VARCHAR(20)  UNIQUE NOT NULL,
  is_active  BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- seed สาขาเริ่มต้น (แก้ไขได้ใน Supabase Dashboard)
INSERT INTO branches (name, code, sort_order) VALUES
  ('สาขาหลัก',    'MAIN', 0),
  ('สามัคคี',     'SMK',  1),
  ('บางบัวทอง',   'BBT',  2),
  ('เชียงราย',    'CRI',  3);

-- สต็อกแยกรายสาขา (optional per product)
CREATE TABLE product_inventory_branches (
  product_id   INTEGER REFERENCES products(id) ON DELETE CASCADE,
  branch_id    INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  quantity     INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (product_id, branch_id)
);

CREATE INDEX idx_pib_product ON product_inventory_branches(product_id);
CREATE INDEX idx_pib_branch  ON product_inventory_branches(branch_id);

-- RLS
ALTER TABLE branches                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_branches" ON branches FOR SELECT USING (true);
CREATE POLICY "admin_write_branches" ON branches FOR ALL
  USING     ((auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin')
  WITH CHECK((auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin');

CREATE POLICY "public_read_pib" ON product_inventory_branches FOR SELECT USING (true);
CREATE POLICY "admin_write_pib" ON product_inventory_branches FOR ALL
  USING     ((auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin')
  WITH CHECK((auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin');
