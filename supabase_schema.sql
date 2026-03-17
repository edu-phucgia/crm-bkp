-- ============================================================
-- PGL CRM — Complete Supabase Schema
-- Chạy toàn bộ file này trong Supabase SQL Editor
-- Các bảng được tạo đúng tên cột khớp với code TypeScript
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP tất cả bảng cũ (xóa sạch để tạo lại đúng cấu trúc)
-- CASCADE tự xóa các FK phụ thuộc
-- ============================================================
DROP TABLE IF EXISTS quotation_items  CASCADE;
DROP TABLE IF EXISTS quotations       CASCADE;
DROP TABLE IF EXISTS contracts        CASCADE;
DROP TABLE IF EXISTS activities       CASCADE;
DROP TABLE IF EXISTS tasks            CASCADE;
DROP TABLE IF EXISTS orders           CASCADE;
DROP TABLE IF EXISTS zalo_groups      CASCADE;
DROP TABLE IF EXISTS deals            CASCADE;
DROP TABLE IF EXISTS customers        CASCADE;
DROP TABLE IF EXISTS users            CASCADE;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           text UNIQUE NOT NULL,
  full_name       text NOT NULL,
  role            text NOT NULL DEFAULT 'sales'
                    CHECK (role IN ('admin', 'sales', 'tech', 'manager')),
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive')),
  is_active       boolean NOT NULL DEFAULT true,
  target_monthly  numeric(18,0) DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name  text NOT NULL,
  short_name    text,
  industry      text,
  source        text,
  tier          text NOT NULL DEFAULT 'standard'
                  CHECK (tier IN ('standard', 'silver', 'gold', 'vip')),
  status        text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'blacklist')),
  -- assigned_to stores email (text), not UUID — intentional design
  assigned_to   text REFERENCES users(email) ON UPDATE CASCADE ON DELETE SET NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. DEALS
-- ============================================================
CREATE TABLE deals (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                text NOT NULL,
  value                numeric(18,0) NOT NULL DEFAULT 0,
  stage                text NOT NULL DEFAULT 'lead'
                         CHECK (stage IN ('lead','tu_van','gui_bao_gia','dam_phan',
                                          'chot_hd','dang_tn','hoan_thanh','lost')),
  product_type         text NOT NULL DEFAULT 'khac'
                         CHECK (product_type IN ('ict','qcvn_4','pin_hsnl',
                                                  'qcvn_9','qcvn_19','khac')),
  expected_close_date  date,
  customer_id          uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  owner_id             uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- FK name khớp với code: users!deals_owner_id_fkey
ALTER TABLE deals
  DROP CONSTRAINT IF EXISTS deals_owner_id_fkey;
ALTER TABLE deals
  ADD CONSTRAINT deals_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- 4. ACTIVITIES
-- ============================================================
CREATE TABLE activities (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type                    text NOT NULL
                            CHECK (type IN ('zalo','call','email','meeting','note',
                                            'payment','stage_change','sla_violation')),
  content                 text NOT NULL,
  -- activity_date: dùng cho customer timeline (useCustomers.ts)
  activity_date           timestamptz NOT NULL DEFAULT now(),
  -- activity_at: dùng cho SLA monitoring (useSLAData.ts)
  activity_at             timestamptz NOT NULL DEFAULT now(),
  customer_id             uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name           text,
  deal_id                 uuid REFERENCES deals(id) ON DELETE SET NULL,
  -- user_id: dùng cho join user:users(id, full_name) trong useSLAData
  user_id                 uuid REFERENCES users(id) ON DELETE SET NULL,
  response_time_minutes   integer,
  is_sla_violation        boolean NOT NULL DEFAULT false,
  performed_by            text,
  order_code              text
);

-- ============================================================
-- 5. TASKS
-- ============================================================
CREATE TABLE tasks (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        text NOT NULL,
  description  text,
  status       text NOT NULL DEFAULT 'todo'
                 CHECK (status IN ('todo','in_progress','done','overdue')),
  priority     text NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low','medium','high','urgent')),
  due_date     timestamptz,
  -- assigned_to: UUID FK → users.id (join: assignee:users!assigned_to)
  assigned_to  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. ORDERS
-- ============================================================
CREATE TABLE orders (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code         text,
  customer_id        uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  total_value        numeric(18,0) NOT NULL DEFAULT 0,
  payment_status     text NOT NULL DEFAULT 'unpaid'
                       CHECK (payment_status IN ('unpaid','partial_50',
                                                  'paid_full','overdue')),
  current_step       integer NOT NULL DEFAULT 0,
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('completed','pending','cancelled')),
  assigned_sales_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_by_user   text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. ZALO_GROUPS
-- ============================================================
CREATE TABLE zalo_groups (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  group_name   text,
  status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','silent_30','silent_90','silent_180')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. QUOTATIONS
-- ============================================================
CREATE TABLE quotations (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_code   text,
  customer_id      uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  total_value      numeric(18,0) NOT NULL DEFAULT 0,
  status           text DEFAULT 'draft',
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. QUOTATION_ITEMS
-- ============================================================
CREATE TABLE quotation_items (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id    uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_name    text NOT NULL,
  quantity        integer NOT NULL DEFAULT 1,
  unit_price      numeric(18,0) NOT NULL DEFAULT 0,
  total_price     numeric(18,0) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. CONTRACTS
-- ============================================================
CREATE TABLE contracts (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_code    text,
  customer_id      uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  total_value      numeric(18,0) NOT NULL DEFAULT 0,
  payment_status   text NOT NULL DEFAULT 'unpaid'
                     CHECK (payment_status IN ('unpaid','partial_50',
                                                'paid_full','overdue')),
  signed_at        timestamptz,
  end_date         date NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_deals_updated_at ON deals;
CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES — tối ưu query phổ biến
-- ============================================================
CREATE INDEX idx_customers_assigned_to  ON customers(assigned_to);
CREATE INDEX idx_customers_status       ON customers(status);
CREATE INDEX idx_customers_tier         ON customers(tier);

CREATE INDEX idx_deals_stage            ON deals(stage);
CREATE INDEX idx_deals_owner_id         ON deals(owner_id);
CREATE INDEX idx_deals_customer_id      ON deals(customer_id);
CREATE INDEX idx_deals_created_at       ON deals(created_at DESC);

CREATE INDEX idx_activities_customer_id  ON activities(customer_id);
CREATE INDEX idx_activities_activity_at  ON activities(activity_at DESC);
CREATE INDEX idx_activities_activity_date ON activities(activity_date DESC);
CREATE INDEX idx_activities_type         ON activities(type);
CREATE INDEX idx_activities_sla          ON activities(is_sla_violation);

CREATE INDEX idx_tasks_assigned_to      ON tasks(assigned_to);
CREATE INDEX idx_tasks_status           ON tasks(status);
CREATE INDEX idx_tasks_due_date         ON tasks(due_date);

CREATE INDEX idx_orders_customer_id     ON orders(customer_id);
CREATE INDEX idx_orders_status          ON orders(status);
CREATE INDEX idx_orders_sales_id        ON orders(assigned_sales_id);
CREATE INDEX idx_orders_created_at      ON orders(created_at DESC);

CREATE INDEX idx_contracts_customer_id  ON contracts(customer_id);
CREATE INDEX idx_contracts_end_date     ON contracts(end_date);

CREATE INDEX idx_zalo_groups_customer   ON zalo_groups(customer_id);
CREATE INDEX idx_zalo_groups_status     ON zalo_groups(status);

-- ============================================================
-- ENABLE REALTIME (cho SLA monitoring)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE activities;

-- ============================================================
-- DISABLE RLS (Dev mode — service_role key bypass anyway)
-- Bật lại khi chuyển sang production với auth thật
-- ============================================================
ALTER TABLE users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers       DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals           DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities      DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders          DISABLE ROW LEVEL SECURITY;
ALTER TABLE zalo_groups     DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotations      DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE contracts       DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEED DATA MẪU (xóa phần này nếu đã có data)
-- ============================================================

-- Nhân viên mẫu
INSERT INTO users (id, email, full_name, role, status, is_active, target_monthly) VALUES
  ('11111111-1111-1111-1111-111111111111', 'hieu@pgl.vn',  'Lưu Đức Hiếu',          'admin',   'active', true, 500000000),
  ('22222222-2222-2222-2222-222222222222', 'tien@pgl.vn',  'Lê Mạnh Tiến',           'sales',   'active', true, 300000000),
  ('33333333-3333-3333-3333-333333333333', 'thao@pgl.vn',  'Đường Nguyễn Thanh Thảo','sales',   'active', true, 300000000),
  ('44444444-4444-4444-4444-444444444444', 'hung@pgl.vn',  'Bùi Phương Mai',          'manager', 'active', true, 400000000)
ON CONFLICT (id) DO NOTHING;

-- Khách hàng mẫu
INSERT INTO customers (id, company_name, short_name, industry, source, tier, status, assigned_to) VALUES
  ('aaaa0001-0000-0000-0000-000000000001', 'Công ty CP Điện Gia Khang',   'Gia Khang',  'Điện tử',     'Referral', 'gold',     'active', 'hieu@pgl.vn'),
  ('aaaa0002-0000-0000-0000-000000000002', 'Công ty TNHH Sản Xuất ABC',   'ABC',        'Sản xuất',    'Cold Call','silver',   'active', 'tien@pgl.vn'),
  ('aaaa0003-0000-0000-0000-000000000003', 'Tập đoàn Công Nghệ XYZ',      'XYZ Tech',   'Công nghệ',   'Website',  'vip',      'active', 'thao@pgl.vn')
ON CONFLICT (id) DO NOTHING;

-- Deals mẫu
INSERT INTO deals (id, title, value, stage, product_type, expected_close_date, customer_id, owner_id) VALUES
  ('bbbb0001-0000-0000-0000-000000000001', 'Cung cấp thiết bị ICT toà nhà A', 28000000,  'lead',       'ict',     '2026-04-30', 'aaaa0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('bbbb0002-0000-0000-0000-000000000002', 'Kiểm định QCVN 4 lô hàng Q2',    45000000,  'tu_van',     'qcvn_4',  '2026-05-15', 'aaaa0002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222'),
  ('bbbb0003-0000-0000-0000-000000000003', 'Thử nghiệm PIN HSNL dự án B',    27500000,  'gui_bao_gia','pin_hsnl', '2026-04-10', 'aaaa0003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333'),
  ('bbbb0004-0000-0000-0000-000000000004', 'Dự án ICT văn phòng mới',        22000000,  'dam_phan',   'ict',     '2026-03-28', 'aaaa0001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444'),
  ('bbbb0005-0000-0000-0000-000000000005', 'Hợp đồng QCVN 9 năm 2026',       12000000,  'chot_hd',    'qcvn_9',  '2026-03-20', 'aaaa0002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111'),
  ('bbbb0006-0000-0000-0000-000000000006', 'Triển khai hệ thống ICT HN',     15000000,  'dang_tn',    'ict',     '2026-04-01', 'aaaa0003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222'),
  ('bbbb0007-0000-0000-0000-000000000007', 'Bàn giao thiết bị ICT HCM',       8000000,  'hoan_thanh', 'ict',     '2026-03-15', 'aaaa0001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;
