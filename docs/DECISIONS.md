# Decision Log

บันทึกการตัดสินใจสำคัญ พร้อมเหตุผลและบริบทตอนนั้น

---

## 2025-06-27 — Phase 1 scope: Catalog + Inquiry (ไม่ใช่ full e-commerce)

### Context
ตอนแรกวางแผน Phase 1 เป็น full e-commerce (cart + checkout + payment + shipping) แต่หลัง review จึงตัดสินใจปรับ scope เป็น **catalog + inquiry** เพื่อ ship เร็วและ test demand ก่อน

### Decision
- ตัด **payment integration** ออกจาก Phase 1
- ตัด **shipping integration** ออกจาก Phase 1
- ตัด **order management** ออกจาก Phase 1
- เปลี่ยน "Cart + Checkout" → **"Wishlist + Contact Store"**

### What stays
- ✅ Smart search
- ✅ Vehicle filter / Garage
- ✅ Cross-filter
- ✅ Product catalog
- ✅ Wishlist (save items for later)
- ✅ Contact via Line OA / phone / inquiry form

### What gets pushed to Phase 2
- ❌ Cart with quantities
- ❌ Real checkout flow
- ❌ Payment gateway integration
- ❌ Order management
- ❌ Shipping integration
- ❌ User addresses
- ❌ Order history

### Rationale
- ลูกค้าซื้ออะไหล่มักต้องการ "ปรึกษา" ก่อนซื้อ — inquiry flow เป็น natural บนตลาดไทยอยู่แล้ว
- ลด development risk และ ship เร็ว (3 สัปดาห์แทน 4-5)
- Test demand จริงก่อนลงทุน payment infrastructure
- Behavior ลูกค้าไทยถนัด Line อยู่แล้ว — leverage แทนที่จะ build cart UI ซับซ้อน

### Impact on docs
- `01-PRD.md` — update F5
- `04-DATABASE-SCHEMA.md` — remove orders/addresses, simplify cart → wishlist
- `05-API-SPEC.md` — remove orders endpoints, add inquiries
- `06-ROADMAP.md` — rewrite Phase 1 sprints

---

## 2025-06-27 — Database: Supabase (PostgreSQL managed)

### Context
ผู้สร้างต้องการ
- ใส่ข้อมูลสินค้าเอง (manual data entry)
- Mock backend สำหรับ Phase 1
- ฟรีถ้าได้

### Decision
ใช้ **Supabase** เป็น database + backend infrastructure

### Why Supabase
- เป็น PostgreSQL 15 จริงๆ — `pg_trgm` + FTS ใช้ได้ ทำให้ search guide เดิมยังใช้ได้ทั้งหมด
- มี **Studio admin UI** สำหรับใส่ข้อมูลโดยไม่ต้อง build เอง
- Free tier: 500MB DB, 1GB storage, 50K MAU
- Auth + Storage + Realtime built-in
- Auto-generate TypeScript types จาก schema
- Migrate ออกได้ผ่าน `pg_dump` (ไม่ vendor lock-in แท้)

### Alternatives considered
- **PocketBase** — SQLite + admin UI, ดีแต่ search quality ต่ำกว่า (ไม่มี pg_trgm)
- **Directus** — Admin UI สวย แต่ต้อง self-host
- **Local Postgres + Custom admin** — flexible แต่เสียเวลา dev

### Trade-offs accepted
- Free tier project pauses หลัง 1 สัปดาห์ไม่มี activity (mitigate ด้วย cron ping)
- Some advanced features paid-only

### Impact on docs
- `03-TECHNICAL-ARCHITECTURE.md` — add Supabase section, remove Docker Postgres
- ไฟล์ migration ยังใช้ได้ (Supabase migrations เป็น standard PostgreSQL)

---

## 2025-06-27 — Vehicle scope: Japanese brands only

### Context
Phase 1 จะ mock ข้อมูล ใส่เอง

### Decision
รองรับเฉพาะยี่ห้อรถญี่ปุ่น
- Toyota
- Honda
- Nissan
- Mazda
- Mitsubishi
- Isuzu
- Suzuki
- Subaru

### Rationale
- ครอบคลุม ~85% ของรถบนถนนไทย
- ลด data entry workload Phase 1
- ขยาย European/American brands ได้ใน Phase 2

### Impact
- Seed data + vehicle dropdown ให้ default แค่ 8 ยี่ห้อ
- ใน schema ไม่ต้องเปลี่ยน (`brand` เป็น free-text string อยู่แล้ว)
