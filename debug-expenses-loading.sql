-- ================================================================
-- DEBUG EXPENSES LOADING ISSUE
-- ================================================================

-- STEP 1: Check if expenses table has company_id column
SELECT 
  'EXPENSES TABLE SCHEMA' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses';

-- STEP 2: Check if RLS policies exist on expenses table
SELECT 
  'EXPENSES RLS POLICIES' as section,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'expenses';

-- STEP 3: Check RLS status on expenses table
SELECT 
  'EXPENSES RLS STATUS' as section,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'expenses';

-- STEP 4: Check if there are any expenses records
SELECT 
  'EXPENSES COUNT' as section,
  COUNT(*) as total_expenses
FROM expenses;
