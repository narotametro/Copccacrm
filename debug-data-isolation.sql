-- ================================================================
-- DEBUG DATA ISOLATION ISSUES
-- ================================================================
-- Run this to diagnose why you're still seeing other companies' data
-- ================================================================

-- STEP 1: Check your current user info
SELECT 
  'YOUR USER INFO' as section,
  id as user_id,
  email,
  company_id,
  role
FROM users 
WHERE id = auth.uid();

-- STEP 2: Check if products table has company_id column
SELECT 
  'PRODUCTS TABLE SCHEMA' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('id', 'name', 'company_id', 'created_by');

-- STEP 3: Check ALL products and their company assignments
SELECT 
  'ALL PRODUCTS IN DATABASE' as section,
  p.id,
  p.name,
  p.sku,
  p.company_id,
  c.name as company_name,
  p.stock_quantity,
  p.created_at
FROM products p
LEFT JOIN companies c ON p.company_id = c.id
ORDER BY p.created_at DESC;

-- STEP 4: Check how many companies exist
SELECT 
  'ALL COMPANIES' as section,
  id,
  name,
  created_at,
  (SELECT COUNT(*) FROM users WHERE company_id = companies.id) as user_count,
  (SELECT COUNT(*) FROM products WHERE company_id = companies.id) as product_count
FROM companies
ORDER BY created_at;

-- STEP 5: Check RLS policies on products table
SELECT 
  'RLS POLICIES ON PRODUCTS' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'products';

-- STEP 6: Check if RLS is enabled on products table
SELECT 
  'RLS STATUS' as section,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'products';

-- STEP 7: Check products that the current user SHOULD see (based on company_id)
SELECT 
  'PRODUCTS YOU SHOULD SEE' as section,
  p.id,
  p.name,
  p.sku,
  p.company_id,
  u.company_id as your_company_id,
  CASE 
    WHEN p.company_id = u.company_id THEN '✓ MATCHES'
    ELSE '✗ DIFFERENT COMPANY'
  END as status
FROM products p
CROSS JOIN (SELECT company_id FROM users WHERE id = auth.uid()) u
ORDER BY p.created_at DESC;

-- STEP 8: Check all users and their companies
SELECT 
  'ALL USERS' as section,
  id,
  email,
  company_id,
  role,
  created_at
FROM users
ORDER BY created_at DESC;
