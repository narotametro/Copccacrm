-- =====================================================
-- DELETE ALL USERS EXCEPT teddy@gmail.com
-- =====================================================
-- WARNING: THIS WILL PERMANENTLY DELETE USERS AND THEIR DATA
-- Keep teddy@gmail.com for testing
-- =====================================================

-- STEP 1: Clean up data FIRST (before deleting users)
-- Delete in correct order to avoid FK constraint errors
DO $$
DECLARE
  deleted_products INT;
  deleted_locations INT;
  deleted_brands INT;
  deleted_categories INT;
  deleted_orders INT;
  deleted_customers INT;
  deleted_users INT;
BEGIN
  -- Delete products from users we're removing
  DELETE FROM products WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  );
  GET DIAGNOSTICS deleted_products = ROW_COUNT;
  
  -- Delete locations from users we're removing
  DELETE FROM locations WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  );
  GET DIAGNOSTICS deleted_locations = ROW_COUNT;
  
  -- Delete brands from users we're removing
  DELETE FROM brands WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  ) AND created_by IS NOT NULL;
  GET DIAGNOSTICS deleted_brands = ROW_COUNT;
  
  -- Delete categories from users we're removing
  DELETE FROM categories WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  ) AND created_by IS NOT NULL;
  GET DIAGNOSTICS deleted_categories = ROW_COUNT;
  
  -- Delete orders from users we're removing
  DELETE FROM sales_hub_orders WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  );
  GET DIAGNOSTICS deleted_orders = ROW_COUNT;
  
  -- Delete customers from users we're removing
  DELETE FROM sales_hub_customers WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  );
  GET DIAGNOSTICS deleted_customers = ROW_COUNT;
  
  RAISE NOTICE '✅ Data cleanup complete:';
  RAISE NOTICE '  - Products deleted: %', deleted_products;
  RAISE NOTICE '  - Locations deleted: %', deleted_locations;
  RAISE NOTICE '  - Brands deleted: %', deleted_brands;
  RAISE NOTICE '  - Categories deleted: %', deleted_categories;
  RAISE NOTICE '  - Orders deleted: %', deleted_orders;
  RAISE NOTICE '  - Customers deleted: %', deleted_customers;
END $$;

-- STEP 2: NOW delete from public.users (after cleaning up their data)
DELETE FROM users 
WHERE email != 'teddy@gmail.com' 
AND email NOT LIKE '%narotametro%'
AND email NOT LIKE '%sales@copcca%';

-- Show which users were deleted
SELECT 
  '✅ USERS DELETED FROM PUBLIC.USERS' as status,
  COUNT(*) as deleted_count
FROM users
WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com');

-- Show which auth users still need manual deletion
SELECT 
  '⚠️ THESE AUTH USERS NEED MANUAL DELETION' as warning,
  email,
  created_at
FROM auth.users
WHERE email != 'teddy@gmail.com'
AND email NOT LIKE '%narotametro%'
AND email NOT LIKE '%sales@copcca%'
ORDER BY created_at DESC;

-- NOTE: You must manually delete from auth.users using Supabase Dashboard
-- Go to: Authentication → Users → Select each user → Delete
-- OR use Supabase Management API (requires service role key)

-- Verification: Show remaining users
SELECT 
  '✅ REMAINING USERS' as status,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;
