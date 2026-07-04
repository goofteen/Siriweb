-- ลบ policies เก่าที่ใช้ jwt() ->> 'user_role' = 'admin' ซึ่งไม่ทำงานแล้ว
-- เพราะ 20260704000000 สร้าง admin_write_inquiries FOR ALL แทนอยู่แล้ว

DROP POLICY IF EXISTS "admin_read_inquiries" ON inquiries;
DROP POLICY IF EXISTS "admin_update_inquiries" ON inquiries;
