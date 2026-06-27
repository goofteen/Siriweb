# Smart Search Implementation Guide
## PostgreSQL Full-Text Search + Thai Support สำหรับเว็บอะไหล่รถยนต์

เอกสารนี้คือคู่มือ implementation แบบ end-to-end ตั้งแต่ database schema, search logic, ไปจนถึง backend API และ frontend integration ใช้ stack ที่ทุกอย่างฟรี และทำงานได้จริงในระดับ production สำหรับ catalog ขนาด 10,000–100,000 SKU

**Stack ที่ใช้:** PostgreSQL 14+ · Node.js + TypeScript · React (frontend)

**ใช้เวลา setup:** ~1–2 วัน สำหรับ MVP ที่ใช้งานได้จริง

---

## ภาพรวม Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   React     │ ───→ │  Express API │ ───→ │   PostgreSQL    │
│  Frontend   │      │   /search    │      │  + pg_trgm      │
│  (debounce) │ ←─── │              │ ←─── │  + GIN indexes  │
└─────────────┘      └──────────────┘      └─────────────────┘
                            │
                            ↓
                     ┌──────────────┐
                     │ Synonym Map  │
                     │ (JSON / DB)  │
                     └──────────────┘
```

**3 ชั้นของ matching ที่ทำงานพร้อมกัน:**
1. **Full-text search** (tsvector) — สำหรับคำที่ตรงหรือใกล้เคียง
2. **Trigram matching** (pg_trgm) — สำหรับ typo และภาษาไทย
3. **Synonym expansion** — สำหรับคำเล่นและ Thai-English mapping

---

## 1. Database Setup

### 1.1 เปิด extensions ที่จำเป็น

```sql
-- เปิด extensions (รันครั้งเดียวต่อ database)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ทดสอบว่าเปิดได้
SELECT similarity('ผ้าเบรก', 'ผ้าเบก');  -- ต้องได้ค่า > 0
```

### 1.2 Schema หลัก

```sql
-- ตาราง products
CREATE TABLE products (
  id              SERIAL PRIMARY KEY,
  sku             VARCHAR(50) UNIQUE NOT NULL,
  oem_part_number VARCHAR(100),
  name_th         VARCHAR(255) NOT NULL,
  name_en         VARCHAR(255),
  description_th  TEXT,
  description_en  TEXT,
  brand           VARCHAR(100),
  category_id     INTEGER,
  price           DECIMAL(10,2),
  in_stock        BOOLEAN DEFAULT true,
  
  -- search columns (auto-populated by trigger)
  search_vector   tsvector,
  searchable_text TEXT,
  
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ตารางรถยนต์ที่รองรับ
CREATE TABLE vehicles (
  id         SERIAL PRIMARY KEY,
  brand      VARCHAR(50) NOT NULL,
  model      VARCHAR(100) NOT NULL,
  year_from  INTEGER,
  year_to    INTEGER,
  engine     VARCHAR(50),
  UNIQUE(brand, model, year_from, year_to, engine)
);

-- ความสัมพันธ์ product ↔ vehicle (many-to-many)
CREATE TABLE product_vehicles (
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, vehicle_id)
);

-- ตาราง synonym dictionary
CREATE TABLE search_synonyms (
  id        SERIAL PRIMARY KEY,
  canonical VARCHAR(100) NOT NULL,
  synonyms  TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ตารางเก็บ search logs (สำหรับ analytics และ zero-result tracking)
CREATE TABLE search_logs (
  id              SERIAL PRIMARY KEY,
  query           TEXT NOT NULL,
  results_count   INTEGER NOT NULL,
  session_id      VARCHAR(100),
  vehicle_filter  INTEGER,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

### 1.3 Indexes สำหรับ performance

```sql
-- GIN index สำหรับ full-text search (เร็วมาก)
CREATE INDEX idx_products_fts ON products USING GIN (search_vector);

-- GIN index สำหรับ trigram (fuzzy match รวมไทย)
CREATE INDEX idx_products_trgm ON products USING GIN (searchable_text gin_trgm_ops);

-- B-tree สำหรับ filter ปกติ
CREATE INDEX idx_products_brand ON products (brand);
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_oem ON products (oem_part_number);
CREATE INDEX idx_product_vehicles_vehicle ON product_vehicles (vehicle_id);

-- สำหรับ zero-result analysis
CREATE INDEX idx_search_logs_zero ON search_logs (created_at) 
  WHERE results_count = 0;
```

### 1.4 Trigger สำหรับ auto-update search columns

```sql
CREATE OR REPLACE FUNCTION update_product_search_columns()
RETURNS trigger AS $$
BEGIN
  -- search_vector ให้น้ำหนัก: SKU/OEM สูงสุด, ชื่อรองลงมา, description ต่ำสุด
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.sku, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.oem_part_number, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.name_th, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.name_en, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.brand, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_th, '')), 'D') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_en, '')), 'D');

  -- searchable_text สำหรับ trigram matching (ทุกอย่างรวมกัน, lowercase)
  NEW.searchable_text := lower(
    COALESCE(NEW.sku, '') || ' ' ||
    COALESCE(NEW.oem_part_number, '') || ' ' ||
    COALESCE(NEW.name_th, '') || ' ' ||
    COALESCE(NEW.name_en, '') || ' ' ||
    COALESCE(NEW.brand, '') || ' ' ||
    COALESCE(NEW.description_th, '')
  );

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_columns();
```

**ทำไมใช้ `'simple'` ไม่ใช่ `'english'`?**
- `'english'` จะ stem คำเช่น "running" → "run" ซึ่งช่วยกับ English แต่ทำลายภาษาไทย
- `'simple'` แค่ lowercases — ทำงานได้กับทั้งสองภาษา และส่งงาน fuzzy matching ให้ trigram จัดการต่อ

---

## 2. Synonym Dictionary

### 2.1 เติมข้อมูล synonym สำหรับอะไหล่รถ

```sql
INSERT INTO search_synonyms (canonical, synonyms) VALUES
-- ระบบเบรก
('ผ้าเบรก', ARRAY['brake pad', 'brake-pad', 'ผ้าดิส', 'ผ้าดิสเบรก', 'ผ้าเบรค', 'brakepad']),
('จานเบรก', ARRAY['brake disc', 'brake rotor', 'จานดิส', 'ดิสเบรก']),
('น้ำมันเบรก', ARRAY['brake fluid', 'น้ำมันเบรค', 'dot3', 'dot4']),

-- ระบบไฟฟ้า
('ไดชาร์จ', ARRAY['alternator', 'ไดชาร์ท', 'dynamo']),
('ไดสตาร์ท', ARRAY['starter', 'starter motor', 'ไดสตาร์ต', 'มอเตอร์สตาร์ท']),
('แบตเตอรี่', ARRAY['battery', 'แบต', 'batt']),
('หัวเทียน', ARRAY['spark plug', 'sparkplug', 'spark']),

-- ระบบช่วงล่าง
('โช้คอัพ', ARRAY['shock absorber', 'shock', 'โช้ค', 'โช๊คอัพ', 'damper']),
('ลูกหมาก', ARRAY['ball joint', 'ลูกหมากปีกนก']),
('ลูกปืนล้อ', ARRAY['wheel bearing', 'แบริ่งล้อ', 'bearing']),
('ปีกนก', ARRAY['control arm', 'a-arm', 'wishbone']),

-- ระบบเครื่องยนต์
('กรองอากาศ', ARRAY['air filter', 'กรองแอร์']),
('กรองน้ำมัน', ARRAY['oil filter', 'กรองน้ำมันเครื่อง']),
('สายพาน', ARRAY['belt', 'timing belt', 'สายพานไทม์มิ่ง']),
('หม้อน้ำ', ARRAY['radiator']),

-- ระบบแอร์
('คอมเพรสเซอร์แอร์', ARRAY['ac compressor', 'a/c compressor', 'คอมแอร์', 'คอมเพรซเซอร์']),
('คอยล์แอร์', ARRAY['evaporator', 'คอยล์เย็น']),

-- ยี่ห้อรถ (Thai-English mapping)
('honda', ARRAY['ฮอนด้า', 'ฮอนดา']),
('toyota', ARRAY['โตโยต้า', 'โตโยตา', 'tyt']),
('isuzu', ARRAY['อีซูซุ', 'อีซูสุ', 'isz']),
('mitsubishi', ARRAY['มิตซูบิชิ', 'มิทซูบิชิ', 'mit']),
('nissan', ARRAY['นิสสัน']),
('mazda', ARRAY['มาสด้า']),
('ford', ARRAY['ฟอร์ด']),

-- รุ่นรถยอดนิยม
('civic', ARRAY['ซีวิค', 'ซิวิค']),
('city', ARRAY['ซิตี้', 'ซิตี้']),
('vios', ARRAY['วีออส']),
('camry', ARRAY['คัมรี่', 'แคมรี่']),
('d-max', ARRAY['ดีแม็กซ์', 'dmax', 'd max']);
```

**Tip สำคัญ:** เริ่มจาก dictionary ขนาดเล็ก ~50 entries ที่ครอบคลุมหมวดหลัก แล้วใช้ **search log** (ดูข้อ 6) เพื่อเพิ่มคำที่ลูกค้าค้นจริง

### 2.2 Function สำหรับ expand query ด้วย synonym

```sql
CREATE OR REPLACE FUNCTION expand_query_with_synonyms(input_query TEXT)
RETURNS TEXT AS $$
DECLARE
  expanded TEXT;
  syn_record RECORD;
BEGIN
  expanded := lower(input_query);
  
  -- หา synonym ที่ match กับ input
  FOR syn_record IN
    SELECT canonical, synonyms FROM search_synonyms
    WHERE lower(input_query) LIKE '%' || lower(canonical) || '%'
       OR EXISTS (
         SELECT 1 FROM unnest(synonyms) AS s 
         WHERE lower(input_query) LIKE '%' || lower(s) || '%'
       )
  LOOP
    -- เพิ่ม canonical และ synonym ทั้งหมดเข้าไปใน query
    expanded := expanded || ' ' || syn_record.canonical || ' ' 
                || array_to_string(syn_record.synonyms, ' ');
  END LOOP;
  
  RETURN expanded;
END;
$$ LANGUAGE plpgsql;

-- ทดสอบ
SELECT expand_query_with_synonyms('ผ้าเบรก ซีวิค');
-- output: 'ผ้าเบรก ซีวิค ผ้าเบรก brake pad brake-pad ผ้าดิส ... civic ซีวิค ซิวิค'
```

---

## 3. Smart Search Function

นี่คือหัวใจของระบบ — combine full-text + trigram + synonym ในการ query เดียว

```sql
CREATE OR REPLACE FUNCTION smart_search(
  p_query           TEXT,
  p_vehicle_id      INTEGER DEFAULT NULL,
  p_category_id     INTEGER DEFAULT NULL,
  p_brand           TEXT    DEFAULT NULL,
  p_min_price       DECIMAL DEFAULT NULL,
  p_max_price       DECIMAL DEFAULT NULL,
  p_limit           INTEGER DEFAULT 20,
  p_offset          INTEGER DEFAULT 0
) RETURNS TABLE (
  id          INTEGER,
  sku         VARCHAR,
  name_th     VARCHAR,
  brand       VARCHAR,
  price       DECIMAL,
  in_stock    BOOLEAN,
  relevance   REAL
) AS $$
DECLARE
  expanded_query TEXT;
  ts_query       tsquery;
BEGIN
  -- expand query ด้วย synonyms
  expanded_query := expand_query_with_synonyms(p_query);
  
  -- สร้าง tsquery จาก expanded query (websearch สำหรับ tolerance สูง)
  BEGIN
    ts_query := websearch_to_tsquery('simple', expanded_query);
  EXCEPTION WHEN OTHERS THEN
    ts_query := plainto_tsquery('simple', expanded_query);
  END;
  
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.sku,
    p.name_th,
    p.brand,
    p.price,
    p.in_stock,
    GREATEST(
      -- FTS score
      ts_rank_cd(p.search_vector, ts_query) * 2.0,
      -- Trigram score (สำคัญสำหรับไทยและ typo)
      similarity(p.searchable_text, lower(p_query)) * 1.5,
      -- Exact substring match (สำคัญสำหรับ part number)
      CASE WHEN p.searchable_text LIKE '%' || lower(p_query) || '%' 
           THEN 1.0 ELSE 0 END
    ) AS relevance
  FROM products p
  LEFT JOIN product_vehicles pv ON pv.product_id = p.id
  WHERE
    -- ต้อง match อย่างน้อย 1 ใน 3
    (
      p.search_vector @@ ts_query
      OR p.searchable_text % lower(p_query)         -- trigram similarity > threshold (0.3 default)
      OR p.searchable_text LIKE '%' || lower(p_query) || '%'
    )
    -- filters
    AND (p_vehicle_id  IS NULL OR pv.vehicle_id = p_vehicle_id)
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_brand       IS NULL OR p.brand ILIKE p_brand)
    AND (p_min_price   IS NULL OR p.price >= p_min_price)
    AND (p_max_price   IS NULL OR p.price <= p_max_price)
  ORDER BY relevance DESC, p.in_stock DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
```

### ทดสอบ function

```sql
-- พิมพ์ผิด + ภาษาผสม
SELECT * FROM smart_search('ผ้าเบก civic');

-- ค้นด้วย part number
SELECT * FROM smart_search('04465-02200');

-- ค้น + filter รุ่นรถ
SELECT * FROM smart_search('ผ้าเบรก', p_vehicle_id := 42);

-- ค้น + filter ราคา
SELECT * FROM smart_search('โช้ค', p_min_price := 1000, p_max_price := 5000);
```

### ปรับ threshold ของ trigram

ค่า default ของ `%` operator คือ similarity 0.3 ถ้าอยากให้เข้มงวดหรือยืดหยุ่นกว่านี้:

```sql
-- ลดลงเพื่อให้ตอบ typo มากขึ้น (อาจมี noise)
SET pg_trgm.similarity_threshold = 0.2;

-- เพิ่มเพื่อให้ตอบเฉพาะที่ใกล้มาก
SET pg_trgm.similarity_threshold = 0.4;
```

---

## 4. Backend API (Node.js + TypeScript)

### 4.1 Setup

```bash
npm install pg express dotenv
npm install -D @types/pg @types/express typescript ts-node
```

### 4.2 Database connection

```typescript
// src/db.ts
import { Pool } from 'pg';
import 'dotenv/config';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});
```

### 4.3 Search service

```typescript
// src/services/search.ts
import { pool } from '../db';

export interface SearchParams {
  query: string;
  vehicleId?: number;
  categoryId?: number;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  sessionId?: string;
}

export interface SearchResult {
  id: number;
  sku: string;
  name_th: string;
  brand: string;
  price: number;
  in_stock: boolean;
  relevance: number;
}

export async function smartSearch(params: SearchParams): Promise<{
  results: SearchResult[];
  total: number;
}> {
  const {
    query,
    vehicleId,
    categoryId,
    brand,
    minPrice,
    maxPrice,
    page = 1,
    pageSize = 20,
    sessionId,
  } = params;

  if (!query || query.trim().length < 2) {
    return { results: [], total: 0 };
  }

  const offset = (page - 1) * pageSize;

  const { rows } = await pool.query<SearchResult>(
    `SELECT * FROM smart_search($1, $2, $3, $4, $5, $6, $7, $8)`,
    [query.trim(), vehicleId, categoryId, brand, minPrice, maxPrice, pageSize, offset]
  );

  // Log การค้นหาแบบ async (ไม่ block response)
  pool.query(
    `INSERT INTO search_logs (query, results_count, session_id, vehicle_filter)
     VALUES ($1, $2, $3, $4)`,
    [query, rows.length, sessionId, vehicleId]
  ).catch((err) => console.error('Search log error:', err));

  return { results: rows, total: rows.length };
}

// Autocomplete suggestion (เร็วกว่า full search)
export async function searchSuggestions(query: string, limit = 5) {
  if (query.length < 2) return [];
  
  const { rows } = await pool.query(
    `SELECT DISTINCT name_th, brand
     FROM products
     WHERE searchable_text % lower($1)
     ORDER BY similarity(searchable_text, lower($1)) DESC
     LIMIT $2`,
    [query, limit]
  );
  return rows;
}
```

### 4.4 API endpoints

```typescript
// src/routes/search.ts
import { Router } from 'express';
import { smartSearch, searchSuggestions } from '../services/search';

const router = Router();

// Search endpoint
router.get('/search', async (req, res) => {
  try {
    const result = await smartSearch({
      query: String(req.query.q || ''),
      vehicleId: req.query.vehicle ? Number(req.query.vehicle) : undefined,
      categoryId: req.query.category ? Number(req.query.category) : undefined,
      brand: req.query.brand ? String(req.query.brand) : undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: 20,
      sessionId: req.headers['x-session-id'] as string | undefined,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Suggestion endpoint (สำหรับ autocomplete)
router.get('/search/suggest', async (req, res) => {
  const suggestions = await searchSuggestions(String(req.query.q || ''));
  res.json({ suggestions });
});

export default router;
```

---

## 5. Frontend Integration (React)

### 5.1 Smart search box ที่มี debounce + autocomplete

```tsx
// src/components/SmartSearchBox.tsx
import { useState, useEffect, useCallback } from 'react';

interface SearchResult {
  id: number;
  sku: string;
  name_th: string;
  brand: string;
  price: number;
}

export function SmartSearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // debounce: รอ 300ms หลังพิมพ์เสร็จค่อย search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [searchRes, suggestRes] = await Promise.all([
          fetch(`/api/search?q=${encodeURIComponent(query)}`),
          fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`),
        ]);
        const searchData = await searchRes.json();
        const suggestData = await suggestRes.json();
        setResults(searchData.results);
        setSuggestions(suggestData.suggestions.map((s: any) => s.name_th));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // highlight คำที่ match ในผลลัพธ์
  const highlight = useCallback((text: string, q: string) => {
    if (!q) return text;
    const words = q.split(/\s+/).filter(Boolean);
    let result = text;
    words.forEach((word) => {
      const regex = new RegExp(`(${word})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });
    return result;
  }, []);

  return (
    <div className="search-container">
      <div className="search-input-wrap">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="ค้นหาอะไหล่ รุ่นรถ หรือ part number..."
          className="search-input"
        />
        {loading && <span className="spinner">⏳</span>}
      </div>

      {showResults && (results.length > 0 || suggestions.length > 0) && (
        <div className="search-dropdown">
          {/* คำแนะนำ */}
          {suggestions.length > 0 && (
            <div className="suggestion-group">
              <div className="group-label">คำแนะนำ</div>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onMouseDown={() => setQuery(s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* สินค้าที่ตรง */}
          {results.length > 0 && (
            <div className="result-group">
              <div className="group-label">สินค้า · {results.length} รายการ</div>
              {results.slice(0, 6).map((r) => (
                <a key={r.id} href={`/product/${r.id}`} className="result-item">
                  <span
                    className="result-name"
                    dangerouslySetInnerHTML={{
                      __html: highlight(r.name_th, query),
                    }}
                  />
                  <span className="result-brand">{r.brand}</span>
                  <span className="result-price">฿{r.price.toLocaleString()}</span>
                </a>
              ))}
              {results.length > 6 && (
                <a href={`/search?q=${encodeURIComponent(query)}`} className="see-more">
                  ดูทั้งหมด {results.length} รายการ →
                </a>
              )}
            </div>
          )}

          {/* zero result */}
          {results.length === 0 && !loading && query.length >= 2 && (
            <div className="no-results">
              ไม่พบสินค้าที่ตรงกับ "<strong>{query}</strong>"
              <br />
              <a href={`/contact?q=${encodeURIComponent(query)}`}>
                สอบถามทาง Line OA →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 5.2 CSS พื้นฐาน

```css
.search-container { position: relative; max-width: 600px; }
.search-input-wrap { position: relative; }
.search-input {
  width: 100%; padding: 12px 40px 12px 16px;
  border: 1px solid #ddd; border-radius: 8px; font-size: 15px;
}
.spinner { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); }
.search-dropdown {
  position: absolute; top: 100%; left: 0; right: 0;
  background: white; border: 1px solid #ddd; border-radius: 8px;
  margin-top: 4px; max-height: 400px; overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.group-label {
  font-size: 11px; text-transform: uppercase;
  color: #888; padding: 8px 12px; letter-spacing: 0.05em;
}
.suggestion-item, .result-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; cursor: pointer; text-decoration: none; color: inherit;
}
.suggestion-item:hover, .result-item:hover { background: #f5f5f5; }
.result-name { flex: 1; font-size: 14px; }
.result-brand { font-size: 12px; color: #888; }
.result-price { font-weight: 500; font-size: 14px; }
mark { background: #FAEEDA; padding: 1px 2px; border-radius: 2px; }
.no-results { padding: 16px; text-align: center; color: #666; }
.see-more { display: block; padding: 10px; text-align: center; color: #185FA5; }
```

---

## 6. Analytics: Zero-result Tracking

นี่คือสิ่งที่ underrated ที่สุด — ทุกครั้งที่ลูกค้าค้นแล้วไม่เจอ คือสัญญาณว่าควรเพิ่มอะไรใน catalog หรือ dictionary

### 6.1 Query หาคำที่ลูกค้าค้นบ่อยแต่ไม่เจอ

```sql
-- top 50 queries ที่ลูกค้าค้นแล้วไม่เจอ ใน 30 วันที่ผ่านมา
SELECT 
  lower(query) AS normalized_query,
  COUNT(*) AS search_count
FROM search_logs
WHERE 
  results_count = 0
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY lower(query)
HAVING COUNT(*) >= 3
ORDER BY search_count DESC
LIMIT 50;
```

### 6.2 Workflow แนะนำ

ทุกสัปดาห์รัน query นี้ แล้วแก้แบบนี้:
- **ถ้าเป็นคำเล่น/synonym** → เพิ่มลงใน `search_synonyms`
- **ถ้าเป็นสินค้าที่ยังไม่มี** → ส่งให้ทีม catalog เพิ่ม
- **ถ้าเป็น typo บ่อยมาก** → ลด `pg_trgm.similarity_threshold`

### 6.3 Top queries ที่มีผลลัพธ์ (สำหรับ trending)

```sql
SELECT lower(query), COUNT(*)
FROM search_logs
WHERE results_count > 0 AND created_at > NOW() - INTERVAL '7 days'
GROUP BY lower(query)
ORDER BY COUNT(*) DESC
LIMIT 20;
```

---

## 7. Thai Tokenization (เพิ่มเติม)

PostgreSQL default ไม่เข้าใจการตัดคำไทย ถ้าต้องการประสิทธิภาพดีขึ้นสำหรับไทย มี 2 ทาง

### ทางเลือก A: ใช้ trigram อย่างเดียว (recommended สำหรับ MVP)

ภาษาไทยไม่มีช่องว่างระหว่างคำ แต่ pg_trgm ทำงานในระดับ character ไม่ใช่ word — จึงทำงานกับไทยได้โดยธรรมชาติ **ไม่ต้องตัดคำเลย** สำหรับ MVP เพียงพอแล้ว

### ทางเลือก B: pre-tokenize ด้วย PyThaiNLP (ถ้าต้องการคุณภาพสูงขึ้น)

ใช้ Python script ตัดคำไทยก่อน insert แล้วเก็บผลลัพธ์ในช่อง `name_th_tokenized`

```python
# pip install pythainlp
from pythainlp.tokenize import word_tokenize

text = "ผ้าเบรกหน้าซีวิค"
tokens = word_tokenize(text, engine='newmm')
# ['ผ้า', 'เบรก', 'หน้า', 'ซีวิค']
tokenized = ' '.join(tokens)
# 'ผ้า เบรก หน้า ซีวิค'
```

แล้วเก็บ `tokenized` ลง column ใหม่ แล้ว FTS จะทำงานดีขึ้น แต่ trade-off คือต้องมี ETL pipeline แยก

**สรุป:** เริ่มจากทางเลือก A ก่อน ถ้า quality ไม่พอค่อยขยับไปทางเลือก B

---

## 8. Checklist ก่อน Production

- [ ] รัน `EXPLAIN ANALYZE` กับ query หลักให้ทุก search ต่ำกว่า 100ms
- [ ] เพิ่ม connection pool limit ตาม load
- [ ] Setup `pg_stat_statements` เพื่อ monitor slow queries
- [ ] Backup ตาราง `search_logs` ก่อน purge เก่า (เก็บ 90 วันพอ)
- [ ] Rate limit `/api/search` (เช่น 60 req/min ต่อ IP) เพื่อกัน abuse
- [ ] เพิ่ม cache layer (Redis) สำหรับ top queries ถ้า traffic สูง
- [ ] เก็บ session_id แบบ anonymous เพื่อ track funnel ลูกค้า

---

## 9. เมื่อไหร่ควรย้ายไป Meilisearch / Algolia

สัญญาณว่า PostgreSQL FTS ไม่พอแล้ว:
1. Query latency เริ่มเกิน 300ms แม้มี index ครบ
2. Catalog เกิน 200,000 SKU
3. ต้องการ feature ที่ทำเองยาก เช่น geo-search, multi-language scoring
4. ทีมไม่อยาก maintain SQL function แล้ว

ตอนนั้นย้ายไป **Meilisearch self-hosted บน VPS** จะคุ้มที่สุด เพราะ migration ใช้แค่ sync ข้อมูลจาก Postgres ไป index ของ Meilisearch โดย logic การ filter ฝั่ง API ส่วนใหญ่เปลี่ยนแค่ที่ส่วน query

---

## Common Pitfalls

**1. ลืม `simple` แล้วใช้ `english`**
ผลลัพธ์: ภาษาไทยทำงานเพี้ยน คำว่า "running" จะ stem เป็น "run" ทำให้ search "running shoes" หาไม่เจอสินค้า "run-flat"

**2. ไม่ใช้ trigger update search_vector**
ผลลัพธ์: insert สินค้าใหม่แล้ว search หาไม่เจอ ต้อง manual update

**3. forget GIN index**
ผลลัพธ์: query ช้ามาก (full table scan) ใช้ `EXPLAIN` ตรวจสอบ

**4. trigram threshold ต่ำเกิน**
ผลลัพธ์: ผลลัพธ์ noise เยอะ — เริ่มที่ 0.3 ค่อยปรับ

**5. ไม่ log queries**
ผลลัพธ์: ไม่รู้ว่าลูกค้าค้นอะไร ปรับปรุงไม่ได้ — `search_logs` คือ asset ระยะยาว

---

## Reference

- PostgreSQL Full Text Search: https://www.postgresql.org/docs/current/textsearch.html
- pg_trgm extension: https://www.postgresql.org/docs/current/pgtrgm.html
- PyThaiNLP: https://pythainlp.github.io/

---

**ถ้ามีคำถามเรื่อง implementation ส่วนไหน หรืออยากให้อธิบาย code ตรงไหน ส่งมาถามได้เลย**
