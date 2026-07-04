-- ตาราง banners สำหรับ banner โปรโมชั่นหน้าแรก
CREATE TABLE banners (
  id SERIAL PRIMARY KEY,
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- ทุกคนดู banner ที่ active ได้
CREATE POLICY "public_read_banners" ON banners
  FOR SELECT USING (is_active = true);

-- authenticated user จัดการ banner ได้
CREATE POLICY "admin_write_banners" ON banners
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
