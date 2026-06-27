# Product Requirements Document (PRD)

## Vision

สร้างเว็บอะไหล่รถยนต์ที่แก้ปัญหาเดียวกันที่ลูกค้าทุกตลาดเจอ — **"ความกลัวสั่งผิด"** — ผ่าน UX ที่ทำให้ลูกค้ามั่นใจ 100% ก่อนกด checkout

## ปัญหาที่กำลังแก้

จาก research พบว่าลูกค้าซื้ออะไหล่ออนไลน์เจอ pain points 5 อย่างเรียงตามความสำคัญ

1. **ค้นหาไม่เจอ / ไม่มั่นใจว่าถูกคัน** (impact สูงสุด)
2. ภาพสินค้าไม่ชัด ไม่ครบมุม
3. ไม่รู้ส่งได้เร็วแค่ไหน / มีสต็อกไหม
4. สั่งผิด คืนยาก
5. ราคาไม่โปร่งใส (OEM vs aftermarket)

## Target Users

### Primary: ช่าง/อู่ซ่อม (~45%)
- **Behavior:** ซื้อบ่อย 2–10 ครั้ง/สัปดาห์, ตัดสินใจไว, ต้องการของวันเดียวกัน
- **Goal:** หาของได้เร็วที่สุด, ราคาส่ง, reorder ง่าย
- **Frustration:** ฟอร์มยุ่ง, ไม่มี part number ที่คุ้น, ส่งช้า

### Secondary: เจ้าของรถทั่วไป/DIY (~35%)
- **Behavior:** ซื้อนานๆ ครั้ง, research เยอะ, กลัวสั่งผิด
- **Goal:** มั่นใจว่าใช้กับรถได้, มีคู่มือติดตั้ง, ราคา reasonable
- **Frustration:** ไม่รู้ part number, กลัวคืนของยาก

### Tertiary: ผู้ซื้อเพื่อขายต่อ (~20%)
- **Behavior:** ซื้อ bulk, เปรียบเทียบหลายเจ้า, ต้องการใบกำกับภาษี
- **Goal:** ราคาดีที่สุด, multiple SKU ในออเดอร์เดียว, credit term
- **Frustration:** ไม่มีบัญชีธุรกิจที่แยกชัด

## Core Features (Phase 1 — MVP)

### F1: Smart Search
ลูกค้าใส่อะไรไปก็ได้ในช่อง search — part number, ชื่อไทย, ชื่ออังกฤษ, คำเล่น, พิมพ์ผิด — ระบบหาให้เจอ

**Acceptance criteria:**
- รับ input ความยาว 2+ ตัวอักษร
- ตอบสนองภายใน 300ms
- มี autocomplete พร้อม highlight คำที่ match
- กรณี zero result → แนะนำคำใกล้เคียง + ลิงก์ติดต่อ Line OA

### F2: Vehicle Filter (Garage)
ลูกค้าระบุรถ → ระบบจำใน session (และในบัญชีถ้า login) → filter อะไหล่ทั้งหมดให้เหลือเฉพาะที่ใช้ได้กับรถนั้น

**Acceptance criteria:**
- เลือกรถผ่าน dropdown cascade: ยี่ห้อ → รุ่น → ปี → เครื่องยนต์
- บันทึก session 30 วันโดยไม่ต้อง login
- รถหลายคันต่อบัญชี
- toggle filter on/off ได้ตลอดเวลา

### F3: Cross-Filter
ลูกค้าเริ่มจาก browse หมวด หรือ filter รถ แล้วเพิ่ม/ลด filter ได้ทุกแกน

**Acceptance criteria:**
- Filter chips แสดงเงื่อนไขที่ active ทั้งหมด
- ลบ chip ได้ทีละอัน
- "+เพิ่ม filter" เปิด panel ให้เลือก: brand, ราคา, OEM/aftermarket, ความนิยม
- count ของผลลัพธ์ update แบบ realtime

### F4: Product Detail
หน้าสินค้าที่มีข้อมูลครบเพื่อตัดสินใจ

**Acceptance criteria:**
- รูปสินค้าหลายมุม (ภาพแสดง part number ได้ชัด)
- รายการรถที่ใช้ได้ (compatibility list)
- เปรียบเทียบ OEM vs aftermarket (ถ้ามี)
- สถานะสต็อก real-time + ETA
- ปุ่ม "ใช้กับรถคุณได้" ถ้า set garage ไว้

### F5: Wishlist + Contact Store (Phase 1 — แทน checkout)
ลูกค้า save สินค้าที่สนใจ และติดต่อร้านได้ผ่านหลายช่องทาง

**Acceptance criteria:**
- Add to wishlist ได้แบบ guest (session-based)
- Wishlist อยู่ 30 วัน
- ปุ่ม "ติดต่อร้าน" บนหน้าสินค้า → 3 ทางเลือก
  - Line OA deep link (เปิดแอป Line ทันที)
  - โทร (tel:)
  - Inquiry form ส่งข้อความ + รถ + สินค้าที่สนใจ
- Form ส่งแล้วบันทึก Supabase + email แจ้งร้าน

**ทำไม inquiry แทน checkout (Phase 1):**
- ดู `docs/DECISIONS.md`
- ลูกค้าซื้ออะไหล่นิยมปรึกษาก่อน — natural behavior
- ลด development risk, ship เร็ว, test demand ก่อน

## Phase 2 Features (E-commerce)

- **Cart + Checkout** (เปลี่ยนจาก wishlist → cart with quantity)
- Payment integration (PromptPay/Omise/Stripe)
- Shipping integration (Kerry/Flash/J&T)
- Auth (Supabase Auth: email, Google, Line Login)
- User addresses
- Order management + tracking
- VIN Lookup (NHTSA API)
- Line OA chatbot integration
- Mechanic Pro Account (B2B)
- Product reviews

## Phase 3 Features

- AI Photo Finder (ถ่ายรูปอะไหล่)
- Interactive exploded diagrams
- Installation videos
- Personalized recommendation

## Out of Scope (Phase 1)

- Mobile app (web responsive พอ)
- Multiple language (ไทยเป็นหลัก, อังกฤษเป็นรอง)
- Multiple currency
- Affiliate / dropshipping
- Vehicle ownership transfer

## Success Metrics

### North Star
**% ของ search session ที่จบด้วยการ add to cart** (target: > 8%)

### Supporting Metrics
- Zero-result search rate < 5%
- Average search → product page click rate > 30%
- Cart abandonment rate < 60%
- Time from search to checkout < 5 minutes (median)

## Non-Functional Requirements

- **Performance:** First Contentful Paint < 1.5s on 4G
- **Availability:** 99.5% uptime (Phase 1), 99.9% (Phase 2+)
- **Browser support:** Chrome, Safari, Edge เวอร์ชันล่าสุด 2 versions, mobile Safari + Chrome
- **Mobile:** Responsive ตั้งแต่ 360px ขึ้นไป (60%+ ของ traffic ไทยเป็น mobile)
- **Language:** ไทยเป็นหลัก, รองรับ UTF-8 ทั้งระบบ

## Resolved Decisions (ดู `DECISIONS.md`)

- ✅ **Phase 1 scope:** Catalog + Inquiry (ไม่มี checkout/payment)
- ✅ **Database:** Supabase (PostgreSQL managed + admin UI)
- ✅ **Vehicle brands Phase 1:** ญี่ปุ่น 8 ยี่ห้อ (Toyota, Honda, Nissan, Mazda, Mitsubishi, Isuzu, Suzuki, Subaru)
- ⏳ **Payment gateway:** Phase 2 decision (Omise / GBPrimePay / Stripe)
- ⏳ **Shipping provider:** Phase 2 decision (Kerry / Flash / J&T)
- ⏳ **Inventory management:** Phase 2 (manual ผ่าน Supabase Studio ใน Phase 1)
