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
