-- ================================================================
-- CHECK SALES_HUB_CUSTOMERS TABLE STRUCTURE
-- ================================================================

-- Check all columns in sales_hub_customers
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'sales_hub_customers'
ORDER BY ordinal_position;

-- Check if there are any customers for florenz's company
SELECT 
  id,
  customer_id,
  name,
  company_id,
  email,
  status
FROM sales_hub_customers
WHERE company_id = (SELECT company_id FROM users WHERE email = 'florenz@gmail.com');

-- Check if there's any link between companies and sales_hub_customers
SELECT 
  'COMPANIES TABLE' as table_name,
  id::text,
  name,
  email
FROM companies
WHERE id = (SELECT company_id FROM users WHERE email = 'florenz@gmail.com')
UNION ALL
SELECT 
  'SALES_HUB_CUSTOMERS' as table_name,
  id::text,
  name,
  email
FROM sales_hub_customers
WHERE company_id = (SELECT company_id FROM users WHERE email = 'florenz@gmail.com');
