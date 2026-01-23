-- COPCCA CRM - KPI Database Only
-- Minimal schema for KPI tracking functionality

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables to start clean
DROP TABLE IF EXISTS sales_strategies CASCADE;
DROP TABLE IF EXISTS after_sales_tasks CASCADE;
DROP TABLE IF EXISTS debt_collection CASCADE;
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Core tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- KPI tables
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  uptime DECIMAL DEFAULT 99.9,
  efficiency DECIMAL DEFAULT 85.0,
  automation_coverage DECIMAL DEFAULT 75.0,
  response_time DECIMAL DEFAULT 2.5,
  error_rate DECIMAL DEFAULT 0.1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE debt_collection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'paid', 'partial', 'written_off')),
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE after_sales_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  strategy_type TEXT CHECK (strategy_type IN ('campaign', 'promotion', 'partnership', 'other')),
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  roi DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_system_metrics_company_id ON system_metrics(company_id);
CREATE INDEX idx_debt_collection_company_id ON debt_collection(company_id);
CREATE INDEX idx_debt_collection_status ON debt_collection(status);
CREATE INDEX idx_after_sales_tasks_company_id ON after_sales_tasks(company_id);
CREATE INDEX idx_after_sales_tasks_status ON after_sales_tasks(status);
CREATE INDEX idx_sales_strategies_company_id ON sales_strategies(company_id);

-- Basic RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_strategies ENABLE ROW LEVEL SECURITY;

-- Simple policies (adjust for your auth system)
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON companies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON system_metrics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON debt_collection FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON after_sales_tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON sales_strategies FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO users (email, full_name, role) VALUES
('admin@copcca.com', 'System Administrator', 'admin');

INSERT INTO companies (name, industry, status, created_by) VALUES
('Sample Company', 'Technology', 'active', (SELECT id FROM users LIMIT 1));

-- Sample KPI data
INSERT INTO system_metrics (company_id, uptime, efficiency, automation_coverage, response_time, error_rate) VALUES
((SELECT id FROM companies LIMIT 1), 99.7, 87.0, 73.0, 2.3, 0.05);

INSERT INTO debt_collection (company_id, amount, status, due_date) VALUES
((SELECT id FROM companies LIMIT 1), 50000, 'paid', '2026-01-15'),
((SELECT id FROM companies LIMIT 1), 25000, 'pending', '2026-02-01');

INSERT INTO after_sales_tasks (company_id, title, status, priority) VALUES
((SELECT id FROM companies LIMIT 1), 'Customer feedback analysis', 'done', 'high'),
((SELECT id FROM companies LIMIT 1), 'Support ticket resolution', 'in_progress', 'medium'),
((SELECT id FROM companies LIMIT 1), 'Product training session', 'pending', 'low');

INSERT INTO sales_strategies (company_id, name, status, strategy_type, leads_generated, conversions, roi) VALUES
((SELECT id FROM companies LIMIT 1), 'Q1 Digital Campaign', 'active', 'campaign', 125, 15, 320),
((SELECT id FROM companies LIMIT 1), 'Email Marketing Push', 'completed', 'campaign', 89, 12, 280);