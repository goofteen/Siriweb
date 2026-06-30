-- Storage: product-images bucket policies
-- หมายเหตุ: bucket ต้องสร้างผ่าน Supabase Dashboard หรือ Storage API
-- migration นี้ตั้งค่า RLS policies บน storage.objects

-- ทุกคนดูภาพสินค้าได้ (public read)
CREATE POLICY "public_read_product_images_storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- admin อัปโหลด/แก้ไข/ลบภาพสินค้าได้
CREATE POLICY "admin_upload_product_images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );

CREATE POLICY "admin_update_product_images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );

CREATE POLICY "admin_delete_product_images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );
