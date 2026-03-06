-- =====================================================
-- DELETE ALL USERS EXCEPT teddy@gmail.com
-- =====================================================
-- WARNING: THIS WILL PERMANENTLY DELETE USERS AND THEIR DATA
-- Keep teddy@gmail.com for testing
-- =====================================================

-- STEP 1: Delete from public.users first (to avoid FK constraint issues)
DELETE FROM users 
WHERE email != 'teddy@gmail.com' 
AND email NOT LIKE '%narotametro%'
AND email NOT LIKE '%sales@copcca%';

-- Show which users will be deleted from auth.users
SELECT 
  '⚠️ THESE AUTH USERS WILL BE DELETED' as warning,
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

-- STEP 2: Clean up orphaned data for deleted users
-- This removes products, orders, customers created by deleted users

-- First, get the IDs of users we're keeping
DO $$
DECLARE
  teddy_id UUID;
BEGIN
  SELECT id INTO teddy_id FROM auth.users WHERE email = 'teddy@gmail.com';
  
  -- Delete products from deleted users
  DELETE FROM products WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  );
  
  -- Delete brands from deleted users
  DELETE FROM brands WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  ) AND created_by IS NOT NULL;
  
  -- Delete categories from deleted users
  DELETE FROM categories WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  ) AND created_by IS NOT NULL;
  
  -- Delete locations from deleted users
  DELETE FROM locations WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  );
  
  -- Delete orders from deleted users
  DELETE FROM sales_hub_orders WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  );
  
  -- Delete customers from deleted users
  DELETE FROM sales_hub_customers WHERE created_by NOT IN (
    SELECT id FROM auth.users WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
  );
  
  RAISE NOTICE '✅ Cleaned up data from deleted users';
END $$;

-- Verification: Show remaining users
SELECT 
  '✅ REMAINING USERS' as status,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;
