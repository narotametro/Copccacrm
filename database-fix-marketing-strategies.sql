-- COPCCA CRM - Fix marketing_strategies table structure
-- Run this to fix the 400 error when saving marketing strategies

-- Drop old table and recreate with correct structure matching the code
DROP TABLE IF EXISTS marketing_strategies CASCADE;

CREATE TABLE IF NOT EXISTS marketing_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('4ps', 'growth', 'retention', 'brand', 'competitive', 'content', 'product-launch')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  customer_id UUID,
  created_by UUID,
  company_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_strategies_created_by ON marketing_strategies(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_strategies_company ON marketing_strategies(company_id);
CREATE INDEX IF NOT EXISTS idx_marketing_strategies_customer ON marketing_strategies(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketing_strategies_type ON marketing_strategies(strategy_type);
CREATE INDEX IF NOT EXISTS idx_marketing_strategies_content_gin ON marketing_strategies USING gin(content);

-- Enable RLS
ALTER TABLE marketing_strategies ENABLE ROW LEVEL SECURITY;

-- Create RLS policy that works with or without company_id
DROP POLICY IF EXISTS "Authenticated users can access marketing_strategies" ON marketing_strategies;
CREATE POLICY "Authenticated users can access marketing_strategies" ON marketing_strategies FOR ALL USING (
  auth.uid() = created_by OR
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ) OR
  company_id IS NULL
);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_marketing_strategies_updated_at ON marketing_strategies;
CREATE TRIGGER update_marketing_strategies_updated_at
  BEFORE UPDATE ON marketing_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fix marketing_kpis table structure to match code expectations
DROP TABLE IF EXISTS marketing_kpis CASCADE;

CREATE TABLE IF NOT EXISTS marketing_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  change TEXT NOT NULL DEFAULT '+0%',
  trend TEXT NOT NULL DEFAULT 'up' CHECK (trend IN ('up', 'down')),
  color TEXT NOT NULL DEFAULT 'blue',
  created_by UUID,
  company_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for marketing_kpis
CREATE INDEX IF NOT EXISTS idx_marketing_kpis_created_by ON marketing_kpis(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_kpis_company ON marketing_kpis(company_id);

-- Enable RLS for marketing_kpis
ALTER TABLE marketing_kpis ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for marketing_kpis
DROP POLICY IF EXISTS "Authenticated users can access marketing_kpis" ON marketing_kpis;
CREATE POLICY "Authenticated users can access marketing_kpis" ON marketing_kpis FOR ALL USING (
  auth.uid() = created_by OR
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ) OR
  company_id IS NULL
);

-- Add updated_at trigger for marketing_kpis
DROP TRIGGER IF EXISTS update_marketing_kpis_updated_at ON marketing_kpis;
CREATE TRIGGER update_marketing_kpis_updated_at
  BEFORE UPDATE ON marketing_kpis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Marketing strategies and KPIs tables fixed successfully!';
  RAISE NOTICE 'Table: marketing_strategies now has content JSONB field';
  RAISE NOTICE 'Table: marketing_kpis now has label, value, change, trend, color fields';
END $$;
