# Technical Architecture

## Stack Overview

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend                                                    │
│  React 18 + TypeScript + Vite                                │
│  Tailwind CSS + shadcn/ui                                    │
│  TanStack Query + React Router v6                            │
│  @supabase/supabase-js                                       │
└──────────────────────────┬───────────────────────────────────┘
                           │ Direct (RLS-protected)
                           │ + Custom API for complex search
┌──────────────────────────▼───────────────────────────────────┐
│  Supabase (Backend-as-a-Service)                             │
│  - PostgreSQL 15 (with pg_trgm, unaccent)                    │
│  - Auth (built-in)                                           │
│  - Storage (สำหรับรูปสินค้า)                                 │
│  - Studio Admin UI (ใส่ข้อมูลเองได้)                          │
│  - Auto REST + GraphQL API                                   │
└──────────────────────────────────────────────────────────────┘
                           │
                           │ (optional for smart_search performance)
┌──────────────────────────▼───────────────────────────────────┐
│  Custom API (Phase 1: optional)                              │
│  Node.js + TypeScript + Express                              │
│  - smart_search wrapper (call Postgres function)             │
│  - rate limiting + analytics                                 │
└──────────────────────────────────────────────────────────────┘
```

## Stack Decisions & Rationale

### Why Supabase?
- **PostgreSQL 15 จริงๆ** — รองรับ pg_trgm + FTS โดยตรง ทำให้ smart search guide ใช้ได้
- **Studio admin UI** — ใส่ข้อมูลสินค้าเองได้ผ่าน web UI ไม่ต้อง build admin panel
- **Free tier ดี** — 500MB DB, 1GB storage, 50K MAU
- **Built-in Auth + Storage + Realtime** — ลดงาน setup
- **Auto-generated TypeScript types** จาก schema
- **ไม่ vendor lock-in แท้** — เป็น standard Postgres ย้ายออกได้ทุกเมื่อ
- **Alternative ที่พิจารณา:** PocketBase, Directus, self-host Postgres — ดูเหตุผลใน `DECISIONS.md`

### Why React + TypeScript + Vite?
- ผู้สร้างคุ้นเคย
- Ecosystem ใหญ่
- shadcn/ui = component library คุณภาพสูง

### Why Tailwind + shadcn/ui?
- ออกแบบเร็ว
- shadcn ไม่ใช่ library แต่เป็น code ที่ copy เข้า repo — custom ได้เต็ม
- bundle size เล็ก

### Why optional Custom API?
- Phase 1: ไม่จำเป็น — Supabase auto-generated API พอใช้
- เพิ่มได้เมื่อต้องการ
  - Custom rate limiting
  - Server-side analytics
  - Complex query ที่ rpc() ไม่สะดวก
  - Background jobs

## Project Structure

### Phase 1 (Minimal — Supabase-only)

```
auto-parts/
├── apps/
│   └── web/                       # React frontend (ตัวเดียวพอ)
│       ├── src/
│       │   ├── pages/             # Route components
│       │   ├── components/        # Reusable UI
│       │   ├── features/          # Feature-specific
│       │   │   ├── search/
│       │   │   ├── garage/
│       │   │   ├── wishlist/
│       │   │   └── inquiry/
│       │   ├── lib/
│       │   │   ├── supabase.ts    # Supabase client
│       │   │   └── api.ts
│       │   ├── hooks/
│       │   ├── types/             # Generated from Supabase schema
│       │   └── main.tsx
│       └── package.json
│
├── supabase/                      # Supabase project files
│   ├── migrations/                # SQL migrations (timestamped)
│   ├── seed.sql                   # Sample data
│   └── config.toml
│
├── docs/
├── prompts/
├── CLAUDE.md
└── README.md
```

### Phase 2+ (เพิ่ม custom backend)
```
auto-parts/
├── apps/
│   ├── web/
│   └── api/                       # เพิ่มเมื่อจำเป็น
├── supabase/
├── packages/
│   └── shared-types/
└── ...
```

## Data Flow

### Browse (most common)
```
User → React → Supabase JS Client (with RLS)
   ↓
Supabase PostgreSQL → return data
```

### Smart Search
```
User types → debounce 300ms → React Query
   ↓
Supabase.rpc('smart_search', {query, vehicle_id, ...})
   ↓
PostgreSQL smart_search() function (FTS + trigram + synonym)
   ↓
Ranked results → cache → UI
```

### Add to Wishlist (guest)
```
User clicks "Save" → Optimistic UI
   ↓
Supabase insert wishlist_items (with session_id)
   ↓
Confirm or rollback
```

### Inquiry / Contact Store
```
User clicks "ติดต่อร้าน" บนหน้าสินค้า
   ↓
3 ทางเลือก
  A. Line OA → deep link เปิด app Line ทันที (ส่ง product ID ใน payload)
  B. โทร → tel: link
  C. Inquiry form → save to Supabase + email notification (via Edge Function)
```

## Environment Setup

### Local Development
```bash
# 1. สมัคร Supabase (https://supabase.com) — ฟรี
# 2. สร้าง new project (เลือก region สิงคโปร์ใกล้ไทยสุด)
# 3. Copy URL + anon key

# 4. ใน frontend
cd apps/web
cp .env.example .env
# แก้ .env:
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

npm install
npm run dev
```

### Supabase CLI สำหรับ local dev
```bash
npm install -g supabase

# init
supabase init

# start local Supabase (Docker required)
supabase start

# รัน migrations
supabase db reset

# push schema ไป production
supabase db push
```

## Deployment Architecture

### Phase 1 (zero-cost)
```
┌──────────────────┐
│  Vercel / Netlify│ ← Frontend (free tier)
│  (Static + edge) │
└────────┬─────────┘
         │
         │ HTTPS
         ↓
┌──────────────────┐
│  Supabase Cloud  │ ← Database + Auth + Storage (free tier)
│  - PostgreSQL    │
│  - Studio UI     │
│  - Storage       │
└──────────────────┘
```

**Total Phase 1 cost: ฿0/เดือน**

### Phase 2 (เมื่อ scale)
- ถ้า Supabase free pause/พบ limit → upgrade Pro $25/mo
- ถ้าต้องการ Custom API → add Fly.io / Railway (~$5/mo)
- Domain + CDN: Cloudflare (free)

## Security

### Row Level Security (RLS)
สำคัญที่สุดเมื่อใช้ Supabase — ต้องเขียน policy ทุกตาราง

**ตัวอย่าง:**
```sql
-- ทุกคนอ่าน products ได้
CREATE POLICY "Public can view products"
  ON products FOR SELECT
  USING (true);

-- เฉพาะ admin แก้ products ได้
CREATE POLICY "Admin can modify products"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- User เห็น wishlist ของตัวเองเท่านั้น
CREATE POLICY "User views own wishlist"
  ON wishlist_items FOR SELECT
  USING (
    auth.uid() = user_id 
    OR session_id = current_setting('request.headers')::json->>'x-session-id'
  );
```

### Auth
- Phase 1: ไม่จำเป็น (browse + contact ทำเป็น guest ได้)
- Phase 2: Supabase Auth — email/password, Google, Line (เมื่อพร้อม)

### Input Validation
- Frontend: Zod schema ก่อนส่งไป Supabase
- Backend: RLS + Postgres CHECK constraints

### CORS
- Supabase จัดการให้ผ่าน Project Settings → API → CORS

## Monitoring (Phase 1)

- Supabase Dashboard — built-in metrics
- Error tracking: Sentry free tier
- Frontend analytics: Plausible / Umami / GA4

## Performance Targets

- Search response: < 200ms (p95) บน Supabase free tier
- Page load: < 2s on 4G
- Lighthouse mobile: ≥ 85

## Future Considerations

### When to add Custom API
- ต้องการ background job (email, notifications)
- Complex business logic ที่ไม่เหมาะใน Postgres function
- Rate limiting แบบละเอียดที่ Supabase ไม่ให้

### When to upgrade Supabase Pro
- Free project ถูก pause บ่อย
- DB size เกิน 500MB
- ต้องการ daily backup
- ต้องการ branch databases

### When to self-host
- Cost Supabase Pro แพงเกิน (น้อยมาก)
- Data sovereignty requirement
- Custom Postgres extensions
