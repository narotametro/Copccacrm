-- ================================================================
-- DEBUG: WHY CUSTOMER STILL SHOWS AFTER DELETION
-- ================================================================

-- Check what customers florenz@gmail.com can see
SELECT 
  'CUSTOMERS VISIBLE TO FLORENZ' as section,
  sc.id,
  sc.name,
  sc.email,
  sc.company_id,
  sc.status,
  u.company_id as florenz_company_id,
  CASE 
    WHEN sc.company_id = u.company_id THEN '✓ SAME COMPANY'
    ELSE '✗ DIFFERENT COMPANY'
  END as match_status
FROM sales_hub_customers sc
CROSS JOIN (SELECT company_id FROM users WHERE email = 'florenz@gmail.com') u
WHERE sc.company_id = u.company_id;

-- Check RLS status on sales_hub_customers
SELECT 
  'RLS STATUS' as section,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'sales_hub_customers';

-- Count all customers (bypassing RLS for admin check)
SELECT 
  'ALL CUSTOMERS COUNT' as section,
  COUNT(*) as total_customers
FROM sales_hub_customers;

-- Check if there are ANY customers with "Florenz" in name
SELECT 
  'FLORENZ SEARCH' as section,
  id,
  name,
  email,
  company_id,
  status
FROM sales_hub_customers
WHERE name ILIKE '%florenz%' OR email ILIKE '%florenz%';

-- Force delete ALL customers for Florenz Inc company
DELETE FROM sales_hub_customers 
WHERE company_id = (SELECT company_id FROM users WHERE email = 'florenz@gmail.com');

-- Verify deletion
SELECT 
  'AFTER DELETION' as section,
  COUNT(*) as customers_for_florenz_company
FROM sales_hub_customers 
WHERE company_id = (SELECT company_id FROM users WHERE email = 'florenz@gmail.com');
