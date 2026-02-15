-- =====================================================
-- VERIFY EXPENSES DATABASE SCHEMA
-- =====================================================
-- Run these queries to verify the expenses schema was created correctly

-- 1. Check all expenses-related tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name LIKE 'expense%'
ORDER BY table_name;

-- 2. View expense_categories structure and data
SELECT 
  id,
  name,
  description,
  is_default,
  icon,
  color
FROM expense_categories
ORDER BY 
  CASE WHEN is_default THEN 0 ELSE 1 END,
  name;

-- 3. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE 'expense%';

-- 4. View all RLS policies for expenses tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename LIKE 'expense%'
ORDER BY tablename, policyname;

-- 5. Check indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'expense%'
ORDER BY tablename, indexname;

-- 6. Test expense_categories access (should show default categories)
SELECT 
  COUNT(*) as total_categories,
  SUM(CASE WHEN is_default THEN 1 ELSE 0 END) as default_categories,
  SUM(CASE WHEN NOT is_default THEN 1 ELSE 0 END) as custom_categories
FROM expense_categories;

-- 7. Check views created
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'v_expense%';

-- 8. Verify functions exist
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%expense%' OR routine_name = 'update_updated_at_column')
ORDER BY routine_name;
