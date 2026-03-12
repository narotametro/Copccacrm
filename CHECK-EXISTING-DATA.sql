-- =====================================================
-- CHECK IF EXISTING DATA HAS created_by SET PROPERLY
-- =====================================================
-- This checks if your EXISTING data has created_by values
-- If created_by is NULL, the policies will HIDE that data
-- =====================================================

-- Check products table
SELECT 
  '📦 PRODUCTS DATA CHECK' as check_type,
  COUNT(*) as total_products,
  COUNT(created_by) as products_with_created_by,
  COUNT(*) - COUNT(created_by) as products_missing_created_by
FROM products;

-- Show products with missing created_by
SELECT 
  '⚠️  PRODUCTS MISSING created_by' as issue,
  id,
  name,
  sku,
  created_by
FROM products
WHERE created_by IS NULL
LIMIT 10;

-- Check companies table
SELECT 
  '🏢 COMPANIES DATA CHECK' as check_type,
  COUNT(*) as total_companies,
  COUNT(created_by) as companies_with_created_by,
  COUNT(*) - COUNT(created_by) as companies_missing_created_by
FROM companies;

-- Show companies with missing created_by
SELECT 
  '⚠️  COMPANIES MISSING created_by' as issue,
  id,
  name,
  created_by
FROM companies
WHERE created_by IS NULL
LIMIT 10;

-- Check invoices table
SELECT 
  '📄 INVOICES DATA CHECK' as check_type,
  COUNT(*) as total_invoices,
  COUNT(created_by) as invoices_with_created_by,
  COUNT(*) - COUNT(created_by) as invoices_missing_created_by
FROM invoices;

-- Show invoices with missing created_by
SELECT 
  '⚠️  INVOICES MISSING created_by' as issue,
  id,
  invoice_number,
  created_by
FROM invoices
WHERE created_by IS NULL
LIMIT 10;

-- Check which users exist
SELECT 
  '👥 USERS IN DATABASE' as info,
  id,
  email,
  full_name,
  role
FROM users
ORDER BY created_at;

-- =====================================================
-- DIAGNOSIS
-- =====================================================
-- If you see many rows with NULL created_by:
-- → That's why the policies are hiding data
-- → You need to assign created_by to existing data
-- 
-- Next step: Run FIX-EXISTING-DATA.sql to assign ownership
-- =====================================================
