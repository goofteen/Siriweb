-- เพิ่ม mime types ที่รองรับ (รวม SVG)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]
WHERE id = 'product-images';
