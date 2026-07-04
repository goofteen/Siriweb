-- เปลี่ยน policy จาก "เฉพาะ user_role=admin" → "authenticated user ทุกคน"
-- เพราะตอนนี้ทุกคนที่ login ได้ถือว่าเป็น admin ของร้าน

-- ── tables ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_write_vehicles"          ON vehicles;
DROP POLICY IF EXISTS "admin_write_categories"        ON product_categories;
DROP POLICY IF EXISTS "admin_write_products"          ON products;
DROP POLICY IF EXISTS "admin_write_product_images"    ON product_images;
DROP POLICY IF EXISTS "admin_write_product_vehicles"  ON product_vehicles;
DROP POLICY IF EXISTS "admin_write_product_inventory" ON product_inventory;
DROP POLICY IF EXISTS "admin_write_synonyms"          ON search_synonyms;
DROP POLICY IF EXISTS "admin_write_inquiries"         ON inquiries;
DROP POLICY IF EXISTS "admin_write_branches"          ON branches;
DROP POLICY IF EXISTS "admin_write_pib"               ON product_inventory_branches;

CREATE POLICY "admin_write_vehicles"          ON vehicles          FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_categories"        ON product_categories FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_products"          ON products           FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_product_images"    ON product_images     FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_product_vehicles"  ON product_vehicles   FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_product_inventory" ON product_inventory  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_synonyms"          ON search_synonyms    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_inquiries"         ON inquiries          FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_branches"          ON branches           FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_pib"               ON product_inventory_branches FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ── storage ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_upload_product_images"  ON storage.objects;
DROP POLICY IF EXISTS "admin_update_product_images"  ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_product_images"  ON storage.objects;

CREATE POLICY "admin_upload_product_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "admin_update_product_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "admin_delete_product_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');
