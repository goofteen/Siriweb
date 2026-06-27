# CLAUDE.md

ไฟล์นี้คือคำสั่งที่ Claude Code อ่านอัตโนมัติทุกครั้งที่เปิด session ในโปรเจกต์นี้

## บริบทของโปรเจกต์

โปรเจกต์นี้คือเว็บไซต์ขายอะไหล่รถยนต์ออนไลน์ที่เน้น UX ระดับสูง ผู้สร้างโปรเจกต์คือ Product/UX Designer ที่มีพื้นฐาน coding จำกัด — Claude Code เป็นคนเขียน code 90%+ ผู้สร้างจะรีวิวและตัดสินใจเชิง product/design

## หลักการทำงาน

### 1. อ่าน docs ก่อนเขียน code
ก่อนเริ่มงานทุก feature ให้อ่านเอกสารที่เกี่ยวข้องใน `docs/` เพื่อเข้าใจ context และ constraint ที่ตัดสินใจไว้แล้ว — โดยเฉพาะ

- `docs/02-UX-PRINCIPLES.md` — หลักการ UX ที่ห้ามผิด **อ่านทุกครั้งก่อนทำ feature ที่เกี่ยวข้องกับ user-facing**
- `docs/03-TECHNICAL-ARCHITECTURE.md` — เพื่อยึด stack
- `docs/04-DATABASE-SCHEMA.md` — ก่อนแก้ schema

### 2. ถามก่อนทำเมื่อตัดสินใจสำคัญ
ทำได้ทันทีโดยไม่ต้องถาม
- เลือก library ที่ไม่กระทบ architecture หลัก
- สไตล์ code, variable naming, file organization
- การแก้ bug หรือเพิ่ม test
- การ refactor ภายใน module เดียว

ต้องถามก่อน
- เพิ่ม dependency ใหม่ที่มี cost (paid service)
- เปลี่ยน database schema
- เปลี่ยน API contract ที่ frontend ใช้แล้ว
- การตัดสินใจเชิง UX/product (ปรึกษาเจ้าของโปรเจกต์)

### 3. UX-first decisions
เมื่อต้องเลือกระหว่าง "ทำง่ายสำหรับ dev" กับ "ดีสำหรับ user" — เลือกอย่างหลังเสมอ และอธิบายเหตุผลใน commit message
- ตัวอย่าง: ลูกค้าใส่ทะเบียนรถผิด format ระบบควรพยายามแปลงให้ ไม่ใช่ throw error
- ตัวอย่าง: search ผลลัพธ์ 0 ผลลัพธ์ ควรแนะนำคำใกล้เคียง ไม่ใช่แสดงหน้าว่าง

## Coding Conventions

### TypeScript
- ใช้ TypeScript strict mode (`"strict": true` ใน tsconfig)
- หลีกเลี่ยง `any` — ถ้าจำเป็นต้องใช้ ให้ comment อธิบาย
- export interface สำหรับ public API ของแต่ละ module
- ใช้ `async/await` ไม่ใช้ `.then()` chain

### File Organization
```
src/
  api/           # Express routes
  services/      # Business logic
  db/            # Database client + queries
  types/         # Shared TypeScript types
  utils/         # Pure utility functions
  config/        # Environment, constants
```

### Naming
- File names: kebab-case (`smart-search.ts`)
- React components: PascalCase (`SearchBox.tsx`)
- Functions/variables: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Database columns: snake_case (Postgres convention)

### Comments
- เขียน comment เป็นภาษาไทยได้ ถ้าเรื่องเป็น domain-specific (เช่น "ผ้าเบรกเรียก part name หลายแบบ")
- Comment อธิบาย **ทำไม** ไม่ใช่ **ทำอะไร** (code บอกอยู่แล้วว่าทำอะไร)

## Database

### Conventions
- ทุกตารางมี `id SERIAL PRIMARY KEY`, `created_at TIMESTAMP DEFAULT NOW()`
- Foreign key ใช้ `<table>_id` เช่น `product_id`
- Boolean ใช้ prefix `is_` หรือ `has_` เช่น `is_active`, `in_stock`
- Index ทุก foreign key

### Migration
- ใช้ migration tool (เช่น node-pg-migrate หรือ Knex)
- ห้าม edit migration ที่ commit แล้ว สร้างใหม่เสมอ
- Migration ต้อง reversible (มี `up` และ `down`)

## Frontend

### Component Rules
- Functional components + hooks เท่านั้น (ไม่ใช้ class components)
- 1 component = 1 file
- ใช้ TypeScript interface สำหรับ props
- ห้าม inline style ที่ซับซ้อน — ใช้ CSS module หรือ Tailwind

### State Management
- Phase 1: React state + Context สำหรับ global (vehicle garage, cart)
- Phase 2 ขึ้นไปค่อยพิจารณา Zustand / Redux Toolkit ตามความซับซ้อน
- ห้ามใช้ state library โดยไม่จำเป็น

### Accessibility
- ทุก interactive element ต้อง keyboard-navigable
- ใส่ `alt` text ใน image ทุกรูป
- ใช้ semantic HTML (`<button>` ไม่ใช่ `<div onClick>`)

## Testing

### Priority
- Phase 1 (MVP): test critical paths เท่านั้น (search, cart, checkout)
- Unit test สำหรับ utility functions
- Integration test สำหรับ API endpoints หลัก
- E2E test (Playwright) สำหรับ user journey หลัก

### Style
- ใช้ Vitest สำหรับ unit/integration
- Test file วางข้าง source: `smart-search.ts` + `smart-search.test.ts`

## Git Workflow

### Commit Messages
ใช้ conventional commits
- `feat:` ฟีเจอร์ใหม่
- `fix:` แก้ bug
- `refactor:` ปรับโครงสร้างโดยไม่เปลี่ยน behavior
- `docs:` แก้เอกสาร
- `chore:` งานอื่น (config, dependencies)

ตัวอย่าง: `feat(search): add fuzzy match for Thai brand names`

### Branches
- `main` — production-ready
- `feature/<name>` — new feature
- `fix/<name>` — bug fix

## Performance Targets

- Search API response: < 200ms (p95)
- Page load (initial): < 2s on 4G
- Lighthouse score: ≥ 85 ในทุกหมวด (mobile)

## ที่ต้องระวังเป็นพิเศษ

### Security
- ห้าม commit `.env` หรือ secret ใดๆ
- ใช้ parameterized query เสมอ (ห้าม string interpolation ใน SQL)
- Validate input ที่ API layer ด้วย zod
- Rate limit ทุก public endpoint

### Thai language
- รองรับ UTF-8 ในทุก layer (database collation, file encoding, HTTP headers)
- คำเล่นไทย-อังกฤษผสม คือเรื่องปกติ ระบบต้องรับได้
- ดู synonym dictionary ที่ `docs/07-SMART-SEARCH-GUIDE.md`

### Money/Pricing
- เก็บราคาเป็น `DECIMAL(10,2)` ไม่ใช่ float
- คำนวณราคาที่ backend เสมอ (อย่าเชื่อ frontend)
- ใส่ภาษีและค่าส่งให้ชัดในทุก step

## เมื่อสงสัย

1. อ่าน docs ที่เกี่ยวข้องก่อน
2. ดู existing code ในส่วนคล้ายกัน
3. ถามเจ้าของโปรเจกต์ — อย่าตัดสินใจเองในเรื่อง product/UX

## สิ่งที่ห้ามทำ

- ห้ามใช้ paid service โดยไม่ได้รับอนุญาต (project นี้ตั้งใจ start ฟรี)
- ห้ามเพิ่ม dependency ขนาดใหญ่โดยไม่ปรึกษา (lodash, moment.js etc.)
- ห้าม commit auto-generated file ที่ไม่จำเป็น
- ห้ามแก้ schema โดยไม่สร้าง migration
- ห้าม disable test ที่ fail — แก้ root cause
