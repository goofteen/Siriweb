-- เปิดใช้ extensions สำหรับ smart search
-- pg_trgm: trigram similarity สำหรับ fuzzy search (typo tolerance)
-- unaccent: ลบ accent จากตัวอักษร (ช่วย search ภาษาไทย-อังกฤษ)

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ตั้งค่า trigram similarity threshold (0.2 = รับ typo ได้ดี)
-- ค่า default คือ 0.3 ซึ่งเข้มเกินไปสำหรับ Thai-English mixed search
SELECT set_limit(0.2);
