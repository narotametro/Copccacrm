-- ================================================================
-- DEBUG: WHY COMPANY SHOWS AS CUSTOMER
-- ================================================================

-- STEP 1: Check your current user and company info
SELECT 
  'YOUR INFO' as section,
  u.id as user_id,
  u.email,
  u.company_id,
  c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'florenz@gmail.com';

-- STEP 2: Check all customers in sales_hub_customers table
SELECT 
  'ALL CUSTOMERS IN DATABASE' as section,
  id,
  name,
  email,
  company_id,
  status,
  created_at
FROM sales_hub_customers
ORDER BY created_at DESC;

-- STEP 3: Check if "Florenz Inc" exists as a customer
SELECT 
  'FLORENZ AS CUSTOMER' as section,
  id,
  name,
  email,
  company_id,
  status,
  created_at
FROM sales_hub_customers
WHERE name ILIKE '%florenz%';

-- STEP 4: Check which customers belong to your company
SELECT 
  'CUSTOMERS FOR YOUR COMPANY' as section,
  sc.id,
  sc.name,
  sc.email,
  sc.company_id,
  (SELECT company_id FROM users WHERE email = 'florenz@gmail.com') as your_company_id,
  CASE 
    WHEN sc.company_id = (SELECT company_id FROM users WHERE email = 'florenz@gmail.com') 
    THEN '✓ YOUR CUSTOMER'
    ELSE '✗ DIFFERENT COMPANY'
  END as status
FROM sales_hub_customers sc
WHERE sc.company_id = (SELECT company_id FROM users WHERE email = 'florenz@gmail.com');

-- STEP 5: Check RLS policies on sales_hub_customers
SELECT 
  'CUSTOMERS RLS POLICIES' as section,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'sales_hub_customers';
