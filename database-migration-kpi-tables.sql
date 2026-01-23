-- COPCCA CRM - Missing Tables for KPI Integration
-- Migration to add tables needed for real KPI data integration

-- Create system_metrics table for operations KPIs
CREATE TABLE system_metrics (
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

-- Create debt_collection table for debt collection KPIs
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

-- Create after_sales_tasks table for customer performance KPIs
CREATE TABLE after_sales_tasks (
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

-- Create sales_strategies table for marketing KPIs
CREATE TABLE sales_strategies (
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

-- Add indexes for performance
CREATE INDEX idx_system_metrics_company_id ON system_metrics(company_id);
CREATE INDEX idx_debt_collection_company_id ON debt_collection(company_id);
CREATE INDEX idx_debt_collection_status ON debt_collection(status);
CREATE INDEX idx_debt_collection_due_date ON debt_collection(due_date);
CREATE INDEX idx_after_sales_tasks_company_id ON after_sales_tasks(company_id);
CREATE INDEX idx_after_sales_tasks_status ON after_sales_tasks(status);
CREATE INDEX idx_after_sales_tasks_priority ON after_sales_tasks(priority);
CREATE INDEX idx_sales_strategies_company_id ON sales_strategies(company_id);
CREATE INDEX idx_sales_strategies_status ON sales_strategies(status);

-- Enable RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_strategies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_metrics
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

-- RLS Policies for debt_collection
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

-- RLS Policies for after_sales_tasks
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

-- RLS Policies for sales_strategies
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

-- Insert some sample data for testing
INSERT INTO system_metrics (company_id, uptime, efficiency, automation_coverage, response_time, error_rate) VALUES
('9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', 99.7, 87.0, 73.0, 2.3, 0.05);

INSERT INTO debt_collection (company_id, customer_id, amount, status, due_date) VALUES
('9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', '9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', 50000, 'paid', '2026-01-15'),
('9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', '9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', 25000, 'pending', '2026-02-01');

INSERT INTO after_sales_tasks (company_id, customer_id, title, status, priority) VALUES
('9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', '9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', 'Customer feedback analysis', 'done', 'high'),
('9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', '9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', 'Support ticket resolution', 'in_progress', 'medium'),
('9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', '9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', 'Product training session', 'pending', 'low');

INSERT INTO sales_strategies (company_id, name, status, strategy_type, leads_generated, conversions, roi) VALUES
('9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', 'Q1 Digital Campaign', 'active', 'campaign', 125, 15, 320),
('9ba8caf2-ef29-4a18-b9bf-a51121ce26a4', 'Email Marketing Push', 'completed', 'campaign', 89, 12, 280);