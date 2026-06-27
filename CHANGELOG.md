# Changelog

## [Unreleased] — Phase 1 Sprint 1

### Added
- Supabase migrations (8 ไฟล์)
  - `20260627000000_init_extensions.sql` — pg_trgm + unaccent
  - `20260627001000_create_vehicles.sql` — ตารางรถยนต์
  - `20260627002000_create_categories.sql` — หมวดหมู่ 2 ระดับ
  - `20260627003000_create_products.sql` — ตารางสินค้า + trigger + FTS + trigram indexes
  - `20260627004000_create_product_support.sql` — product_images, product_vehicles, product_inventory, view
  - `20260627005000_create_search_tables.sql` — search_synonyms, search_logs
  - `20260627006000_create_search_functions.sql` — `expand_query_with_synonyms()` + `smart_search()`
  - `20260627007000_create_sessions.sql` — sessions, user_vehicles (garage), wishlist_items, inquiries
  - `20260627008000_create_rls_policies.sql` — RLS ทุกตาราง
- Seed data (`supabase/seed.sql`)
  - 120 vehicles: 8 ยี่ห้อ × 3-5 รุ่น × 5 ปี (Toyota, Honda, Nissan, Mazda, Mitsubishi, Isuzu, Suzuki, Subaru)
  - 25 categories: 10 หลัก + 15 ย่อย
  - 62 products: ผ้าเบรก, โช้คอัพ, กรองอากาศ, หัวเทียน, ไดชาร์จ, คอมแอร์ ฯลฯ
  - product_inventory (สต็อก mock)
  - product_images (placeholder URLs)
  - product_vehicles links
  - 50 search synonyms: ไทย-อังกฤษ, ยี่ห้อรถ, รุ่นรถ, ยี่ห้ออะไหล่
- `apps/web/src/lib/search.ts`
  - `smartSearch()` — wraps `rpc('smart_search')` พร้อม logging
  - `searchSuggestions()` — trigram autocomplete
- `npm run types:gen` script — generate TypeScript types จาก Supabase schema

---

## [0.1.0] — 2026-06-27 — Phase 0 Foundation

### Added
- React 19 + TypeScript + Vite project setup (`apps/web/`)
- Tailwind CSS v4 + shadcn/ui
- TanStack Query v5 + React Router v7
- `@supabase/supabase-js` client + `.env.example`
- `src/lib/supabase.ts` — Supabase client singleton
- HelloPage — แสดง Supabase connection status + latency
- ESLint (oxlint) + Prettier + Husky pre-commit hook
- Vitest + jsdom + @testing-library/react — `npm run test`
- GitHub Actions CI: typecheck + lint + test + build on push/PR
- Supabase CLI initialized (`supabase/config.toml`)
- First migration: enable pg_trgm + unaccent
- Project documentation: PRD, UX Principles, Architecture, Schema, Roadmap
