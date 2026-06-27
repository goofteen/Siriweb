# Database Schema (Phase 1 — Catalog + Inquiry)

ดู `07-SMART-SEARCH-GUIDE.md` สำหรับ schema ของ search system (products, vehicles, synonyms, search_logs) เอกสารนี้คือส่วนอื่นๆ ที่ครบทั้งระบบ

**สำคัญ:** Phase 1 ไม่มี orders/addresses/payment — ดู `DECISIONS.md`

## Diagram (Phase 1)

```
products ──→ product_categories
        ──→ product_images
        ──→ product_vehicles ──→ vehicles
        ──→ product_inventory (mock)

users (admin only Phase 1) 

sessions ─→ user_vehicles (garage)
        ─→ wishlist_items ──→ products

inquiries ──→ products (optional reference)
```

## Tables

### products, vehicles, product_vehicles, search_synonyms, search_logs
ดู `07-SMART-SEARCH-GUIDE.md`

### product_categories

```sql
CREATE TABLE product_categories (
  id          SERIAL PRIMARY KEY,
  parent_id   INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
  name_th     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100),
  slug        VARCHAR(100) UNIQUE NOT NULL,
  icon        VARCHAR(50),
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_categories_slug ON product_categories(slug);
```

### product_images

```sql
CREATE TABLE product_images (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE,
  url         VARCHAR(500) NOT NULL,
  alt_text    VARCHAR(255),
  sort_order  INTEGER DEFAULT 0,
  is_primary  BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
```

**ใช้ Supabase Storage** เก็บไฟล์รูปจริง — `url` ชี้ไปยัง Supabase Storage public URL

### product_inventory (mock Phase 1)

```sql
CREATE TABLE product_inventory (
  product_id      INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  quantity        INTEGER NOT NULL DEFAULT 0,
  warehouse_code  VARCHAR(20),
  last_updated    TIMESTAMP DEFAULT NOW()
);

-- View สำหรับ availability (ไม่มี reserved ใน Phase 1)
CREATE VIEW product_availability AS
SELECT 
  p.id,
  p.sku,
  COALESCE(pi.quantity, 0) AS available,
  CASE WHEN COALESCE(pi.quantity, 0) > 0 THEN true ELSE false END AS in_stock
FROM products p
LEFT JOIN product_inventory pi ON pi.product_id = p.id;
```

### sessions

ใช้สำหรับ track guest user (garage + wishlist)

```sql
CREATE TABLE sessions (
  id          VARCHAR(100) PRIMARY KEY,  -- session ID (cookie)
  data        JSONB DEFAULT '{}',
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### user_vehicles (Garage)

```sql
CREATE TABLE user_vehicles (
  id              SERIAL PRIMARY KEY,
  session_id      VARCHAR(100) NOT NULL,
  vehicle_id      INTEGER REFERENCES vehicles(id) NOT NULL,
  nickname        VARCHAR(100),  -- ลูกค้าตั้งชื่อ เช่น "Civic แดง"
  license_plate   VARCHAR(20),
  is_primary      BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_vehicles_session ON user_vehicles(session_id);
```

**Phase 1:** Garage ผูกกับ session อย่างเดียว (guest)
**Phase 2:** เพิ่ม `user_id` เมื่อมี auth

### wishlist_items

แทนที่ cart_items — ไม่มี quantity เพราะ Phase 1 เป็น "save to consider" ไม่ใช่ "buy now"

```sql
CREATE TABLE wishlist_items (
  id           SERIAL PRIMARY KEY,
  session_id   VARCHAR(100) NOT NULL,
  product_id   INTEGER REFERENCES products(id) NOT NULL,
  note         TEXT,  -- ลูกค้าใส่ note เช่น "สำหรับรถลูก"
  added_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, product_id)
);

CREATE INDEX idx_wishlist_session ON wishlist_items(session_id);
```

### inquiries

ลูกค้าติดต่อร้านผ่านฟอร์ม

```sql
CREATE TABLE inquiries (
  id              SERIAL PRIMARY KEY,
  session_id      VARCHAR(100),
  
  -- ข้อมูลลูกค้า
  customer_name   VARCHAR(255) NOT NULL,
  contact_phone   VARCHAR(20),
  contact_line    VARCHAR(100),  -- Line ID
  contact_email   VARCHAR(255),
  
  -- บริบท
  vehicle_id      INTEGER REFERENCES vehicles(id),
  message         TEXT NOT NULL,
  
  -- สินค้าที่สนใจ (optional, อาจหลายชิ้น)
  product_ids     INTEGER[],  -- array of product IDs
  
  -- สถานะ admin
  status          VARCHAR(20) DEFAULT 'new',  -- new, contacted, closed
  admin_notes     TEXT,
  
  -- metadata
  source          VARCHAR(50),  -- product_page, search, contact_form
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_contact CHECK (
    contact_phone IS NOT NULL OR 
    contact_line IS NOT NULL OR 
    contact_email IS NOT NULL
  )
);

CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created ON inquiries(created_at DESC);
```

### admin_users (Phase 1 minimal)

สำหรับ Win เข้าหลังบ้านดู inquiries และจัดการ catalog

ใช้ **Supabase Auth** ที่มีให้ + Row Level Security policies — ไม่ต้องสร้างตารางเอง

## Row Level Security Policies

สำคัญที่สุดเมื่อใช้ Supabase

### products
```sql
-- ทุกคนอ่านได้
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT USING (true);

-- เฉพาะ admin แก้ได้ (เซ็ตผ่าน user metadata)
CREATE POLICY "Only admin can modify products"
  ON products FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'admin'
  );
CREATE POLICY "Only admin can update products"
  ON products FOR UPDATE USING (
    (auth.jwt() ->> 'user_role') = 'admin'
  );
```

### user_vehicles, wishlist_items
```sql
-- guest ใช้ session_id ผ่าน custom header
CREATE POLICY "Session can manage own garage"
  ON user_vehicles FOR ALL
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- same for wishlist
CREATE POLICY "Session can manage own wishlist"
  ON wishlist_items FOR ALL
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );
```

### inquiries
```sql
-- ทุกคนสร้างได้ (ส่งฟอร์ม)
CREATE POLICY "Anyone can create inquiry"
  ON inquiries FOR INSERT WITH CHECK (true);

-- เฉพาะ admin อ่าน/แก้
CREATE POLICY "Only admin can read inquiries"
  ON inquiries FOR SELECT
  USING ((auth.jwt() ->> 'user_role') = 'admin');
```

## Migrations Strategy

ใช้ Supabase CLI

```bash
# สร้าง migration ใหม่
supabase migration new add-products-table

# Apply locally
supabase db reset

# Push to remote
supabase db push
```

**Naming convention (Supabase):**
```
20250627120000_init_extensions.sql
20250627121000_create_vehicles.sql
20250627122000_create_products.sql
20250627123000_create_search_function.sql
```

## Seed Data (Phase 1)

ใส่ผ่าน Supabase Studio UI หรือ `supabase/seed.sql`

ต้องมีอย่างน้อย
- **8 ยี่ห้อรถญี่ปุ่น** × 3-5 รุ่นยอดนิยม × 5 ปี = ~150 vehicles
  - Toyota, Honda, Nissan, Mazda, Mitsubishi, Isuzu, Suzuki, Subaru
- **25 categories** (10 หลัก + sub)
- **50-100 sample products** เริ่มต้น (Win ใส่เพิ่มผ่าน Studio)
- **50 synonym entries**

## Common Queries

### หา products ที่ใช้กับรถคันที่กำหนด
```sql
SELECT p.*, pi.url AS image_url
FROM products p
JOIN product_vehicles pv ON pv.product_id = p.id
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
WHERE pv.vehicle_id = $1
  AND EXISTS (
    SELECT 1 FROM product_inventory pinv 
    WHERE pinv.product_id = p.id AND pinv.quantity > 0
  );
```

### Wishlist ของ session
```sql
SELECT 
  wi.id,
  wi.note,
  wi.added_at,
  p.id AS product_id,
  p.name_th, 
  p.price,
  pi.url AS image_url
FROM wishlist_items wi
JOIN products p ON p.id = wi.product_id
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
WHERE wi.session_id = $1
ORDER BY wi.added_at DESC;
```

### Inquiries ที่ยังไม่ตอบ (สำหรับ admin)
```sql
SELECT 
  i.*,
  v.brand || ' ' || v.model || ' ' || v.year_from AS vehicle_label,
  array_length(i.product_ids, 1) AS product_count
FROM inquiries i
LEFT JOIN vehicles v ON v.id = i.vehicle_id
WHERE i.status = 'new'
ORDER BY i.created_at DESC;
```

## Migration Path: Phase 1 → Phase 2 (e-commerce)

เมื่อพร้อมจะเพิ่ม cart/checkout
1. เพิ่มตาราง `users` (ถ้าใช้ Supabase Auth จะมีให้แล้ว)
2. เพิ่ม `addresses`, `orders`, `order_items`
3. แปลง `wishlist_items` → `cart_items` ที่มี `quantity`
4. Update inquiry workflow → optional alternative to checkout
