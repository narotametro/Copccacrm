-- Add RLS policies and indexes for marketing tables (without problematic index)
-- Run this after verifying tables exist

-- Enable RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_kpis ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Allow authenticated access to system_metrics" ON system_metrics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to marketing_campaigns" ON marketing_campaigns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to marketing_strategies" ON marketing_strategies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to marketing_kpis" ON marketing_kpis FOR ALL USING (auth.role() = 'authenticated');

-- Essential indexes (excluding the problematic one)
CREATE INDEX IF NOT EXISTS idx_system_metrics_category ON system_metrics(category);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_strategies_type ON marketing_strategies(strategy_type);