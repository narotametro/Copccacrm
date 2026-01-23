-- Verify marketing tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('system_metrics', 'marketing_campaigns', 'marketing_strategies', 'marketing_kpis')
ORDER BY table_name;