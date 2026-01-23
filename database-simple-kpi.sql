-- COPCCA CRM - Simple KPI Tables Migration
-- Run this AFTER running database-minimal-setup.sql or database-setup.sql

-- Create KPI tables
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  uptime DECIMAL DEFAULT 99.9,
  efficiency DECIMAL DEFAULT 85.0,
  automation_coverage DECIMAL DEFAULT 75.0,
  response_time DECIMAL DEFAULT 2.5,
  error_rate DECIMAL DEFAULT 0.1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create debt_collection table (handle existing table that might not have customer_id)
DO $$
BEGIN
  -- Check if debt_collection table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'debt_collection') THEN
    -- Create new table with all columns
    CREATE TABLE debt_collection (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      amount DECIMAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'paid', 'partial', 'written_off')),
      due_date DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Table exists, check if customer_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debt_collection' AND column_name = 'customer_id') THEN
      -- Add customer_id column if it doesn't exist
      ALTER TABLE debt_collection ADD COLUMN customer_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS after_sales_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_strategies (
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

-- Insert sample data
INSERT INTO system_metrics (company_id, uptime, efficiency, automation_coverage, response_time, error_rate)
SELECT (SELECT id FROM companies WHERE name = 'Sample Company' LIMIT 1), 99.7, 87.0, 73.0, 2.3, 0.05
WHERE NOT EXISTS (SELECT 1 FROM system_metrics LIMIT 1);

INSERT INTO debt_collection (company_id, customer_id, amount, status, due_date)
SELECT
  (SELECT id FROM companies WHERE name = 'Sample Company' LIMIT 1),
  (SELECT id FROM companies WHERE name = 'Sample Company' LIMIT 1),
  50000, 'paid', '2026-01-15'
WHERE NOT EXISTS (SELECT 1 FROM debt_collection LIMIT 1);

INSERT INTO after_sales_tasks (company_id, customer_id, title, status, priority)
SELECT
  (SELECT id FROM companies WHERE name = 'Sample Company' LIMIT 1),
  (SELECT id FROM companies WHERE name = 'Sample Company' LIMIT 1),
  'Customer feedback analysis', 'done', 'high'
WHERE NOT EXISTS (SELECT 1 FROM after_sales_tasks LIMIT 1);

INSERT INTO sales_strategies (company_id, name, status, strategy_type, leads_generated, conversions, roi)
SELECT
  (SELECT id FROM companies WHERE name = 'Sample Company' LIMIT 1),
  'Q1 Digital Campaign', 'active', 'campaign', 125, 15, 320
WHERE NOT EXISTS (SELECT 1 FROM sales_strategies LIMIT 1);