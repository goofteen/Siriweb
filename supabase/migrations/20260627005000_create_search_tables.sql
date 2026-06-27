-- ตาราง search_synonyms และ search_logs

-- Synonym dictionary สำหรับ expand query
-- canonical = คำหลัก, synonyms = คำอื่นๆ ที่ลูกค้าใช้
CREATE TABLE search_synonyms (
  id         SERIAL  PRIMARY KEY,
  canonical  VARCHAR(100) NOT NULL,
  synonyms   TEXT[]       NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_synonyms_canonical ON search_synonyms(canonical);

-- Search logs สำหรับ analytics และ zero-result tracking
-- ดู docs/07-SMART-SEARCH-GUIDE.md section 6
CREATE TABLE search_logs (
  id             SERIAL  PRIMARY KEY,
  query          TEXT    NOT NULL,
  results_count  INTEGER NOT NULL,
  session_id     VARCHAR(100),
  vehicle_filter INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Index สำหรับ zero-result analysis (query รายสัปดาห์)
CREATE INDEX idx_search_logs_zero    ON search_logs(created_at) WHERE results_count = 0;
CREATE INDEX idx_search_logs_created ON search_logs(created_at DESC);
