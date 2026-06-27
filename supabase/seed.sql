-- =============================================================
-- Seed Data — Phase 1 (Catalog + Inquiry)
-- =============================================================
-- ลำดับการ insert สำคัญ: ต้อง insert ก่อน reference
-- 1. product_categories
-- 2. vehicles
-- 3. products
-- 4. product_inventory
-- 5. product_images
-- 6. product_vehicles
-- 7. search_synonyms
-- =============================================================

-- =============================================================
-- 1. PRODUCT CATEGORIES (25 รายการ: 10 หลัก + 15 ย่อย)
-- =============================================================

INSERT INTO product_categories (id, parent_id, name_th, name_en, slug, icon, sort_order) VALUES
-- หมวดหลัก
(1,  NULL, 'ระบบเบรก',         'Brake System',       'brakes',       '🛑', 10),
(2,  NULL, 'ระบบช่วงล่าง',     'Suspension',         'suspension',   '🔧', 20),
(3,  NULL, 'ระบบเครื่องยนต์',  'Engine',             'engine',       '⚙️', 30),
(4,  NULL, 'ระบบไฟฟ้า',       'Electrical',         'electrical',   '⚡', 40),
(5,  NULL, 'ระบบแอร์',         'Air Conditioning',   'aircon',       '❄️', 50),
(6,  NULL, 'ตัวถัง/กระจก',     'Body & Glass',       'body',         '🚗', 60),
(7,  NULL, 'ยางและล้อ',        'Tires & Wheels',     'tires',        '🔵', 70),
(8,  NULL, 'ระบบไอเสีย',       'Exhaust System',     'exhaust',      '💨', 80),
(9,  NULL, 'ระบบเกียร์',       'Transmission',       'transmission', '⚙️', 90),
(10, NULL, 'อุปกรณ์ดูแลรักษา', 'Maintenance',        'maintenance',  '🧰', 100),

-- หมวดย่อย: เบรก
(11, 1, 'ผ้าเบรก',      'Brake Pads',   'brake-pads',   NULL, 11),
(12, 1, 'จานเบรก',      'Brake Discs',  'brake-discs',  NULL, 12),
(13, 1, 'น้ำมันเบรก',   'Brake Fluid',  'brake-fluid',  NULL, 13),
(14, 1, 'ลูกสูบเบรก',   'Brake Caliper','brake-caliper',NULL, 14),

-- หมวดย่อย: ช่วงล่าง
(15, 2, 'โช้คอัพ',      'Shock Absorbers','shocks',     NULL, 21),
(16, 2, 'ลูกหมาก',      'Ball Joints',   'ball-joints', NULL, 22),
(17, 2, 'ลูกปืนล้อ',    'Wheel Bearings','bearings',    NULL, 23),
(18, 2, 'ปีกนก',         'Control Arms',  'control-arms',NULL, 24),

-- หมวดย่อย: เครื่องยนต์
(19, 3, 'กรองอากาศ',     'Air Filters',   'air-filters', NULL, 31),
(20, 3, 'กรองน้ำมัน',    'Oil Filters',   'oil-filters', NULL, 32),
(21, 3, 'หัวเทียน',      'Spark Plugs',   'spark-plugs', NULL, 33),
(22, 3, 'สายพาน',        'Timing Belts',  'timing-belts',NULL, 34),
(23, 3, 'หม้อน้ำ',       'Radiators',     'radiators',   NULL, 35),

-- หมวดย่อย: ไฟฟ้า
(24, 4, 'ไดชาร์จ/ไดสตาร์ท','Alternator & Starter','alternator',NULL, 41),

-- หมวดย่อย: แอร์
(25, 5, 'คอมเพรสเซอร์แอร์','AC Compressor','ac-compressor',NULL, 51);

-- reset sequence
SELECT setval('product_categories_id_seq', 25);


-- =============================================================
-- 2. VEHICLES (120 รายการ: 8 ยี่ห้อ × 3-5 รุ่น × 5 ปี)
-- =============================================================

INSERT INTO vehicles (brand, model, year_from, year_to, engine) VALUES
-- TOYOTA (5 รุ่น × 5 ปี = 25 คัน)
('Toyota', 'Camry',      2019, 2019, '2.5L'),
('Toyota', 'Camry',      2020, 2020, '2.5L'),
('Toyota', 'Camry',      2021, 2021, '2.5L'),
('Toyota', 'Camry',      2022, 2022, '2.5L'),
('Toyota', 'Camry',      2023, 2023, '2.5L'),

('Toyota', 'Corolla',    2019, 2019, '1.8L'),
('Toyota', 'Corolla',    2020, 2020, '1.8L'),
('Toyota', 'Corolla',    2021, 2021, '1.8L'),
('Toyota', 'Corolla',    2022, 2022, '1.8L'),
('Toyota', 'Corolla',    2023, 2023, '1.8L'),

('Toyota', 'Vios',       2019, 2019, '1.5L'),
('Toyota', 'Vios',       2020, 2020, '1.5L'),
('Toyota', 'Vios',       2021, 2021, '1.5L'),
('Toyota', 'Vios',       2022, 2022, '1.5L'),
('Toyota', 'Vios',       2023, 2023, '1.5L'),

('Toyota', 'Hilux Revo', 2019, 2019, '2.4L Diesel'),
('Toyota', 'Hilux Revo', 2020, 2020, '2.4L Diesel'),
('Toyota', 'Hilux Revo', 2021, 2021, '2.4L Diesel'),
('Toyota', 'Hilux Revo', 2022, 2022, '2.4L Diesel'),
('Toyota', 'Hilux Revo', 2023, 2023, '2.4L Diesel'),

('Toyota', 'Fortuner',   2019, 2019, '2.4L Diesel'),
('Toyota', 'Fortuner',   2020, 2020, '2.4L Diesel'),
('Toyota', 'Fortuner',   2021, 2021, '2.4L Diesel'),
('Toyota', 'Fortuner',   2022, 2022, '2.4L Diesel'),
('Toyota', 'Fortuner',   2023, 2023, '2.4L Diesel'),

-- HONDA (4 รุ่น × 5 ปี = 20 คัน)
('Honda', 'Civic',       2019, 2019, '1.5L Turbo'),
('Honda', 'Civic',       2020, 2020, '1.5L Turbo'),
('Honda', 'Civic',       2021, 2021, '1.5L Turbo'),
('Honda', 'Civic',       2022, 2022, '1.5L Turbo'),
('Honda', 'Civic',       2023, 2023, '1.5L Turbo'),

('Honda', 'City',        2019, 2019, '1.0L Turbo'),
('Honda', 'City',        2020, 2020, '1.0L Turbo'),
('Honda', 'City',        2021, 2021, '1.0L Turbo'),
('Honda', 'City',        2022, 2022, '1.0L Turbo'),
('Honda', 'City',        2023, 2023, '1.0L Turbo'),

('Honda', 'HR-V',        2019, 2019, '1.8L'),
('Honda', 'HR-V',        2020, 2020, '1.8L'),
('Honda', 'HR-V',        2021, 2021, '1.8L'),
('Honda', 'HR-V',        2022, 2022, '1.5L Turbo'),
('Honda', 'HR-V',        2023, 2023, '1.5L Turbo'),

('Honda', 'CR-V',        2019, 2019, '1.5L Turbo'),
('Honda', 'CR-V',        2020, 2020, '1.5L Turbo'),
('Honda', 'CR-V',        2021, 2021, '1.5L Turbo'),
('Honda', 'CR-V',        2022, 2022, '1.5L Turbo'),
('Honda', 'CR-V',        2023, 2023, '1.5L Turbo'),

-- NISSAN (3 รุ่น × 5 ปี = 15 คัน)
('Nissan', 'Almera',     2019, 2019, '1.0L Turbo'),
('Nissan', 'Almera',     2020, 2020, '1.0L Turbo'),
('Nissan', 'Almera',     2021, 2021, '1.0L Turbo'),
('Nissan', 'Almera',     2022, 2022, '1.0L Turbo'),
('Nissan', 'Almera',     2023, 2023, '1.0L Turbo'),

('Nissan', 'Navara',     2019, 2019, '2.5L Diesel'),
('Nissan', 'Navara',     2020, 2020, '2.5L Diesel'),
('Nissan', 'Navara',     2021, 2021, '2.5L Diesel'),
('Nissan', 'Navara',     2022, 2022, '2.5L Diesel'),
('Nissan', 'Navara',     2023, 2023, '2.5L Diesel'),

('Nissan', 'X-Trail',    2019, 2019, '2.0L'),
('Nissan', 'X-Trail',    2020, 2020, '2.0L'),
('Nissan', 'X-Trail',    2021, 2021, '2.0L'),
('Nissan', 'X-Trail',    2022, 2022, '2.0L'),
('Nissan', 'X-Trail',    2023, 2023, '2.0L'),

-- MAZDA (3 รุ่น × 5 ปี = 15 คัน)
('Mazda', 'Mazda2',      2019, 2019, '1.3L'),
('Mazda', 'Mazda2',      2020, 2020, '1.3L'),
('Mazda', 'Mazda2',      2021, 2021, '1.3L'),
('Mazda', 'Mazda2',      2022, 2022, '1.3L'),
('Mazda', 'Mazda2',      2023, 2023, '1.3L'),

('Mazda', 'Mazda3',      2019, 2019, '2.0L'),
('Mazda', 'Mazda3',      2020, 2020, '2.0L'),
('Mazda', 'Mazda3',      2021, 2021, '2.0L'),
('Mazda', 'Mazda3',      2022, 2022, '2.0L'),
('Mazda', 'Mazda3',      2023, 2023, '2.0L'),

('Mazda', 'CX-5',        2019, 2019, '2.0L'),
('Mazda', 'CX-5',        2020, 2020, '2.0L'),
('Mazda', 'CX-5',        2021, 2021, '2.0L'),
('Mazda', 'CX-5',        2022, 2022, '2.0L'),
('Mazda', 'CX-5',        2023, 2023, '2.0L'),

-- MITSUBISHI (3 รุ่น × 5 ปี = 15 คัน)
('Mitsubishi', 'Mirage',       2019, 2019, '1.2L'),
('Mitsubishi', 'Mirage',       2020, 2020, '1.2L'),
('Mitsubishi', 'Mirage',       2021, 2021, '1.2L'),
('Mitsubishi', 'Mirage',       2022, 2022, '1.2L'),
('Mitsubishi', 'Mirage',       2023, 2023, '1.2L'),

('Mitsubishi', 'Pajero Sport', 2019, 2019, '2.4L Diesel'),
('Mitsubishi', 'Pajero Sport', 2020, 2020, '2.4L Diesel'),
('Mitsubishi', 'Pajero Sport', 2021, 2021, '2.4L Diesel'),
('Mitsubishi', 'Pajero Sport', 2022, 2022, '2.4L Diesel'),
('Mitsubishi', 'Pajero Sport', 2023, 2023, '2.4L Diesel'),

('Mitsubishi', 'Triton',       2019, 2019, '2.4L Diesel'),
('Mitsubishi', 'Triton',       2020, 2020, '2.4L Diesel'),
('Mitsubishi', 'Triton',       2021, 2021, '2.4L Diesel'),
('Mitsubishi', 'Triton',       2022, 2022, '2.4L Diesel'),
('Mitsubishi', 'Triton',       2023, 2023, '2.4L Diesel'),

-- ISUZU (2 รุ่น × 5 ปี = 10 คัน)
('Isuzu', 'D-Max',       2019, 2019, '1.9L Diesel'),
('Isuzu', 'D-Max',       2020, 2020, '1.9L Diesel'),
('Isuzu', 'D-Max',       2021, 2021, '1.9L Diesel'),
('Isuzu', 'D-Max',       2022, 2022, '1.9L Diesel'),
('Isuzu', 'D-Max',       2023, 2023, '1.9L Diesel'),

('Isuzu', 'MU-X',        2019, 2019, '1.9L Diesel'),
('Isuzu', 'MU-X',        2020, 2020, '1.9L Diesel'),
('Isuzu', 'MU-X',        2021, 2021, '3.0L Diesel'),
('Isuzu', 'MU-X',        2022, 2022, '3.0L Diesel'),
('Isuzu', 'MU-X',        2023, 2023, '3.0L Diesel'),

-- SUZUKI (2 รุ่น × 5 ปี = 10 คัน)
('Suzuki', 'Swift',      2019, 2019, '1.2L'),
('Suzuki', 'Swift',      2020, 2020, '1.2L'),
('Suzuki', 'Swift',      2021, 2021, '1.2L'),
('Suzuki', 'Swift',      2022, 2022, '1.2L'),
('Suzuki', 'Swift',      2023, 2023, '1.2L'),

('Suzuki', 'Ertiga',     2019, 2019, '1.5L'),
('Suzuki', 'Ertiga',     2020, 2020, '1.5L'),
('Suzuki', 'Ertiga',     2021, 2021, '1.5L'),
('Suzuki', 'Ertiga',     2022, 2022, '1.5L'),
('Suzuki', 'Ertiga',     2023, 2023, '1.5L'),

-- SUBARU (2 รุ่น × 5 ปี = 10 คัน)
('Subaru', 'Forester',   2019, 2019, '2.0L'),
('Subaru', 'Forester',   2020, 2020, '2.0L'),
('Subaru', 'Forester',   2021, 2021, '2.0L'),
('Subaru', 'Forester',   2022, 2022, '2.0L'),
('Subaru', 'Forester',   2023, 2023, '2.0L'),

('Subaru', 'XV',         2019, 2019, '2.0L'),
('Subaru', 'XV',         2020, 2020, '2.0L'),
('Subaru', 'XV',         2021, 2021, '2.0L'),
('Subaru', 'XV',         2022, 2022, '2.0L'),
('Subaru', 'XV',         2023, 2023, '2.0L');

-- total: 120 vehicles


-- =============================================================
-- 3. PRODUCTS (62 รายการ)
-- =============================================================

INSERT INTO products (sku, oem_part_number, name_th, name_en, description_th, brand, category_id, price) VALUES

-- ผ้าเบรก (category 11)
('BP-HC-001', '45022-TBA-A01', 'ผ้าเบรกหน้า Honda Civic 2017-2023', 'Front Brake Pads Honda Civic',
 'ผ้าเบรกหน้าคุณภาพสูง สำหรับ Honda Civic ทุกรุ่นตั้งแต่ปี 2017-2023 วัสดุ semi-metallic ลดฝุ่นและเสียง', 'Brembo', 11, 1290.00),

('BP-TC-001', '04465-02200', 'ผ้าเบรกหน้า Toyota Camry 2019-2023', 'Front Brake Pads Toyota Camry',
 'ผ้าเบรกหน้า OEM Toyota Camry ปี 2019-2023 ตรงรุ่น 100%', 'Toyota Genuine', 11, 1890.00),

('BP-TV-001', '04465-0D280', 'ผ้าเบรกหน้า Toyota Vios 2019-2023', 'Front Brake Pads Toyota Vios',
 'ผ้าเบรกหน้าสำหรับ Toyota Vios ปี 2019-2023 วัสดุ ceramic ประสิทธิภาพดี', 'Bosch', 11, 890.00),

('BP-ID-001', NULL, 'ผ้าเบรกหน้า Isuzu D-Max 2019-2023', 'Front Brake Pads Isuzu D-Max',
 'ผ้าเบรกหน้าสำหรับ Isuzu D-Max ทุกปี 2019-2023 วัสดุ heavy-duty เหมาะกับรถกระบะบรรทุก', 'Bendix', 11, 1490.00),

('BP-HCV-001', NULL, 'ผ้าเบรกหน้า Honda City 2020-2023', 'Front Brake Pads Honda City',
 'ผ้าเบรกหน้า Honda City ปี 2020-2023 ลดฝุ่นและเสียงดัง', 'Bosch', 11, 990.00),

('BP-NR-001', NULL, 'ผ้าเบรกหน้า Nissan Navara 2019-2023', 'Front Brake Pads Nissan Navara',
 'ผ้าเบรกหน้า Nissan Navara สำหรับรถกระบะ ทนทานใช้งานหนัก', 'Bendix', 11, 1390.00),

-- ผ้าเบรกหลัง
('BP-HC-002', '43022-TBA-A01', 'ผ้าเบรกหลัง Honda Civic 2017-2023', 'Rear Brake Pads Honda Civic',
 'ผ้าเบรกหลัง Honda Civic สำหรับรถที่มีดิสเบรกหลัง', 'Brembo', 11, 1090.00),

('BP-TC-002', '04466-06170', 'ผ้าเบรกหลัง Toyota Camry 2019-2023', 'Rear Brake Pads Toyota Camry',
 'ผ้าเบรกหลัง Toyota Camry ตรงรุ่น คุณภาพ OEM', 'Toyota Genuine', 11, 1690.00),

-- จานเบรก (category 12)
('BD-HC-001', '45251-TBA-A00', 'จานเบรกหน้า Honda Civic 2017-2023', 'Front Brake Disc Honda Civic',
 'จานเบรกหน้า Honda Civic เจาะระบาย ventilated ลดความร้อนได้ดี', 'Brembo', 12, 2490.00),

('BD-TC-001', '43512-06170', 'จานเบรกหน้า Toyota Camry 2019-2023', 'Front Brake Disc Toyota Camry',
 'จานเบรกหน้า Toyota Camry คุณภาพ OEM ความหนาพอดีสำหรับรถยนต์ขนาดกลาง', 'Toyota Genuine', 12, 3290.00),

('BD-ID-001', NULL, 'จานเบรกหน้า Isuzu D-Max 2019-2023', 'Front Brake Disc Isuzu D-Max',
 'จานเบรกหน้า Isuzu D-Max ขนาด 296mm ventilated ทนต่อการใช้งานหนัก', 'TRW', 12, 2890.00),

-- น้ำมันเบรก (category 13)
('BF-DOT4-500', NULL, 'น้ำมันเบรก DOT4 500ml', 'Brake Fluid DOT4 500ml',
 'น้ำมันเบรก DOT4 จุดเดือดสูง 260°C dry boiling point เหมาะกับอากาศร้อนไทย', 'Bosch', 13, 290.00),

('BF-DOT3-500', NULL, 'น้ำมันเบรก DOT3 500ml', 'Brake Fluid DOT3 500ml',
 'น้ำมันเบรก DOT3 มาตรฐาน FMVSS 116 ใช้ได้กับรถทั่วไป', 'Motul', 13, 190.00),

-- โช้คอัพ (category 15)
('SA-HC-F01', '51605-TBA-A03', 'โช้คอัพหน้า Honda Civic 2017-2023', 'Front Shock Absorber Honda Civic',
 'โช้คอัพหน้า Honda Civic ปี 2017-2023 twin-tube gas pressure ขับนุ่มสบาย', 'Monroe', 15, 3490.00),

('SA-TC-F01', '48510-06470', 'โช้คอัพหน้า Toyota Camry 2019-2023', 'Front Shock Absorber Toyota Camry',
 'โช้คอัพหน้า Toyota Camry ตรงรุ่น คุณภาพ OEM', 'KYB', 15, 4290.00),

('SA-ID-F01', NULL, 'โช้คอัพหน้า Isuzu D-Max 2019-2023', 'Front Shock Absorber Isuzu D-Max',
 'โช้คอัพหน้า Isuzu D-Max heavy-duty รับน้ำหนักได้มากสำหรับรถกระบะ', 'KYB', 15, 3890.00),

('SA-HC-R01', '52610-TBA-A13', 'โช้คอัพหลัง Honda Civic 2017-2023', 'Rear Shock Absorber Honda Civic',
 'โช้คอัพหลัง Honda Civic ตรงรุ่น ให้ความนุ่มและเสถียรภาพ', 'Monroe', 15, 2990.00),

('SA-TV-F01', NULL, 'โช้คอัพหน้า Toyota Vios 2019-2023', 'Front Shock Absorber Toyota Vios',
 'โช้คอัพหน้า Toyota Vios ปี 2019-2023 ตรงรุ่น', 'KYB', 15, 2890.00),

('SA-MCX-F01', NULL, 'โช้คอัพหน้า Mazda CX-5 2019-2023', 'Front Shock Absorber Mazda CX-5',
 'โช้คอัพหน้า Mazda CX-5 gas pressure twin-tube', 'Monroe', 15, 4490.00),

-- ลูกหมาก (category 16)
('BJ-HC-001', '51220-TBA-A01', 'ลูกหมากปีกนกล่าง Honda Civic 2017-2023', 'Lower Ball Joint Honda Civic',
 'ลูกหมากปีกนกล่าง Honda Civic ตรงรุ่น ลดอาการพวงมาลัยสั่น', 'Moog', 16, 890.00),

('BJ-TC-001', '43330-09280', 'ลูกหมากปีกนกล่าง Toyota Camry 2018-2023', 'Lower Ball Joint Toyota Camry',
 'ลูกหมากปีกนกล่าง Toyota Camry แบบ sealed ไม่ต้องอัดจาระบี', 'TRW', 16, 1290.00),

('BJ-ID-001', NULL, 'ลูกหมากปีกนกล่าง Isuzu D-Max 2019-2023', 'Lower Ball Joint Isuzu D-Max',
 'ลูกหมากปีกนกล่าง Isuzu D-Max heavy-duty สำหรับรถกระบะ', 'Moog', 16, 1490.00),

-- ลูกปืนล้อ (category 17)
('WB-HC-F01', '44300-TBA-A02', 'ลูกปืนล้อหน้า Honda Civic 2017-2023', 'Front Wheel Bearing Honda Civic',
 'ลูกปืนล้อหน้าแบบ hub bearing assembly Honda Civic พร้อมดุม', 'FAG', 17, 2890.00),

('WB-TC-F01', '43550-06080', 'ลูกปืนล้อหน้า Toyota Camry 2018-2023', 'Front Wheel Bearing Toyota Camry',
 'ลูกปืนล้อหน้า Toyota Camry hub assembly ติดตั้งง่าย', 'SKF', 17, 3290.00),

('WB-TV-F01', NULL, 'ลูกปืนล้อหน้า Toyota Vios 2019-2023', 'Front Wheel Bearing Toyota Vios',
 'ลูกปืนล้อหน้า Toyota Vios hub assembly ตรงรุ่น', 'NSK', 17, 2490.00),

-- กรองอากาศ (category 19)
('AF-HC-001', '17220-5PA-A00', 'กรองอากาศ Honda Civic 2017-2023', 'Air Filter Honda Civic',
 'กรองอากาศ Honda Civic ประสิทธิภาพกรองฝุ่น 99% เปลี่ยนทุก 30,000 กม.', 'Bosch', 19, 390.00),

('AF-TC-001', '17801-31120', 'กรองอากาศ Toyota Camry 2018-2023', 'Air Filter Toyota Camry',
 'กรองอากาศ Toyota Camry กรองฝุ่นละเอียด ปกป้องเครื่องยนต์', 'Toyota Genuine', 19, 490.00),

('AF-TV-001', '17801-21060', 'กรองอากาศ Toyota Vios 2019-2023', 'Air Filter Toyota Vios',
 'กรองอากาศ Toyota Vios ตรงรุ่น คุณภาพ OEM', 'Denso', 19, 290.00),

('AF-HCV-001', '17220-5AA-A00', 'กรองอากาศ Honda City 2020-2023', 'Air Filter Honda City',
 'กรองอากาศ Honda City ปี 2020-2023 ตรงรุ่น', 'Bosch', 19, 350.00),

('AF-ID-001', NULL, 'กรองอากาศ Isuzu D-Max 2019-2023', 'Air Filter Isuzu D-Max',
 'กรองอากาศ Isuzu D-Max diesel engine กรองฝุ่นละเอียดเป็นพิเศษ', 'Fleetguard', 19, 590.00),

('AF-MCX-001', NULL, 'กรองอากาศ Mazda CX-5 2019-2023', 'Air Filter Mazda CX-5',
 'กรองอากาศ Mazda CX-5 ตรงรุ่น คุณภาพ OEM', 'Bosch', 19, 490.00),

-- กรองน้ำมัน (category 20)
('OF-HC-001', '15400-RTA-003', 'กรองน้ำมันเครื่อง Honda (universal)', 'Oil Filter Honda',
 'กรองน้ำมันเครื่อง Honda ใช้ได้กับหลายรุ่น Civic, City, HR-V anti-drain valve built-in', 'Bosch', 20, 190.00),

('OF-TC-001', '90915-YZZD4', 'กรองน้ำมันเครื่อง Toyota (universal)', 'Oil Filter Toyota',
 'กรองน้ำมันเครื่อง Toyota ใช้ได้กับ Camry, Corolla, Vios, Fortuner', 'Toyota Genuine', 20, 220.00),

('OF-ID-001', NULL, 'กรองน้ำมันเครื่อง Isuzu D-Max/MU-X', 'Oil Filter Isuzu D-Max/MU-X',
 'กรองน้ำมันเครื่อง Isuzu diesel สำหรับ D-Max และ MU-X', 'Fleetguard', 20, 290.00),

('OF-NV-001', NULL, 'กรองน้ำมันเครื่อง Nissan Navara', 'Oil Filter Nissan Navara',
 'กรองน้ำมันเครื่อง Nissan Navara diesel', 'Bosch', 20, 250.00),

-- หัวเทียน (category 21)
('SP-HC-001', 'NGK-IZFR6K13', 'หัวเทียน Iridium Honda Civic 2017-2023', 'Iridium Spark Plug Honda Civic',
 'หัวเทียน Iridium NGK ให้ประกายไฟแรง ลดการสิ้นเปลือง เปลี่ยนทุก 100,000 กม.', 'NGK', 21, 390.00),

('SP-TC-001', 'DENSO-IKH20TT', 'หัวเทียน Iridium Toyota Camry/Corolla', 'Iridium Spark Plug Toyota',
 'หัวเทียน Iridium DENSO สำหรับ Toyota Camry, Corolla, Vios ปี 2019+', 'Denso', 21, 450.00),

('SP-TV-001', 'NGK-ILZKR7B11', 'หัวเทียน Iridium Toyota Vios 2019-2023', 'Iridium Spark Plug Toyota Vios',
 'หัวเทียน Iridium NGK ตรงรุ่น Toyota Vios ประสิทธิภาพสูง', 'NGK', 21, 380.00),

-- สายพาน (category 22)
('TB-HC-001', '14400-5PA-A01', 'ชุดสายพานราวลิ้น Honda Civic 1.5T 2017-2023', 'Timing Belt Kit Honda Civic',
 'ชุดสายพานราวลิ้นพร้อมลูกลิ้น Honda Civic 1.5L Turbo เปลี่ยนทุก 60,000 กม.', 'Gates', 22, 2890.00),

('TB-TC-001', '13568-31021', 'ชุดสายพานราวลิ้น Toyota Camry 2.5L 2018-2023', 'Timing Belt Kit Toyota Camry',
 'ชุดสายพานราวลิ้นพร้อมตุ๊กตา Toyota Camry 2.5L DOHC', 'Gates', 22, 3290.00),

('TB-ID-001', NULL, 'สายพานพัดลม Isuzu D-Max 1.9 Diesel', 'Drive Belt Isuzu D-Max',
 'สายพานพัดลมและไดชาร์จ Isuzu D-Max 1.9L diesel', 'Gates', 22, 890.00),

-- หม้อน้ำ (category 23)
('RD-HC-001', '19010-5PA-A52', 'หม้อน้ำ Honda Civic 2017-2023', 'Radiator Honda Civic',
 'หม้อน้ำ Honda Civic ปี 2017-2023 อลูมิเนียมคุณภาพสูง ระบายความร้อนดีกว่า OEM 15%', 'Denso', 23, 4890.00),

('RD-ID-001', NULL, 'หม้อน้ำ Isuzu D-Max 2019-2023', 'Radiator Isuzu D-Max',
 'หม้อน้ำ Isuzu D-Max 1.9L diesel อลูมิเนียม ความจุ 7.5L', 'NRF', 23, 5490.00),

('RD-TF-001', '16400-0P060', 'หม้อน้ำ Toyota Fortuner 2019-2023', 'Radiator Toyota Fortuner',
 'หม้อน้ำ Toyota Fortuner ปี 2019-2023 ระบายความร้อนได้ดีสำหรับ SUV ขนาดใหญ่', 'Denso', 23, 6290.00),

-- ไดชาร์จ/ไดสตาร์ท (category 24)
('ALT-HC-001', '31100-5PA-A01', 'ไดชาร์จ Honda Civic 1.5T 2017-2023', 'Alternator Honda Civic',
 'ไดชาร์จ Honda Civic 1.5L Turbo ปี 2017-2023 กำลัง 120A', 'Denso', 24, 8900.00),

('ALT-TC-001', '27060-31020', 'ไดชาร์จ Toyota Camry 2.5L 2018-2023', 'Alternator Toyota Camry',
 'ไดชาร์จ Toyota Camry 2.5L ปี 2018-2023 กำลัง 150A OEM quality', 'Denso', 24, 11500.00),

('STR-HC-001', '31200-5PA-A51', 'ไดสตาร์ท Honda Civic 2017-2023', 'Starter Motor Honda Civic',
 'ไดสตาร์ท Honda Civic ปี 2017-2023 สตาร์ทได้แรง ทนทาน', 'Bosch', 24, 7800.00),

-- แบตเตอรี่ (ใต้ ไฟฟ้า = cat 4 แต่ไม่มี sub ให้ใส่ใน electrical หลัก)
('BAT-55B-001', NULL, 'แบตเตอรี่ 55B24L (พร้อมน้ำยา)', 'Battery 55B24L',
 'แบตเตอรี่ 55B24L ความจุ 45Ah CCA 430A เหมาะกับ Honda City, Vios, Almera', 'Panasonic', 4, 2890.00),

('BAT-75D-001', NULL, 'แบตเตอรี่ 75D26L (พร้อมน้ำยา)', 'Battery 75D26L',
 'แบตเตอรี่ 75D26L ความจุ 68Ah CCA 620A เหมาะกับ Camry, Fortuner, Pajero Sport', 'GS', 4, 3990.00),

-- คอมเพรสเซอร์แอร์ (category 25)
('AC-HC-001', '38810-5PA-A02', 'คอมเพรสเซอร์แอร์ Honda Civic 2017-2023', 'AC Compressor Honda Civic',
 'คอมเพรสเซอร์แอร์ Honda Civic 2017-2023 น้ำยา R134a ทำงานเงียบ ลดการสิ้นเปลือง', 'Denso', 25, 12800.00),

('AC-TC-001', '88310-06420', 'คอมเพรสเซอร์แอร์ Toyota Camry 2018-2023', 'AC Compressor Toyota Camry',
 'คอมเพรสเซอร์แอร์ Toyota Camry ตรงรุ่น คุณภาพ OEM น้ำยา R134a', 'Denso', 25, 15800.00),

('AC-ID-001', NULL, 'คอมเพรสเซอร์แอร์ Isuzu D-Max 2019-2023', 'AC Compressor Isuzu D-Max',
 'คอมเพรสเซอร์แอร์ Isuzu D-Max 1.9L diesel ตรงรุ่น', 'Sanden', 25, 11500.00),

-- ปีกนก (category 18)
('CA-HC-001', '51360-TBA-A01', 'ปีกนกล่างซ้าย Honda Civic 2017-2023', 'Lower Control Arm LH Honda Civic',
 'ปีกนกล่างซ้าย Honda Civic พร้อมลูกหมากในตัว ลดอาการยาง eat', 'Moog', 18, 4290.00),

('CA-HC-002', '51350-TBA-A01', 'ปีกนกล่างขวา Honda Civic 2017-2023', 'Lower Control Arm RH Honda Civic',
 'ปีกนกล่างขวา Honda Civic พร้อมลูกหมาก ตรงรุ่น', 'Moog', 18, 4290.00),

('CA-TC-001', '48068-06130', 'ปีกนกล่างซ้าย Toyota Camry 2018-2023', 'Lower Control Arm LH Toyota Camry',
 'ปีกนกล่างซ้าย Toyota Camry ปี 2018-2023 ตรงรุ่น', 'TRW', 18, 5490.00),

-- กรองแอร์เคบิน (maintenance cat 10)
('CF-HC-001', '80292-TBA-A41', 'กรองแอร์เคบิน Honda Civic 2017-2023', 'Cabin Air Filter Honda Civic',
 'กรองแอร์เคบิน Honda Civic กรองฝุ่น PM2.5 และดักจับเกสรดอกไม้ เปลี่ยนทุก 15,000 กม.', 'Bosch', 10, 390.00),

('CF-TC-001', '87139-06080', 'กรองแอร์เคบิน Toyota Camry/Corolla/Vios', 'Cabin Air Filter Toyota',
 'กรองแอร์เคบิน Toyota ใช้ได้กับหลายรุ่น คุณภาพ OEM', 'Toyota Genuine', 10, 490.00),

('CF-ID-001', NULL, 'กรองแอร์เคบิน Isuzu D-Max 2019-2023', 'Cabin Air Filter Isuzu D-Max',
 'กรองแอร์เคบิน Isuzu D-Max ปี 2019-2023 ตรงรุ่น', 'Bosch', 10, 390.00);

-- total: 62 products


-- =============================================================
-- 4. PRODUCT INVENTORY (สต็อก mock)
-- =============================================================

INSERT INTO product_inventory (product_id, quantity, warehouse_code)
SELECT id, (RANDOM() * 50 + 5)::INTEGER, 'MAIN'
FROM products;


-- =============================================================
-- 5. PRODUCT IMAGES (placeholder URLs — Win ใส่รูปจริงทีหลัง)
-- =============================================================

INSERT INTO product_images (product_id, url, alt_text, is_primary)
SELECT
  id,
  'https://placehold.co/600x400/e2e8f0/64748b?text=' || sku,
  name_th,
  true
FROM products;


-- =============================================================
-- 6. PRODUCT ↔ VEHICLE LINKS
-- =============================================================

-- Helper: เชื่อม product กับ vehicles ตาม brand + model
-- ผ้าเบรกหน้า Honda Civic → Honda Civic 2019-2023
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('BP-HC-001', 'BP-HC-002', 'SA-HC-F01', 'SA-HC-R01',
                'BJ-HC-001', 'WB-HC-F01', 'AF-HC-001', 'OF-HC-001',
                'SP-HC-001', 'TB-HC-001', 'RD-HC-001', 'ALT-HC-001',
                'STR-HC-001', 'AC-HC-001', 'CA-HC-001', 'CA-HC-002',
                'CF-HC-001')
  AND v.brand = 'Honda' AND v.model = 'Civic';

-- Honda City
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('BP-HCV-001', 'AF-HCV-001', 'OF-HC-001', 'BAT-55B-001', 'CF-HC-001')
  AND v.brand = 'Honda' AND v.model = 'City';

-- Honda HR-V
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('OF-HC-001', 'AF-HC-001', 'BAT-55B-001')
  AND v.brand = 'Honda' AND v.model = 'HR-V';

-- Honda CR-V
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('OF-HC-001', 'BAT-75D-001')
  AND v.brand = 'Honda' AND v.model = 'CR-V';

-- Toyota Camry
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('BP-TC-001', 'BP-TC-002', 'BD-TC-001', 'SA-TC-F01',
                'BJ-TC-001', 'WB-TC-F01', 'AF-TC-001', 'OF-TC-001',
                'SP-TC-001', 'TB-TC-001', 'ALT-TC-001', 'AC-TC-001',
                'CA-TC-001', 'CF-TC-001', 'BAT-75D-001')
  AND v.brand = 'Toyota' AND v.model = 'Camry';

-- Toyota Vios
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('BP-TV-001', 'SA-TV-F01', 'WB-TV-F01', 'AF-TV-001',
                'OF-TC-001', 'SP-TV-001', 'CF-TC-001', 'BAT-55B-001')
  AND v.brand = 'Toyota' AND v.model = 'Vios';

-- Toyota Corolla
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('OF-TC-001', 'AF-TC-001', 'SP-TC-001', 'CF-TC-001', 'BAT-55B-001')
  AND v.brand = 'Toyota' AND v.model = 'Corolla';

-- Toyota Fortuner
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('OF-TC-001', 'RD-TF-001', 'BAT-75D-001', 'CF-TC-001')
  AND v.brand = 'Toyota' AND v.model = 'Fortuner';

-- Toyota Hilux Revo
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('OF-TC-001', 'BAT-75D-001')
  AND v.brand = 'Toyota' AND v.model = 'Hilux Revo';

-- Isuzu D-Max
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('BP-ID-001', 'BD-ID-001', 'SA-ID-F01', 'BJ-ID-001',
                'AF-ID-001', 'OF-ID-001', 'TB-ID-001', 'RD-ID-001',
                'AC-ID-001', 'CF-ID-001', 'BAT-75D-001')
  AND v.brand = 'Isuzu' AND v.model = 'D-Max';

-- Isuzu MU-X
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('OF-ID-001', 'BAT-75D-001')
  AND v.brand = 'Isuzu' AND v.model = 'MU-X';

-- Nissan Navara
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('BP-NR-001', 'OF-NV-001', 'BAT-75D-001')
  AND v.brand = 'Nissan' AND v.model = 'Navara';

-- Nissan Almera
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('BAT-55B-001')
  AND v.brand = 'Nissan' AND v.model = 'Almera';

-- Mazda CX-5
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('SA-MCX-F01', 'AF-MCX-001', 'BAT-75D-001')
  AND v.brand = 'Mazda' AND v.model = 'CX-5';

-- Mazda2, Mazda3
INSERT INTO product_vehicles (product_id, vehicle_id)
SELECT p.id, v.id
FROM products p, vehicles v
WHERE p.sku IN ('BAT-55B-001')
  AND v.brand = 'Mazda' AND v.model IN ('Mazda2', 'Mazda3');


-- =============================================================
-- 7. SEARCH SYNONYMS (50 entries)
-- =============================================================

INSERT INTO search_synonyms (canonical, synonyms) VALUES
-- ระบบเบรก
('ผ้าเบรก',       ARRAY['brake pad', 'brake-pad', 'ผ้าดิส', 'ผ้าดิสเบรก', 'ผ้าเบรค', 'brakepad', 'brake pads']),
('จานเบรก',       ARRAY['brake disc', 'brake rotor', 'จานดิส', 'ดิสเบรก', 'ดิสก์เบรก', 'rotor']),
('น้ำมันเบรก',    ARRAY['brake fluid', 'น้ำมันเบรค', 'dot3', 'dot4', 'dot 4', 'brake oil']),
('ลูกสูบเบรก',    ARRAY['caliper', 'brake caliper', 'ลูกสูบ']),

-- ระบบช่วงล่าง
('โช้คอัพ',       ARRAY['shock absorber', 'shock', 'โช้ค', 'โช๊คอัพ', 'damper', 'strut', 'โช้คกระบอก']),
('ลูกหมาก',       ARRAY['ball joint', 'ลูกหมากปีกนก', 'บอลจอยต์']),
('ลูกปืนล้อ',     ARRAY['wheel bearing', 'แบริ่งล้อ', 'bearing', 'hub bearing', 'ลูกปืน']),
('ปีกนก',         ARRAY['control arm', 'a-arm', 'wishbone', 'lower arm', 'lower control arm']),
('ยางกันสะเทือน', ARRAY['bushing', 'rubber bushing', 'ยางปีกนก', 'ยางแขน']),

-- ระบบเครื่องยนต์
('กรองอากาศ',     ARRAY['air filter', 'airfilter', 'กรองอากาศเครื่อง', 'air cleaner']),
('กรองน้ำมัน',    ARRAY['oil filter', 'กรองน้ำมันเครื่อง', 'oil-filter']),
('กรองแอร์เคบิน', ARRAY['cabin filter', 'pollen filter', 'กรองอากาศในรถ', 'แอร์เคบิน', 'cabin air filter']),
('หัวเทียน',      ARRAY['spark plug', 'sparkplug', 'spark', 'iridium', 'platinum', 'หัวเทียนอิริเดียม']),
('สายพาน',        ARRAY['belt', 'timing belt', 'สายพานไทม์มิ่ง', 'cam belt', 'drive belt', 'สายพานราวลิ้น']),
('หม้อน้ำ',       ARRAY['radiator', 'cooling', 'หม้อต้ม']),
('น้ำมันเครื่อง', ARRAY['engine oil', 'motor oil', 'น้ำมันเครื่องยนต์', 'oil']),
('ปะเก็น',        ARRAY['gasket', 'head gasket', 'ปะเก็นฝาสูบ']),
('แหวนลูกสูบ',    ARRAY['piston ring', 'rings']),
('วาล์ว',         ARRAY['valve', 'intake valve', 'exhaust valve', 'วาล์วไอดี', 'วาล์วไอเสีย']),

-- ระบบไฟฟ้า
('ไดชาร์จ',       ARRAY['alternator', 'ไดชาร์ท', 'dynamo', 'generator']),
('ไดสตาร์ท',      ARRAY['starter', 'starter motor', 'ไดสตาร์ต', 'มอเตอร์สตาร์ท']),
('แบตเตอรี่',     ARRAY['battery', 'แบต', 'batt', 'แบตรถ', 'accumulator']),
('ฟิวส์',         ARRAY['fuse', 'relay', 'ฟิวซ์']),

-- ระบบแอร์
('คอมเพรสเซอร์แอร์', ARRAY['ac compressor', 'a/c compressor', 'คอมแอร์', 'คอมเพรซเซอร์', 'aircon compressor']),
('คอยล์แอร์',     ARRAY['evaporator', 'คอยล์เย็น', 'evap coil']),
('แผงร้อน',       ARRAY['condenser', 'ac condenser', 'แผงคอนเดนเซอร์']),

-- ยี่ห้อรถ (Thai-English mapping)
('honda',         ARRAY['ฮอนด้า', 'ฮอนดา', 'ฮอน']),
('toyota',        ARRAY['โตโยต้า', 'โตโยตา', 'tyt', 'โตโย']),
('isuzu',         ARRAY['อีซูซุ', 'อีซูสุ', 'isz', 'อีซู']),
('mitsubishi',    ARRAY['มิตซูบิชิ', 'มิทซูบิชิ', 'mit', 'มิตซู']),
('nissan',        ARRAY['นิสสัน', 'นิสซัน']),
('mazda',         ARRAY['มาสด้า', 'มาสดา']),
('suzuki',        ARRAY['ซูซูกิ', 'ซูซุกิ']),
('subaru',        ARRAY['ซูบารุ', 'สุบารุ']),

-- รุ่นรถยอดนิยม
('civic',         ARRAY['ซีวิค', 'ซิวิค', 'ซีวิก']),
('city',          ARRAY['ซิตี้', 'ซิตี', 'ฮอนด้า ซิตี้']),
('vios',          ARRAY['วีออส', 'วิออส']),
('camry',         ARRAY['คัมรี่', 'แคมรี่', 'แคมรี']),
('corolla',       ARRAY['โคโรล่า', 'โคโรลา']),
('fortuner',      ARRAY['ฟอร์จูนเนอร์', 'ฟอร์จูน']),
('d-max',         ARRAY['ดีแม็กซ์', 'dmax', 'd max', 'ดีแม็ก']),
('pajero',        ARRAY['ปาเจโร่', 'ปาเจโร', 'pajero sport']),
('hilux',         ARRAY['ไฮลักซ์', 'ไฮลักซ', 'revo', 'ไฮลักซ์ รีโว่']),
('navara',        ARRAY['นาวาร่า', 'นาวารา']),

-- ชนิดยี่ห้ออะไหล่
('bosch',         ARRAY['บอช']),
('denso',         ARRAY['เดนโซ่', 'เดนโซ']),
('brembo',        ARRAY['เบรมโบ', 'เบรมโบ้']),
('kyb',           ARRAY['เควายบี', 'kayaba']),
('ngk',           ARRAY['เอ็นจีเค']),
('gates',         ARRAY['เกทส์']);
