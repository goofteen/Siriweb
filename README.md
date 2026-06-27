# Auto Parts E-commerce Platform

เว็บไซต์ขายอะไหล่รถยนต์ที่ออกแบบ UX ตามหลัก customer-centric เพื่อแก้ปัญหา 3 อันดับแรกของตลาด: ค้นหายาก, ไม่มั่นใจว่าถูกคัน, และส่งคืนยุ่งยาก

## เป้าหมายของโปรเจกต์

สร้างเว็บอะไหล่รถยนต์ที่ **"หาเจอเสมอ ใช้กับรถได้แน่ ติดต่อร้านง่าย"** ผ่านการออกแบบ search/filter ที่ฉลาดพอที่จะรับ input ของลูกค้าได้ทุกรูปแบบ ตั้งแต่ part number แบบเป๊ะ ไปจนถึงคำเล่นที่พิมพ์ผิด

**Phase 1 = Catalog + Inquiry** (ไม่ใช่ full e-commerce — ดู `docs/DECISIONS.md`)

## กลุ่มลูกค้าหลัก 3 กลุ่ม

1. **ช่าง/อู่ซ่อม (~45%)** — ซื้อบ่อย ต้องการเร็ว แม่นยำ ราคาส่ง
2. **เจ้าของรถทั่วไป/DIY (~35%)** — ไม่มั่นใจรหัสอะไหล่ ต้องการคำยืนยัน
3. **ผู้ซื้อเพื่อขายต่อ (~20%)** — ซื้อครั้งละมาก ต้องการ bulk pricing

## Stack สรุป

- **Backend:** Supabase (PostgreSQL 15 + Auth + Storage + Studio admin UI)
- **Frontend:** React + TypeScript + Vite + Tailwind + shadcn/ui
- **Search:** PostgreSQL Full-Text Search + pg_trgm (built into Supabase)
- **Hosting:** Vercel/Netlify (frontend) + Supabase Cloud — **฿0/เดือน Phase 1**

## เอกสารในโปรเจกต์

อ่านตามลำดับนี้

| # | File | สำหรับ |
|---|------|--------|
| - | [`CLAUDE.md`](./CLAUDE.md) | AI assistant instructions ⭐ |
| - | [`docs/DECISIONS.md`](./docs/DECISIONS.md) | Decision log ⭐ |
| 1 | [`docs/01-PRD.md`](./docs/01-PRD.md) | Product requirements |
| 2 | [`docs/02-UX-PRINCIPLES.md`](./docs/02-UX-PRINCIPLES.md) | UX principles (non-negotiable) ⭐ |
| 3 | [`docs/03-TECHNICAL-ARCHITECTURE.md`](./docs/03-TECHNICAL-ARCHITECTURE.md) | Stack & rationale |
| 4 | [`docs/04-DATABASE-SCHEMA.md`](./docs/04-DATABASE-SCHEMA.md) | Schema |
| 5 | [`docs/05-API-SPEC.md`](./docs/05-API-SPEC.md) | Supabase queries + RPC |
| 6 | [`docs/06-ROADMAP.md`](./docs/06-ROADMAP.md) | Phase-by-phase plan |
| 7 | [`docs/07-SMART-SEARCH-GUIDE.md`](./docs/07-SMART-SEARCH-GUIDE.md) | Search implementation |
| - | [`prompts/kickoff-prompt.md`](./prompts/kickoff-prompt.md) | Claude Code prompts |

## Local Development

### Prerequisites

- Node.js 22+
- [Supabase account](https://supabase.com) (ฟรี)

### Setup

```bash
# 1. Clone
git clone https://github.com/goofteen/Siriweb.git
cd Siriweb

# 2. Install root dependencies (Husky)
npm install

# 3. Setup frontend
cd apps/web
npm install

# 4. ตั้งค่า environment variables
cp .env.example .env
# แก้ .env: ใส่ VITE_SUPABASE_ANON_KEY จาก Supabase → Project Settings → API

# 5. Run dev server
npm run dev
```

เปิด http://localhost:5173

### Scripts (จาก root)

```bash
npm run dev        # Start dev server
npm run build      # Build production
npm run typecheck  # TypeScript check
npm run lint       # Lint code
```

### Scripts (จาก apps/web)

```bash
npm run dev           # Vite dev server
npm run build         # TypeScript + Vite build
npm run typecheck     # tsc --noEmit
npm run lint          # oxlint
npm run format        # Prettier write
npm run format:check  # Prettier check
```

## Project Structure

```
Siriweb/
├── apps/
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── pages/          # Route components
│       │   ├── components/     # Shared UI
│       │   ├── features/       # Feature modules
│       │   │   ├── search/
│       │   │   ├── garage/
│       │   │   ├── wishlist/
│       │   │   └── inquiry/
│       │   ├── lib/
│       │   │   └── supabase.ts # Supabase client
│       │   ├── hooks/
│       │   └── types/
│       ├── .env.example
│       └── package.json
│
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── seed.sql
│   └── config.toml
│
├── docs/                       # Project documentation
├── .github/workflows/ci.yml    # CI: typecheck + build
└── README.md
```

## วิธีเริ่มงานกับ Claude Code

```bash
# 1. clone repo
git clone https://github.com/goofteen/Siriweb.git
cd Siriweb

# 2. เปิด Claude Code
claude

# 3. ส่ง prompt เริ่มต้น
# copy จาก prompts/kickoff-prompt.md
```

Claude Code จะอ่าน `CLAUDE.md` อัตโนมัติทุกครั้งที่เริ่ม session

## Roadmap

- [x] **Phase 0** — Foundation (React + Supabase setup)
- [ ] **Phase 1 Sprint 1** — Database schema + Smart search
- [ ] **Phase 1 Sprint 2** — Browse + Filter UI
- [ ] **Phase 1 Sprint 3** — Inquiry + Deploy
- [ ] **Phase 2** — E-commerce (cart + checkout + payment)
