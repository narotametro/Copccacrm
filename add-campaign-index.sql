-- Add the campaign_id index separately (run after RLS policies are added)
CREATE INDEX IF NOT EXISTS idx_marketing_kpis_campaign_id ON marketing_kpis(campaign_id);