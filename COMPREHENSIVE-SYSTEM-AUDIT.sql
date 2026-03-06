-- =====================================================
-- COMPREHENSIVE SYSTEM AUDIT
-- Run this to see EXACTLY what state your system is in
-- =====================================================

-- Check current user info
SELECT 
  '👤 CURRENT USER INFO' as check_type,
  id,
  email,
  company_id,
  role,
  is_company_owner,
  full_name,
  created_at
FROM users 
WHERE id = auth.uid();

-- Check if user has subscription
SELECT 
  '💳 USER SUBSCRIPTION' as check_type,
  us.id,
  us.user_id,
  us.status,
  sp.name as plan_name,
  sp.display_name,
  us.created_at
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = auth.uid();

-- Check RLS policies on critical tables
SELECT 
  '🔒 RLS POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual::text as using_clause
FROM pg_policies 
WHERE tablename IN ('products', 'brands', 'categories', 'locations', 'expenses', 'companies', 'users')
ORDER BY tablename, policyname;

-- Check if locations exist
SELECT 
  '📍 LOCATIONS' as check_type,
  id,
  name,
  type,
  company_id,
  created_by,
  created_at
FROM locations
LIMIT 10;

-- Check if products exist
SELECT 
  '📦 PRODUCTS' as check_type,
  COUNT(*) as total_products,
  COUNT(DISTINCT location_id) as locations_with_products,
  COUNT(CASE WHEN company_id IS NULL THEN 1 END) as null_company_id,
  COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as with_company_id
FROM products;

-- Check brands
SELECT 
  '🏷️ BRANDS' as check_type,
  COUNT(*) as total_brands,
  COUNT(CASE WHEN company_id IS NULL THEN 1 END) as null_company_id
FROM brands;

-- Check categories  
SELECT 
  '📂 CATEGORIES' as check_type,
  COUNT(*) as total_categories,
  COUNT(CASE WHEN company_id IS NULL THEN 1 END) as null_company_id
FROM categories;

-- Check companies table
SELECT 
  '🏢 COMPANIES' as check_type,
  id,
  name,
  company_tin,
  created_by,
  created_at
FROM companies
LIMIT 5;

-- Check if there are other users
SELECT 
  '👥 ALL USERS COUNT' as check_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN company_id IS NULL THEN 1 END) as without_company_id,
  COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as with_company_id
FROM users;
