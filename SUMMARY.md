# สรุป: ทำอะไรไปบ้าง ทำทำไม

เอกสารนี้สรุปทุกอย่างที่สร้างขึ้นและเหตุผลเบื้องหลัง — ให้คุณเข้าใจภาพรวมก่อนเริ่มใช้กับ Claude Code

## ภาพรวมที่สร้าง

ไฟล์ทั้งหมด 9 ไฟล์ จัดเป็นโครงสร้างมาตรฐานของโปรเจกต์ที่ Claude Code ทำงานด้วยได้ดี

```
auto-parts/
├── README.md                          ← Entry point อ่านก่อน
├── CLAUDE.md                          ← Instructions สำหรับ AI ⭐ สำคัญสุด
├── SUMMARY.md (ไฟล์นี้)               ← สำหรับ Win
├── docs/
│   ├── 01-PRD.md                      ← What & Why
│   ├── 02-UX-PRINCIPLES.md            ← หลักการ UX ที่ห้ามผิด ⭐
│   ├── 03-TECHNICAL-ARCHITECTURE.md   ← Stack & rationale
│   ├── 04-DATABASE-SCHEMA.md          ← Full schema
│   ├── 05-API-SPEC.md                 ← API contracts
│   ├── 06-ROADMAP.md                  ← Phase-by-phase plan
│   └── 07-SMART-SEARCH-GUIDE.md       ← Search implementation (จากครั้งก่อน)
└── prompts/
    └── kickoff-prompt.md              ← Prompt พร้อม copy ให้ Claude Code
```

## ทำอะไรในแต่ละไฟล์ และทำไม

### 1. README.md
**ทำ:** Entry point ของโปรเจกต์ — อธิบายเป้าหมาย, target users, stack สรุป, ลำดับการอ่าน docs

**ทำไม:** เป็นไฟล์แรกที่ใครก็ตามที่เข้ามาในโปรเจกต์จะเห็น Claude Code อ่านอัตโนมัติเมื่อเริ่ม session

### 2. CLAUDE.md ⭐
**ทำ:** Instructions เฉพาะสำหรับ Claude Code — coding conventions, decision-making rules, ห้ามทำ/ต้องทำ

**ทำไม:** Claude Code มีฟีเจอร์อ่าน `CLAUDE.md` ที่ project root อัตโนมัติทุก session ไฟล์นี้คือ "the contract" ที่ทำให้ Claude Code

- รู้ว่าควรถามก่อนทำเรื่องอะไร
- ใช้ stack ที่ระบุไว้ ไม่เปลี่ยนเอง
- ตามหลัก UX-first decisions
- ไม่เพิ่ม paid service โดยพลการ

**สิ่งที่สำคัญใน CLAUDE.md:**
- Section "ถามก่อนทำ" — ป้องกันการตัดสินใจใหญ่โดยไม่ปรึกษา
- Section "ห้ามทำ" — set guardrails ชัด
- Coding conventions — ลด churn จาก inconsistent code style

### 3. docs/01-PRD.md
**ทำ:** Product Requirements — vision, users, features ทั้ง Phase 1-3, success metrics

**ทำไม:** Claude Code ต้องเข้าใจ "what" และ "why" ก่อน "how" — ป้องกันการสร้าง feature ที่ไม่อยู่ใน scope หรือผิด requirement

### 4. docs/02-UX-PRINCIPLES.md ⭐
**ทำ:** 7 หลักการ UX ที่เป็น non-negotiable พร้อม checklist และ anti-patterns

**ทำไม:** Win เป็น UX designer — หลักการเหล่านี้คือสิ่งที่ทำให้เว็บแตกต่าง ถ้าไม่ระบุชัด Claude Code อาจสร้าง feature ที่ technically ถูกแต่ UX แย่ (เช่น บังคับ login, ไม่มี cross-filter, search ไม่ฉลาด)

**3 หลักการสำคัญที่เราคุยกันก่อนหน้านี้:**
1. Guest-first, Progressive commitment
2. Cross-filter everywhere
3. Smart search รับทุก input

ทั้งสามอย่างถูกบันทึกใน doc พร้อม implementation hints

### 5. docs/03-TECHNICAL-ARCHITECTURE.md
**ทำ:** Stack decisions พร้อมเหตุผล + alternatives ที่พิจารณา + project structure + deployment plan

**ทำไม:** เมื่อ Claude Code ตัดสินใจเรื่อง implementation ต้องมี anchor ว่า "เราเลือก stack นี้เพราะ..." ไม่งั้นจะเสนอ Next.js ทุกครั้ง

**Key decisions ที่ document ไว้:**
- Node.js + TypeScript (เพราะ Win ใช้เป็น)
- PostgreSQL (เพราะ FTS ฟรี)
- Monorepo structure
- VPS เดี่ยวสำหรับ Phase 1

### 6. docs/04-DATABASE-SCHEMA.md
**ทำ:** Schema ของตารางที่ไม่ได้อยู่ใน search guide (users, sessions, addresses, cart, orders) พร้อม common queries

**ทำไม:** Schema คือ contract ที่ frontend, backend, และ migrations ต้อง align ถ้าไม่มี doc กลาง Claude Code จะ infer ผิดพลาดได้

### 7. docs/05-API-SPEC.md
**ทำ:** REST API endpoints ทั้งหมด ที่มี request/response shape, error codes, rate limits

**ทำไม:** API คือ contract ระหว่าง backend และ frontend — กำหนดล่วงหน้าทำให้ทั้งสองทีม (หรือ Claude Code working on both) ไม่ขัดกัน

### 8. docs/06-ROADMAP.md
**ทำ:** แบ่งงานเป็น Phase 0, 1, 2, 3 + sprints — แต่ละ sprint มี deliverables ชัด

**ทำไม:** ไม่อยากให้ Claude Code โยน feature ทั้งหมดออกมาพร้อมกัน — roadmap ทำให้ scope ชัด ว่า sprint นี้ทำแค่ไหน

**Phase 1 = 4 sprints ใน 4 สัปดาห์:**
- Sprint 1: Catalog + Search
- Sprint 2: Browse + Filter UI
- Sprint 3: Cart + Checkout
- Sprint 4: Polish + Launch

### 9. docs/07-SMART-SEARCH-GUIDE.md
**ทำ:** Implementation guide ที่ละเอียดของ search engine (สร้างจาก session ก่อนหน้า)

**ทำไม:** Search คือ core feature ที่ซับซ้อนที่สุด — ต้องมี doc ที่ Claude Code อ้างอิงตอน implement ไม่งั้นจะหลงทาง

### 10. prompts/kickoff-prompt.md
**ทำ:** Prompts 3 ตัว (Phase 0, Sprint 1, Sprint 2) ที่ Win copy-paste ให้ Claude Code ได้เลย

**ทำไม:** Prompt ที่ดีคือสิ่งที่ตัดสินว่า Claude Code จะ output ดีหรือไม่ — แทนที่ Win จะคิด prompt ใหม่ทุกครั้ง มี template ที่ proven

**Pattern ของ prompt:**
1. ระบุ phase/sprint
2. ระบุ docs ที่ต้องอ่าน
3. ระบุ deliverables ชัด
4. End with "สรุปแผนก่อน" (ห้ามเริ่ม code ก่อน confirm)

---

## ทำไม structure นี้ดี

### 1. แยก "what to build" จาก "how to behave"
- PRD/UX-Principles = what
- CLAUDE.md = how to behave
- Architecture/Schema/API = how to build

Claude Code จะอ่าน CLAUDE.md ก่อนเสมอ ทำให้ "behavior" ถูกต้องก่อน "output"

### 2. Decisions ถูก document
ทุกการตัดสินใจสำคัญมีเหตุผลใน doc — เมื่อ Claude Code (หรือ developer ใหม่) สงสัย ก็มีคำตอบไว้แล้ว ไม่ต้องเดา

### 3. Phased approach
แทนที่จะส่ง requirements ทั้งหมด 3 phase ให้ Claude Code ในครั้งเดียว — เราแบ่งเป็น sprint ทำให้
- Scope ชัด
- ตรวจคุณภาพได้บ่อย
- ปรับ direction ได้ระหว่างทาง

### 4. Searchable + Maintainable
ทุก doc มี heading structure ชัด — เมื่อ codebase โต doc ยังตามได้

---

## วิธีใช้งานต่อ

### ขั้นที่ 1: Review docs
อ่าน docs ทั้งหมดก่อน (โดยเฉพาะ 02-UX-PRINCIPLES และ 06-ROADMAP) ดูว่าตรงกับที่ต้องการไหม ปรับได้ตามใจ

### ขั้นที่ 2: สร้าง repo จริง
- สร้าง GitHub repo ใหม่
- Copy ไฟล์ทั้งหมดเข้า repo
- Initial commit

### ขั้นที่ 3: เปิด Claude Code
```bash
cd auto-parts
claude
```

### ขั้นที่ 4: Send prompt แรก
Copy prompt #1 จาก `prompts/kickoff-prompt.md` ส่งให้ Claude Code

### ขั้นที่ 5: Review plan
Claude Code จะ summarize แผน — review แล้วค่อย confirm ให้เริ่มเขียน code

### ขั้นที่ 6: Iterate sprint by sprint
- Sprint จบ → review code → merge
- Sprint ถัดไปใช้ prompt #2, #3, ...

---

## ข้อสังเกตเพิ่มเติม

### ไฟล์ไหนต้อง update บ่อย
- **CHANGELOG.md** — Claude Code ควร update ทุก sprint
- **docs/04-DATABASE-SCHEMA.md** — update เมื่อมี migration ใหม่
- **docs/05-API-SPEC.md** — update เมื่อเพิ่ม/แก้ endpoint
- **docs/06-ROADMAP.md** — update เมื่อปรับ scope

### ไฟล์ที่ stable
- **CLAUDE.md** — แก้น้อย เพราะเป็น behavior rules
- **docs/02-UX-PRINCIPLES.md** — เปลี่ยนแค่เมื่อ vision เปลี่ยน
- **docs/03-TECHNICAL-ARCHITECTURE.md** — เปลี่ยนแค่ตอน major refactor

### ส่วนที่ยังต้องตัดสินใจ (open questions ใน PRD)
1. ยี่ห้อรถที่จะรองรับ Phase 1 — เริ่ม 5 ยี่ห้อหลัก หรือทั้งหมด?
2. Payment gateway — Stripe / Omise / GBPrimePay?
3. Shipping — Kerry / Flash / J&T?
4. Inventory — manual หรือ integrate กับ POS?

ตัดสินใจก่อน Phase 1 Sprint 3 (Cart + Checkout) เพราะกระทบ implementation

---

## ของแถม: Tips สำหรับทำงานกับ Claude Code

### 1. ใช้ "/clear" เป็นระยะ
เมื่อ context ยาวมาก ให้ `/clear` แล้วเริ่ม session ใหม่ Claude Code จะอ่าน CLAUDE.md อีกครั้ง

### 2. หาก Claude Code "หลงทาง"
พิมพ์: `อ่าน CLAUDE.md และ docs/02-UX-PRINCIPLES.md อีกครั้ง แล้ว review ว่า code ที่ทำตรงกับหลักการไหม`

### 3. ขอ summary หลัง task ใหญ่
`สรุปสิ่งที่ทำในวันนี้ + ที่เหลือสำหรับ sprint นี้ + risk หรือ blocker ที่เจอ`

### 4. Test เป็นกฎเหล็ก
ตามที่ระบุใน CLAUDE.md: ห้าม disable test ที่ fail — ถ้า Claude Code พยายาม skip ให้ challenge

### 5. Commit message ดีจะช่วย future you
ขอให้ Claude Code commit ด้วย conventional commits — ตอน debug 3 เดือนต่อมาจะขอบคุณตัวเอง

---

## คำถามที่อาจมี

**Q: ทำไมไม่ใช้ Next.js หรือ T3 stack?**
A: เพราะ Win คุ้นกับ Express + React separated มากกว่า และ debug ง่ายกว่าตอน Phase 1 หาก Phase 2+ ต้องการ SEO อาจ migrate frontend ไป Next.js ได้

**Q: ทำไมไม่ใช้ Prisma หรือ Drizzle ORM?**
A: PostgreSQL function สำหรับ smart_search ต้องเขียน raw SQL อยู่แล้ว — adding ORM เพิ่ม complexity โดยไม่ได้เพิ่ม value มาก Phase 2 ถ้าทีมโตค่อยพิจารณา Drizzle (TypeScript-first, lightweight)

**Q: ค่าใช้จ่ายรวมต่อเดือนสำหรับ Phase 1 production?**
A: ประมาณ
- VPS Hetzner CX22: ~฿200/เดือน
- Domain: ~฿400/ปี = ~฿35/เดือน
- Cloudflare: ฟรี
- Sentry: ฟรี tier
- Email (SendGrid free): ฟรี 100 emails/วัน
- **รวม: < ฿300/เดือน**

**Q: ใช้ Claude Code ค่าใช้จ่ายเท่าไหร่?**
A: ขึ้นกับ usage — Claude Pro $20/เดือน หรือใช้ API pay-as-you-go ใน Code SDK สำหรับการสร้างเว็บ Phase 1 น่าจะ ~$50-100 ตลอด development

---

ถ้ามีอะไรอยากปรับ ก่อนเริ่มใช้กับ Claude Code บอกได้เลย
