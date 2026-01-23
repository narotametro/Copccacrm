-- COPCCA CRM - Safe Migration for KPI Tables
-- This migration safely creates missing tables and adds sample data

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create base tables without foreign keys first to avoid dependency issues
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
  created_by UUID -- Will add foreign key constraint later
);

-- Now create KPI tables with proper foreign keys
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  uptime DECIMAL DEFAULT 99.9,
  efficiency DECIMAL DEFAULT 85.0,
  automation_coverage DECIMAL DEFAULT 75.0,
  response_time DECIMAL DEFAULT 2.5,
  error_rate DECIMAL DEFAULT 0.1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create debt_collection table if it doesn't exist (with updated schema if needed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'debt_collection') THEN
    CREATE TABLE debt_collection (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      amount DECIMAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'paid', 'partial', 'written_off')),
      due_date DATE NOT NULL,
      collection_date DATE,
      assigned_to UUID REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- Create after_sales_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS after_sales_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales_strategies table if it doesn't exist
CREATE TABLE IF NOT EXISTS sales_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  strategy_type TEXT CHECK (strategy_type IN ('campaign', 'promotion', 'partnership', 'other')),
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  budget DECIMAL DEFAULT 0,
  roi DECIMAL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints that might have been skipped
DO $$
BEGIN
  -- Add foreign key to companies.created_by if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'companies_created_by_fkey'
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT companies_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore if constraint already exists or can't be added
  NULL;
END $$;

-- Add indexes (these are safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_system_metrics_company_id ON system_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_debt_collection_company_id ON debt_collection(company_id);
CREATE INDEX IF NOT EXISTS idx_debt_collection_status ON debt_collection(status);
CREATE INDEX IF NOT EXISTS idx_debt_collection_due_date ON debt_collection(due_date);
CREATE INDEX IF NOT EXISTS idx_after_sales_tasks_company_id ON after_sales_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_after_sales_tasks_status ON after_sales_tasks(status);
CREATE INDEX IF NOT EXISTS idx_after_sales_tasks_priority ON after_sales_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_sales_strategies_company_id ON sales_strategies(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_strategies_status ON sales_strategies(status);

-- Enable RLS (safe to run multiple times)
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_strategies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view system metrics from their companies" ON system_metrics;
DROP POLICY IF EXISTS "Users can manage system metrics for their companies" ON system_metrics;
DROP POLICY IF EXISTS "Users can view debt collection from their companies" ON debt_collection;
DROP POLICY IF EXISTS "Users can manage debt collection for their companies" ON debt_collection;
DROP POLICY IF EXISTS "Users can view after sales tasks from their companies" ON after_sales_tasks;
DROP POLICY IF EXISTS "Users can manage after sales tasks for their companies" ON after_sales_tasks;
DROP POLICY IF EXISTS "Users can view sales strategies from their companies" ON sales_strategies;
DROP POLICY IF EXISTS "Users can manage sales strategies for their companies" ON sales_strategies;

-- Recreate RLS Policies
CREATE POLICY "Users can view system metrics from their companies" ON system_metrics
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage system metrics for their companies" ON system_metrics
  FOR ALL USING (
    company_id IN (
      SELECT id FROM companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view debt collection from their companies" ON debt_collection
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage debt collection for their companies" ON debt_collection
  FOR ALL USING (
    company_id IN (
      SELECT id FROM companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view after sales tasks from their companies" ON after_sales_tasks
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage after sales tasks for their companies" ON after_sales_tasks
  FOR ALL USING (
    company_id IN (
      SELECT id FROM companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view sales strategies from their companies" ON sales_strategies
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage sales strategies for their companies" ON sales_strategies
  FOR ALL USING (
    company_id IN (
      SELECT id FROM companies WHERE created_by = auth.uid()
    )
  );

-- Insert sample data only if tables are empty
DO $$
DECLARE
    sample_company_id UUID;
BEGIN
    -- Insert sample company if none exist
    IF NOT EXISTS (SELECT 1 FROM companies LIMIT 1) THEN
        INSERT INTO companies (name, industry, size, website, email, status, health_score) 
        VALUES ('Sample Company', 'Technology', '11-50', 'https://sample.com', 'contact@sample.com', 'active', 85)
        RETURNING id INTO sample_company_id;
    ELSE
        SELECT id INTO sample_company_id FROM companies LIMIT 1;
    END IF;

    -- Insert sample system metrics if none exist
    IF NOT EXISTS (SELECT 1 FROM system_metrics LIMIT 1) THEN
        INSERT INTO system_metrics (company_id, uptime, efficiency, automation_coverage, response_time, error_rate)
        VALUES (sample_company_id, 99.7, 87.0, 73.0, 2.3, 0.05);
    END IF;

    -- Insert sample debt collection data if none exist
    IF NOT EXISTS (SELECT 1 FROM debt_collection LIMIT 1) THEN
        INSERT INTO debt_collection (company_id, customer_id, amount, status, due_date)
        VALUES 
        (sample_company_id, sample_company_id, 50000, 'paid', '2026-01-15'),
        (sample_company_id, sample_company_id, 25000, 'pending', '2026-02-01');
    END IF;

    -- Insert sample after sales tasks if none exist
    IF NOT EXISTS (SELECT 1 FROM after_sales_tasks LIMIT 1) THEN
        INSERT INTO after_sales_tasks (company_id, customer_id, title, status, priority)
        VALUES 
        (sample_company_id, sample_company_id, 'Customer feedback analysis', 'done', 'high'),
        (sample_company_id, sample_company_id, 'Support ticket resolution', 'in_progress', 'medium'),
        (sample_company_id, sample_company_id, 'Product training session', 'pending', 'low');
    END IF;

    -- Insert sample sales strategies if none exist
    IF NOT EXISTS (SELECT 1 FROM sales_strategies LIMIT 1) THEN
        INSERT INTO sales_strategies (company_id, name, status, strategy_type, leads_generated, conversions, roi)
        VALUES 
        (sample_company_id, 'Q1 Digital Campaign', 'active', 'campaign', 125, 15, 320),
        (sample_company_id, 'Email Marketing Push', 'completed', 'campaign', 89, 12, 280);
    END IF;
END $$;