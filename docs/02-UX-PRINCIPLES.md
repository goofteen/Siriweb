# UX Principles

เอกสารนี้คือหลักการ UX ที่ **ห้ามผิด** ทุก feature ที่จะ implement ต้องผ่านการเช็คกับหลักการเหล่านี้

## หลักการ #1: Guest-First, Progressive Commitment

ลูกค้าต้องทำได้ทุกอย่างก่อน login

| Action | ต้อง login ไหม |
|--------|-----------------|
| ดูสินค้า | ไม่ |
| ค้นหา | ไม่ |
| Filter รุ่นรถ | ไม่ (เก็บใน session) |
| เปรียบเทียบสินค้า | ไม่ |
| ใส่ตะกร้า | ไม่ |
| ดู cart | ไม่ |
| **Checkout** | **ใช่** (หรือ sign up ตอนนั้น) |

**Implementation:**
- Vehicle filter เก็บใน `localStorage` + cookie (อายุ 30 วัน)
- Cart เก็บใน server session โดยใช้ session cookie
- เมื่อ user sign up → migrate session data ไป account

**ทำไม:** การบังคับ sign up ก่อนใช้งานเป็น barrier ใหญ่ที่สุดของ e-commerce — Baymard research พบว่า 35% ของ user ทิ้งตะกร้าเพราะถูกบังคับสมัคร

## หลักการ #2: Cross-Filter Everywhere

ลูกค้าควรกรองได้ทุกแกนจากทุกหน้า ไม่ว่าจะเข้ามาทางไหน

**Filter ที่ต้องมี:**
- รุ่นรถ (vehicle)
- หมวดอะไหล่ (category)
- ยี่ห้อสินค้า (brand)
- ราคา (price range)
- OEM / Aftermarket
- สถานะสต็อก (in stock only)

**Implementation:**
- ใช้ filter chips แสดงที่ด้านบนของ listing
- คลิก "+เพิ่ม filter" เปิด modal/drawer ให้เลือกเพิ่ม
- ลบ chip ได้ทีละอัน
- count ของผลลัพธ์ update realtime (with debounce 200ms)
- URL ของหน้า reflects filters (สำหรับ share/bookmark)

**ทำไม:** Path A (เริ่มจากรถ) และ Path B (เริ่มจากอะไหล่) ต้องลงทาง unified product listing — ลูกค้าสลับ context ได้ตลอดโดยไม่หลุดทาง

## หลักการ #3: Smart Search รับทุก input

ลูกค้าใส่อะไรลงไปในช่อง search ก็ต้องได้ผลลัพธ์ที่เกี่ยวข้อง

**ต้องรองรับ 6 ประเภท:**

| Input type | ตัวอย่าง | Strategy |
|-----------|---------|----------|
| Exact part number | `04465-02200` | direct match |
| Typo | `ผ้าเบก ซีวิค` | trigram fuzzy |
| Thai-English mix | `ผ้าเบรก civic 2019` | synonym + parse |
| Synonym | `คอมแอร์` | synonym dictionary |
| Numeric context | `civic 19` | parse year |
| Intent | `รถสตาร์ทไม่ติด` | category mapping |

**Implementation:** ดู `docs/07-SMART-SEARCH-GUIDE.md`

**ทำไม:** Baymard data: 60–70% ของ user เริ่มจาก search bar ไม่ใช่ browse — search ที่อ่อนแอเสมือนเสีย 70% ของ traffic

## หลักการ #4: ลด Anxiety ทุก step

ลูกค้ามี anxiety หลักคือ "สั่งผิด" — ต้องลดทุกจุด

**ที่ต้องทำ:**

| จุด | วิธีลด anxiety |
|----|---------------|
| หน้าสินค้า | แสดงรายการรถที่ใช้ได้ ชัดเจน |
| หน้าสินค้า (มี garage) | แสดง badge เขียว "ใช้กับรถคุณได้" |
| Cart | แสดงข้อมูลรถใต้แต่ละ item |
| Checkout | นโยบายคืน 7 วันชัดในหน้านี้ |
| Confirmation | แสดง part number + vehicle ตรงๆ |

**ห้าม:**
- ซ่อนนโยบายคืนไว้ใน FAQ
- ใช้ภาษากำกวม ("อาจใช้ได้", "ส่วนใหญ่")
- ปล่อยให้ลูกค้าต้องคำนวณเอง

## หลักการ #5: Mobile-First Thai

60%+ ของ traffic e-commerce ไทยมาจาก mobile

**ที่ต้องทำ:**
- Design สำหรับ 360px viewport ก่อน
- Tap target ขั้นต่ำ 44×44px
- Bottom nav สำหรับ navigation หลัก (ไม่ใช่ hamburger)
- ปุ่ม CTA ใหญ่และอยู่ในระยะนิ้วโป้ง
- ฟอนต์ขั้นต่ำ 16px (กัน iOS auto-zoom)
- รองรับ Thai font rendering (Sarabun, Noto Sans Thai, IBM Plex Sans Thai)

**Channel integration:**
- Line OA button ต้อง prominent (deep link `line://oaMessage/...`)
- รองรับ Line login (Phase 2)
- รับ payment ผ่าน PromptPay เป็น default

## หลักการ #6: Trust Signals

ลูกค้าไทยซื้ออะไหล่ออนไลน์มี trust barrier สูง

**ต้องแสดงในทุกหน้า:**
- รายการ payment ที่รองรับ (logo Visa/Master/PromptPay/COD)
- นโยบายคืน (สั้นที่สุด: "คืนฟรีภายใน 7 วันถ้าสั่งผิด")
- เบอร์โทร + Line OA ติดต่อได้จริง
- ที่อยู่บริษัทใน footer

**ในหน้าสินค้า:**
- รีวิวจริงจากผู้ซื้อ (เมื่อมี)
- จำนวนคนที่ซื้อสินค้านี้แล้ว
- ใบรับรอง/มาตรฐาน (ถ้ามี)

## หลักการ #7: Speed = UX

สำหรับช่าง 100ms ที่ช้าลง = ความหงุดหงิด

**Performance budget:**
- Search response < 200ms (p95)
- Page transition < 100ms (SPA navigation)
- Image lazy load + progressive
- Skeleton screens, no spinners (where possible)
- Optimistic UI สำหรับ add-to-cart

## Anti-patterns ที่ห้ามทำ

❌ Force sign-up before browsing
❌ Modal popup ขอ email ทันทีที่เข้าเว็บ
❌ Carousel ที่หมุนเอง (ลูกค้าไม่ทันอ่าน)
❌ "Live chat" popup ที่บังจอ
❌ Cookie banner ใหญ่จน scroll ไม่ลง
❌ ฟอร์ม checkout ที่ขอข้อมูลเกินจำเป็น
❌ Auto-add insurance / add-on ที่ไม่ได้เลือก

## Checklist ก่อน ship feature

ทุก feature ที่ user-facing ต้องผ่าน

- [ ] ใช้งานได้แบบ guest ไม่ต้อง login
- [ ] รองรับ mobile 360px ขึ้นไป
- [ ] Keyboard navigable ทั้งหมด
- [ ] Performance: response < 300ms
- [ ] Empty state, error state, loading state ครบ
- [ ] copy ภาษาไทยถูกต้อง ไม่มี jargon ที่ลูกค้าไม่เข้าใจ
- [ ] Cross-filter ยังทำงานได้
- [ ] ไม่ขัดกับ 7 หลักการข้างต้น
