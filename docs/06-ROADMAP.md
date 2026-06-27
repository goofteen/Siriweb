# Implementation Roadmap

แบ่งเป็น 3 phase — Phase 1 ปรับ scope เป็น "Catalog + Inquiry" (ดู `DECISIONS.md`)

---

## Phase 0: Foundation (สัปดาห์ 1)

### เป้าหมาย
Supabase project + React app ที่เชื่อมกันได้

### Deliverables
- [ ] สมัคร Supabase (region: Singapore)
- [ ] Supabase CLI setup สำหรับ local dev
- [ ] React + Vite + TypeScript + Tailwind + shadcn/ui
- [ ] @supabase/supabase-js client setup
- [ ] ESLint + Prettier + Husky
- [ ] GitHub Actions (typecheck + build)
- [ ] Initial migration: enable pg_trgm, unaccent
- [ ] Hello page ที่ fetch Supabase ได้

### Definition of Done
- `npm run dev` ทำงาน
- React fetch จาก Supabase ได้
- Supabase Studio ใส่ test data ได้

---

## Phase 1: MVP — Catalog + Inquiry (สัปดาห์ 2–4)

**Scope:** ค้น/ดูสินค้า → save wishlist → ติดต่อร้าน (ไม่มี checkout)

### Sprint 1: Catalog + Search (สัปดาห์ 2)
- [ ] Migrations: products, categories, images, vehicles, product_vehicles, inventory
- [ ] Migrations: search_synonyms, search_logs
- [ ] Trigger: auto-update search_vector + searchable_text
- [ ] PostgreSQL functions: smart_search, expand_query_with_synonyms
- [ ] Indexes: GIN for FTS + trigram
- [ ] Seed data
  - 8 ยี่ห้อรถญี่ปุ่น × 3-5 รุ่น × 5 ปี = ~150 vehicles
  - 25 categories
  - 50-100 sample products
  - 50 synonym entries
- [ ] RLS policies (public read, admin write)
- [ ] Supabase TypeScript types generation

### Sprint 2: Browse + Filter UI (สัปดาห์ 3)
- [ ] Pages
  - Home (hero search + popular)
  - Search results
  - Category browse
  - Product detail
  - Garage
  - Wishlist
- [ ] Components
  - SmartSearchBox (debounce + autocomplete + highlight)
  - VehicleSelector (cascade)
  - FilterChips
  - ProductCard, ProductGrid
- [ ] State: GarageContext, WishlistContext (localStorage + session)
- [ ] UX must-haves
  - Guest ใช้ได้ทุกอย่าง
  - Vehicle filter เก็บ 30 วัน
  - Cross-filter ทำงานทุกที่
  - Mobile-first 360px

### Sprint 3: Inquiry + Polish + Launch (สัปดาห์ 4)
- [ ] Inquiry flow
  - "ติดต่อร้าน" button บนหน้าสินค้า
  - 3 ทางเลือก: Line OA deep link, โทร (tel:), Inquiry form
  - Inquiry form: ชื่อ, ช่องทางติดต่อ, รถ (ถ้ามี), ข้อความ, สินค้าที่สนใจ
  - บันทึก inquiry ลง Supabase
  - Email notification ผ่าน Supabase Edge Function (ใช้ Resend free tier)
- [ ] Admin view สำหรับดู inquiries
  - ใช้ Supabase Studio Table Editor หรือ build mini admin page
- [ ] Polish
  - Mobile responsive review
  - Loading / empty / error states
  - SEO: meta tags, sitemap.xml, robots.txt
  - Lighthouse > 85 mobile
- [ ] Deploy frontend ขึ้น Vercel หรือ Netlify (free)
- [ ] Domain + SSL (Cloudflare free)

### Definition of Done — Phase 1
- ลูกค้าทำได้:
  - ค้นหาด้วย keyword ใดๆ
  - เพิ่มรถใน garage
  - ดูสินค้า + กรอง
  - Save wishlist
  - ติดต่อร้านผ่าน Line/โทร/form
- Search response < 200ms (p95)
- Mobile Lighthouse > 85
- ใส่ข้อมูลใหม่ได้ผ่าน Supabase Studio

---

## Phase 2: E-commerce + Growth (สัปดาห์ 5–10)

### เป้าหมาย
เปลี่ยนจาก catalog → ขายได้จริง

### Features
- [ ] **Auth** — Supabase Auth (email/password, Google, Line Login)
- [ ] **User account** — migrate session data → user
- [ ] **Cart** — แปลง wishlist → cart พร้อม quantity
- [ ] **Addresses** — multi-address per user
- [ ] **Checkout** — flow ครบ
- [ ] **Payment** — เริ่มที่ PromptPay (ผ่าน Omise หรือ Stripe)
- [ ] **Orders** — order management, status, tracking
- [ ] **Shipping** — Kerry/Flash/J&T integration
- [ ] **Email** — order confirmation, status updates
- [ ] **Line OA** — integrate chat → product, abandon cart recovery
- [ ] **Mechanic Pro Account** — B2B pricing, ใบกำกับภาษี

---

## Phase 3: Differentiators (สัปดาห์ 11–16)

### Features
- [ ] **AI Photo Finder** — ถ่ายรูปอะไหล่ → identify (Claude Vision)
- [ ] **Interactive Exploded Diagrams**
- [ ] **Installation videos** ในหน้าสินค้า
- [ ] **Personalized recommendations** based on garage + history
- [ ] **Inventory real-time** — connect to warehouse system
- [ ] **Multi-warehouse** — เลือกร้านใกล้
- [ ] **Subscription** — auto-reorder (น้ำมัน, กรอง)

---

## Rolling concerns

### Always on
- Performance monitoring
- Security review เมื่อเพิ่ม endpoint
- Search log review (เพิ่ม synonym)
- Customer feedback loop

### Quarterly review
- Top zero-result searches → action items
- Top exit pages → UX improvement
- Conversion funnel (Phase 2+)
- A/B test pipeline

---

## How to use this roadmap

### สำหรับ Win
- Roadmap คือ guideline ไม่ใช่กฎตายตัว
- Sprint 1 week ทบทวน
- ปรับ priority ตาม user feedback

### สำหรับ Claude Code
- Phase ปัจจุบันตามที่ user ระบุใน prompt
- ก่อนเริ่ม sprint อ่าน sprint goals + docs ที่เกี่ยวข้อง
- ห้ามทำ Phase อื่นโดยไม่ได้รับอนุญาต
- จบ sprint update CHANGELOG.md

---

## Risk register

| Risk | Mitigation |
|------|-----------|
| Catalog data ใส่ไม่ทัน | Start 50 SKU ขายดี, ขยายค่อยๆ ผ่าน Studio |
| Search quality ไม่ดี | Zero-result log → weekly review → expand dictionary |
| Supabase free tier pause | Cron ping ทุก 6 วัน หรือ upgrade เมื่อ traffic จริง |
| Performance ตอน scale | Phase 1 พอ, Phase 2 ค่อย add cache/CDN |
| Mobile bugs | Test ตั้งแต่วันแรก, real device testing |
| ลูกค้าไม่ trust | Trust signals ครบ (contact info, address, payment logos Phase 2) |
