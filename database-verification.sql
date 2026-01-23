-- COPCCA CRM - Database Verification Script
-- Run this to check what tables and columns exist in your database
-- Execute in Supabase SQL Editor

-- Check all tables in public schema
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check table structures for key tables
SELECT
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND t.table_name IN ('companies', 'users', 'deals', 'after_sales', 'debt_collection', 'competitors', 'sales_strategies')
ORDER BY t.table_name, c.ordinal_position;

-- Check for missing tables that the code expects
SELECT 'Missing Tables Check:' as check_type, table_name
FROM (VALUES
  ('companies'),
  ('users'),
  ('deals'),
  ('after_sales'),
  ('after_sales_tasks'),
  ('after_sales_feedback'),
  ('debt_collection'),
  ('marketing_kpis'),
  ('competitors'),
  ('sales_strategies'),
  ('kpi_data'),
  ('interactions'),
  ('user_permissions'),
  ('invitation_links'),
  ('invoices'),
  ('invoice_items'),
  ('invoice_payments'),
  ('invoice_reminders')
) AS expected_tables(table_name)
WHERE table_name NOT IN (
  SELECT tablename FROM pg_tables WHERE schemaname = 'public'
);

-- Check for missing columns on companies table
SELECT 'Missing Companies Columns:' as check_type, column_name
FROM (VALUES
  ('jtbd'),
  ('sentiment'),
  ('feedback_count'),
  ('pain_points'),
  ('city'),
  ('state'),
  ('country'),
  ('postal_code'),
  ('annual_revenue'),
  ('employee_count')
) AS expected_columns(column_name)
WHERE column_name NOT IN (
  SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'companies'
);