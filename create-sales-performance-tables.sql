-- =====================================================
-- CREATE SALES PERFORMANCE TABLES
-- Run this in Supabase SQL Editor to fix Sales page errors
-- =====================================================

-- Create sales_reps table
CREATE TABLE IF NOT EXISTS sales_reps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  deals_won INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  conversion_rate DECIMAL DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  target DECIMAL DEFAULT 0,
  avg_deal_size DECIMAL DEFAULT 0,
  avg_cycle_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create win_reasons table
CREATE TABLE IF NOT EXISTS win_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  percentage DECIMAL DEFAULT 0,
  ai_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loss_reasons table
CREATE TABLE IF NOT EXISTS loss_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  percentage DECIMAL DEFAULT 0,
  ai_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE loss_reasons ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (allow all operations for authenticated users within their company)
CREATE POLICY "Users can view sales reps from their company" ON sales_reps
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sales reps to their company" ON sales_reps
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update sales reps in their company" ON sales_reps
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sales reps in their company" ON sales_reps
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Win reasons policies
CREATE POLICY "Users can view win reasons from their company" ON win_reasons
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert win reasons to their company" ON win_reasons
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update win reasons in their company" ON win_reasons
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete win reasons in their company" ON win_reasons
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Loss reasons policies
CREATE POLICY "Users can view loss reasons from their company" ON loss_reasons
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert loss reasons to their company" ON loss_reasons
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update loss reasons in their company" ON loss_reasons
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete loss reasons in their company" ON loss_reasons
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_sales_reps_updated_at ON sales_reps;
CREATE TRIGGER update_sales_reps_updated_at 
  BEFORE UPDATE ON sales_reps 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_win_reasons_updated_at ON win_reasons;
CREATE TRIGGER update_win_reasons_updated_at 
  BEFORE UPDATE ON win_reasons 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loss_reasons_updated_at ON loss_reasons;
CREATE TRIGGER update_loss_reasons_updated_at 
  BEFORE UPDATE ON loss_reasons 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('sales_reps', 'win_reasons', 'loss_reasons')
ORDER BY table_name;
