-- COPCCA CRM Database Setup
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'prospect' CHECK (status IN ('active', 'inactive', 'prospect')),
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value DECIMAL NOT NULL,
  stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create after_sales table
CREATE TABLE IF NOT EXISTS after_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  product TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'issue')),
  follow_up_date DATE,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  notes TEXT,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create debt_collection table
CREATE TABLE IF NOT EXISTS debt_collection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reminded', 'overdue', 'paid', 'written_off')),
  days_overdue INTEGER DEFAULT 0,
  last_reminder_date DATE,
  notes TEXT,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  strengths TEXT,
  weaknesses TEXT,
  market_share DECIMAL,
  pricing_strategy TEXT,
  target_customers TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales_strategies table
CREATE TABLE IF NOT EXISTS sales_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('campaign', 'promotion', 'outreach', 'event')),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  budget DECIMAL,
  target_audience TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  roi DECIMAL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create kpi_data table
CREATE TABLE IF NOT EXISTS kpi_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  value DECIMAL NOT NULL,
  target DECIMAL,
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('call', 'email', 'meeting', 'note')),
  subject TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales_reps table
CREATE TABLE IF NOT EXISTS sales_reps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create win_reasons table
CREATE TABLE IF NOT EXISTS win_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loss_reasons table
CREATE TABLE IF NOT EXISTS loss_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create marketing_budgets table
CREATE TABLE IF NOT EXISTS marketing_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  spent DECIMAL DEFAULT 0,
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE loss_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
CREATE POLICY "Authenticated users can read users" ON users FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id OR auth.jwt()->>'role' = 'admin');
DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'admin');
DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (auth.jwt()->>'role' = 'admin');

DROP POLICY IF EXISTS "Authenticated users can read companies" ON companies;
CREATE POLICY "Authenticated users can read companies" ON companies FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON companies;
CREATE POLICY "Authenticated users can insert companies" ON companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can update companies" ON companies;
CREATE POLICY "Authenticated users can update companies" ON companies FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON companies;
CREATE POLICY "Authenticated users can delete companies" ON companies FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can access deals" ON deals;
CREATE POLICY "Authenticated users can access deals" ON deals FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can access after_sales" ON after_sales;
CREATE POLICY "Authenticated users can access after_sales" ON after_sales FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can access debt_collection" ON debt_collection;
CREATE POLICY "Authenticated users can access debt_collection" ON debt_collection FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can access competitors" ON competitors;
CREATE POLICY "Authenticated users can access competitors" ON competitors FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can access sales_strategies" ON sales_strategies;
CREATE POLICY "Authenticated users can access sales_strategies" ON sales_strategies FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can access kpi_data" ON kpi_data;
CREATE POLICY "Authenticated users can access kpi_data" ON kpi_data FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can access interactions" ON interactions;
CREATE POLICY "Authenticated users can access interactions" ON interactions FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can access sales_reps" ON sales_reps;
CREATE POLICY "Authenticated users can access sales_reps" ON sales_reps FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can access win_reasons" ON win_reasons;
CREATE POLICY "Authenticated users can access win_reasons" ON win_reasons FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can access loss_reasons" ON loss_reasons;
CREATE POLICY "Authenticated users can access loss_reasons" ON loss_reasons FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can access marketing_budgets" ON marketing_budgets;
CREATE POLICY "Authenticated users can access marketing_budgets" ON marketing_budgets FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_after_sales_company_id ON after_sales(company_id);
CREATE INDEX IF NOT EXISTS idx_after_sales_status ON after_sales(status);
CREATE INDEX IF NOT EXISTS idx_debt_collection_company_id ON debt_collection(company_id);
CREATE INDEX IF NOT EXISTS idx_debt_collection_status ON debt_collection(status);
CREATE INDEX IF NOT EXISTS idx_debt_collection_due_date ON debt_collection(due_date);
CREATE INDEX IF NOT EXISTS idx_interactions_company_id ON interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_after_sales_updated_at ON after_sales;
CREATE TRIGGER update_after_sales_updated_at BEFORE UPDATE ON after_sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_debt_collection_updated_at ON debt_collection;
CREATE TRIGGER update_debt_collection_updated_at BEFORE UPDATE ON debt_collection FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_competitors_updated_at ON competitors;
CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_sales_strategies_updated_at ON sales_strategies;
CREATE TRIGGER update_sales_strategies_updated_at BEFORE UPDATE ON sales_strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_kpi_data_updated_at ON kpi_data;
CREATE TRIGGER update_kpi_data_updated_at BEFORE UPDATE ON kpi_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_sales_reps_updated_at ON sales_reps;
CREATE TRIGGER update_sales_reps_updated_at BEFORE UPDATE ON sales_reps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_marketing_budgets_updated_at ON marketing_budgets;
CREATE TRIGGER update_marketing_budgets_updated_at BEFORE UPDATE ON marketing_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
