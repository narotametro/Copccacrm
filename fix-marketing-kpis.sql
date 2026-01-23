-- Fix marketing_kpis table by recreating it properly
-- Only run this if the table exists but is missing the campaign_id column

-- Drop the table if it exists
DROP TABLE IF EXISTS marketing_kpis;

-- Recreate with proper structure
CREATE TABLE marketing_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID,
  metric_name TEXT NOT NULL,
  value DECIMAL NOT NULL,
  target DECIMAL,
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  recorded_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE marketing_kpis ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Allow authenticated access to marketing_kpis" ON marketing_kpis FOR ALL USING (auth.role() = 'authenticated');