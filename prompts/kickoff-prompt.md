# Kickoff Prompt สำหรับ Claude Code

Copy ข้อความใน code block แล้ว paste ลงใน Claude Code session

---

## Prompt #1 — Phase 0 Foundation

```
สวัสดี Claude ฉันต้องการให้คุณช่วยสร้างเว็บไซต์ขายอะไหล่รถยนต์
โปรเจกต์นี้มีเอกสารครบใน folder docs/ และ CLAUDE.md

งานแรก: Phase 0 Foundation (อ่าน docs/06-ROADMAP.md ส่วน Phase 0)

ขั้นตอน
1. อ่าน docs ทั้งหมดก่อนเริ่มเขียน code เรียงตามนี้
   - CLAUDE.md
   - docs/DECISIONS.md (สำคัญ — รู้ว่า scope ปรับเป็น Catalog + Inquiry, ใช้ Supabase)
   - docs/01-PRD.md
   - docs/02-UX-PRINCIPLES.md
   - docs/03-TECHNICAL-ARCHITECTURE.md
   - docs/06-ROADMAP.md

2. สร้าง project structure ตาม docs/03-TECHNICAL-ARCHITECTURE.md
   - apps/web (React + Vite + TypeScript)
   - supabase/ (migrations + seed)
   - Tailwind + shadcn/ui
   - @supabase/supabase-js client setup

3. งานที่ต้องเสร็จ
   - npm scripts: dev, build, test, lint
   - ESLint + Prettier + Husky pre-commit
   - Supabase CLI init
   - Migration: enable pg_trgm + unaccent
   - .env.example สำหรับ VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
   - Hello page ที่ fetch data ตัวอย่างจาก Supabase แสดงผลได้
   - GitHub Actions: typecheck + build บน PR
   - README สำหรับ local setup

4. ก่อนเริ่ม coding สรุปแผนให้ฟังก่อน
   - choices ที่จะทำ (library versions, structure)
   - ส่วนที่ไม่ชัดเจน / ต้องการ confirmation
   - ลำดับงาน

ห้ามเริ่มเขียน code ก่อนที่จะ confirm แผน
```

---

## Prompt #2 — Phase 1 Sprint 1 (Catalog + Search)

ใช้หลัง Phase 0 เสร็จ

```
Phase 0 เสร็จแล้ว ต่อไปคือ Phase 1 Sprint 1: Catalog + Search

อ่าน
- docs/DECISIONS.md
- docs/06-ROADMAP.md (Sprint 1 goals)
- docs/04-DATABASE-SCHEMA.md
- docs/07-SMART-SEARCH-GUIDE.md (ทั้งฉบับ — สำคัญมาก)

สิ่งที่ต้องทำ
1. Supabase Migrations
   - vehicles + product_categories
   - products + product_images + product_vehicles + product_inventory
   - search_synonyms + search_logs
   - Triggers สำหรับ search_vector + searchable_text
   - Indexes: GIN ทั้ง FTS และ trigram
   - RLS policies: public read, admin write

2. PostgreSQL Functions
   - smart_search ตาม guide
   - expand_query_with_synonyms

3. Seed data (supabase/seed.sql)
   - 8 ยี่ห้อรถญี่ปุ่น: Toyota, Honda, Nissan, Mazda, Mitsubishi, Isuzu, Suzuki, Subaru
   - 3-5 รุ่นยอดนิยมต่อยี่ห้อ × 5 ปี = ~150 vehicles
   - 25 categories (10 หลัก + sub)
   - 50-100 products realistic ที่ link vehicles
   - 50 synonym entries ตามตัวอย่างใน 07-SMART-SEARCH-GUIDE.md

4. Frontend setup
   - Supabase TypeScript types generation script
   - lib/supabase.ts client
   - lib/search.ts ที่ wrap rpc('smart_search')
   - Test ว่า search query กลับ result เร็ว < 200ms

5. Documentation
   - update CHANGELOG.md
   - หากมี decision ที่ต่างจาก docs ให้ note ใน DECISIONS.md

ก่อนเริ่ม สรุปแผน + คำถามที่ต้องเคลียร์
```

---

## Prompt #3 — Phase 1 Sprint 2 (Browse + Filter UI)

```
Sprint 2: Browse + Filter UI

อ่าน
- docs/02-UX-PRINCIPLES.md (สำคัญมาก โดยเฉพาะ Cross-Filter + Guest-First)
- docs/06-ROADMAP.md (Sprint 2)
- ดู components ของ shadcn/ui ที่มี

สิ่งที่ต้องทำ
1. Pages
   - Home (/) — hero search box, popular categories, popular vehicles
   - Search results (/search?q=...)
   - Category browse (/category/:slug)
   - Product detail (/product/:id)
   - Garage (/garage) — manage vehicles
   - Wishlist (/wishlist)

2. Components หลัก
   - SmartSearchBox (debounce 300ms + autocomplete + highlight + zero-result handling)
   - VehicleSelector (cascade dropdown: ยี่ห้อ → รุ่น → ปี → เครื่อง)
   - FilterChips (active filters bar + add filter modal)
   - ProductCard + ProductGrid (with skeleton)

3. State management
   - GarageContext (React Context + localStorage 30 วัน)
   - WishlistContext (Supabase + session-based)
   - SessionContext (generate session ID ถ้ายังไม่มี)

4. UX requirements ที่ต้อง enforce (ดู 02-UX-PRINCIPLES.md)
   - Guest ใช้งานได้ทุกอย่าง
   - Vehicle filter เก็บใน localStorage
   - Cross-filter ทำงานทุกหน้า
   - Mobile-first 360px
   - ทุก page มี loading/empty/error states

5. Performance
   - TanStack Query สำหรับ server state
   - Image lazy load
   - Code splitting per route
   - Lighthouse mobile > 85

ก่อนเริ่ม สรุปแผน + คำถาม
```

---

## Prompt #4 — Phase 1 Sprint 3 (Inquiry + Launch)

```
Sprint 3: Inquiry + Polish + Launch

อ่าน
- docs/06-ROADMAP.md (Sprint 3)
- docs/04-DATABASE-SCHEMA.md (inquiries table)
- docs/02-UX-PRINCIPLES.md (trust signals)

สิ่งที่ต้องทำ
1. Inquiry feature
   - Component: ContactStoreButton บนหน้าสินค้า → modal 3 ทางเลือก
     - A. Line OA deep link (line://oaMessage/...)
     - B. โทร (tel:)
     - C. Inquiry form
   - Form fields: ชื่อ, ช่องทางติดต่อ (เบอร์/Line/อีเมล อย่างน้อย 1), รถ (ถ้ามี garage), ข้อความ, สินค้าที่สนใจ (จาก wishlist หรือ current product)
   - Save inquiry ลง Supabase
   - Email notification ผ่าน Supabase Edge Function + Resend free tier
   - Confirmation page หลังส่ง

2. Admin view (minimal)
   - ใช้ Supabase Studio Table Editor เป็นหลัก
   - หรือสร้าง /admin route ที่ list inquiries + change status (auth ผ่าน Supabase)

3. Polish
   - Mobile responsive ทุกหน้า
   - Loading / empty / error states ครบ
   - SEO: meta tags, OG tags, sitemap.xml, robots.txt
   - Trust signals: Line OA prominent, footer มี address + phone
   - Lighthouse > 85 mobile

4. Deploy
   - Frontend → Vercel (free) หรือ Netlify
   - Supabase production project
   - Domain + SSL via Cloudflare
   - Sentry error tracking (free tier)

5. Launch checklist
   - Test ครบทุก flow บน mobile จริง
   - Test Line OA deep link
   - Test inquiry email reaches inbox
   - Test ใส่ข้อมูลผ่าน Studio แล้วเห็นบนเว็บ

ก่อนเริ่ม สรุปแผน + คำถาม
```

---

## วิธีใช้ prompts เหล่านี้

### 1. ใช้ทีละ Sprint
อย่าโยน prompt ทั้งหมดให้ Claude Code พร้อมกัน — แต่ละ Sprint ใช้เวลา ~1 สัปดาห์

### 2. Review ก่อน Claude Code จะเริ่มเขียน code
ทุก prompt จบด้วย "สรุปแผนก่อน" — อย่าข้าม

### 3. ถ้า Claude Code หลงทาง
พิมพ์: `อ่าน CLAUDE.md และ docs/02-UX-PRINCIPLES.md อีกครั้ง แล้ว review ว่า code ตรงกับหลักการไหม`

### 4. Commit เป็นช่วงๆ
หลังจบ feature ใหญ่ ขอให้ Claude Code
- รัน test
- update CHANGELOG.md
- Commit ด้วย conventional commits
- Push (ถ้า setup git remote)

### 5. เมื่อเจอ bug
- Describe expected vs actual
- Share error message
- Step to reproduce

ตัวอย่าง: `ลูกค้าค้น "ผ้าเบก ซีวิค" คาดว่าจะเจอผ้าเบรก Civic แต่ได้ผลลัพธ์ว่าง — ตรวจสอบ trigram threshold และ synonym dictionary`

---

## เมื่อเริ่ม Phase 2 หรือ Phase 3

สร้าง prompt ใหม่ใช้ pattern เดียวกัน
1. ระบุ phase + sprint
2. ระบุ docs ที่ต้องอ่าน
3. ระบุ deliverables ชัด
4. "สรุปแผนก่อน"
