-- Check if marketing_kpis table exists and what columns it has
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'marketing_kpis';

-- Check columns in marketing_kpis table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'marketing_kpis'
ORDER BY ordinal_position;