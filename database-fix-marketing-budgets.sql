-- COPCCA CRM - Fix marketing_budgets table structure
-- Run this if you have the old marketing_budgets table structure

-- Drop old table and recreate with correct structure
DROP TABLE IF EXISTS marketing_budgets CASCADE;

CREATE TABLE IF NOT EXISTS marketing_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel TEXT NOT NULL,
  monthly_budget DECIMAL NOT NULL DEFAULT 0,
  target_leads INTEGER NOT NULL DEFAULT 0,
  target_roi DECIMAL NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_budgets_created_by ON marketing_budgets(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_budgets_company ON marketing_budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_marketing_budgets_channel ON marketing_budgets(channel);

-- Enable RLS
ALTER TABLE marketing_budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policy that works with or without company_id
DROP POLICY IF EXISTS "Authenticated users can access marketing_budgets" ON marketing_budgets;
CREATE POLICY "Authenticated users can access marketing_budgets" ON marketing_budgets FOR ALL USING (
  auth.uid() = created_by OR
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ) OR
  company_id IS NULL
);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_marketing_budgets_updated_at ON marketing_budgets;
CREATE TRIGGER update_marketing_budgets_updated_at
  BEFORE UPDATE ON marketing_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
