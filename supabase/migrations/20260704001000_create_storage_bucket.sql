-- สร้าง bucket "product-images" (lowercase) ให้ถูกต้อง
-- bucket ก่อนหน้าชื่อ "Product-images" (ตัว P ใหญ่) ไม่ตรงกับโค้ด

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,  -- 10 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
