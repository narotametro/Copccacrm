-- =====================================================
-- SHOW ALL 3 TYPES OF DATA - CLARIFY DIFFERENCES
-- =====================================================

-- 1. REGISTERED USER ACCOUNTS (People who can LOGIN)
SELECT 
  '👤 REGISTERED USER ACCOUNTS (Can Login)' as type,
  email,
  created_at,
  last_sign_in_at,
  CASE WHEN confirmed_at IS NOT NULL THEN '✅ Confirmed' ELSE '⏳ Pending' END as status
FROM auth.users
ORDER BY created_at DESC;

-- Count registered users
SELECT 
  '📊 TOTAL REGISTERED USERS' as info,
  COUNT(*) as total
FROM auth.users;

-- 2. CRM COMPANIES (Businesses being tracked in CRM)
SELECT 
  '🏢 CRM COMPANIES (Tracked Businesses)' as type,
  name,
  email,
  status,
  created_at,
  created_by
FROM companies
ORDER BY created_at DESC;

-- Count CRM companies
SELECT 
  '📊 TOTAL CRM COMPANIES' as info,
  COUNT(*) as total
FROM companies;

-- 3. SALES HUB CUSTOMERS (Customers in Sales Module)
SELECT 
  '🛒 SALES HUB CUSTOMERS (Created by Teddy)' as type,
  name,
  email,
  phone,
  customer_type,
  created_at,
  created_by
FROM sales_hub_customers
WHERE created_by IN (
  SELECT id FROM auth.users WHERE email = 'teddy@gmail.com'
)
ORDER BY created_at DESC;

-- Count sales hub customers
SELECT 
  '📊 TOTAL SALES HUB CUSTOMERS' as info,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_by IN (SELECT id FROM auth.users WHERE email = 'teddy@gmail.com')) as teddy_customers
FROM sales_hub_customers;

-- Summary showing the confusion
SELECT 
  '📋 DATA TYPE SUMMARY' as summary,
  (SELECT COUNT(*) FROM auth.users) as registered_users_can_login,
  (SELECT COUNT(*) FROM companies) as crm_companies_tracked,
  (SELECT COUNT(*) FROM sales_hub_customers) as sales_customers_total,
  (SELECT COUNT(*) FROM sales_hub_customers WHERE created_by IN (SELECT id FROM auth.users WHERE email = 'teddy@gmail.com')) as teddy_sales_customers;
