-- ================================================================
-- DEBUG: WHY FLORENZ INC STILL SHOWS AS CUSTOMER
-- ================================================================

-- Check all customers in sales_hub_customers
SELECT 
  'ALL CUSTOMERS' as section,
  id,
  name,
  email,
  company_id,
  status,
  created_at,
  (SELECT name FROM companies WHERE id = sales_hub_customers.company_id) as company_name
FROM sales_hub_customers
ORDER BY created_at DESC;

-- Check if any customer names match company names
SELECT 
  'CUSTOMER NAMES MATCHING COMPANIES' as section,
  sc.id,
  sc.name as customer_name,
  sc.company_id,
  c.name as company_name,
  c.id as company_id_from_companies
FROM sales_hub_customers sc
INNER JOIN companies c ON sc.name = c.name;

-- Check Florenz Inc specifically
SELECT 
  'FLORENZ INC DETAILS' as section,
  id,
  name,
  email,
  company_id,
  status,
  created_at
FROM sales_hub_customers
WHERE name ILIKE '%florenz%';

-- Delete Florenz Inc if it exists
DELETE FROM sales_hub_customers WHERE name ILIKE '%florenz%';

-- Verify deletion
SELECT 
  'VERIFICATION' as section,
  COUNT(*) as remaining_customers
FROM sales_hub_customers
WHERE name ILIKE '%florenz%';
