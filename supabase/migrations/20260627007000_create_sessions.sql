-- ตาราง sessions, garage, wishlist, inquiries
-- Phase 1: ทุกอย่างทำงานแบบ guest ผ่าน session_id (ไม่ต้อง login)

-- Session tracking สำหรับ guest user
CREATE TABLE sessions (
  id          VARCHAR(100) PRIMARY KEY,
  data        JSONB        DEFAULT '{}',
  expires_at  TIMESTAMP    NOT NULL,
  created_at  TIMESTAMP    DEFAULT NOW(),
  updated_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Garage — รถที่ลูกค้าเพิ่ม (เก็บ 30 วัน)
CREATE TABLE user_vehicles (
  id            SERIAL  PRIMARY KEY,
  session_id    VARCHAR(100) NOT NULL,
  vehicle_id    INTEGER REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  nickname      VARCHAR(100),    -- ลูกค้าตั้งชื่อเอง เช่น "ซีวิคแดง"
  license_plate VARCHAR(20),
  is_primary    BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_vehicles_session ON user_vehicles(session_id);
CREATE INDEX idx_user_vehicles_vehicle ON user_vehicles(vehicle_id);

-- Wishlist — สินค้าที่ลูกค้า save ไว้ (แทน cart ใน Phase 1)
CREATE TABLE wishlist_items (
  id          SERIAL  PRIMARY KEY,
  session_id  VARCHAR(100) NOT NULL,
  product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  note        TEXT,            -- ลูกค้าใส่ note เช่น "สำหรับรถลูก"
  added_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, product_id)
);

CREATE INDEX idx_wishlist_session ON wishlist_items(session_id);

-- Inquiry form — ลูกค้าติดต่อร้าน
CREATE TABLE inquiries (
  id              SERIAL PRIMARY KEY,
  session_id      VARCHAR(100),

  -- ข้อมูลลูกค้า
  customer_name   VARCHAR(255) NOT NULL,
  contact_phone   VARCHAR(20),
  contact_line    VARCHAR(100),    -- Line ID
  contact_email   VARCHAR(255),

  -- บริบท
  vehicle_id      INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  message         TEXT NOT NULL,

  -- สินค้าที่สนใจ (optional, หลายชิ้นได้)
  product_ids     INTEGER[],

  -- status สำหรับ admin
  status          VARCHAR(20) DEFAULT 'new',  -- new | contacted | closed
  admin_notes     TEXT,

  -- metadata
  source          VARCHAR(50),    -- product_page | search | contact_form
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_contact CHECK (
    contact_phone IS NOT NULL OR
    contact_line  IS NOT NULL OR
    contact_email IS NOT NULL
  )
);

CREATE INDEX idx_inquiries_status  ON inquiries(status);
CREATE INDEX idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX idx_inquiries_session ON inquiries(session_id);
