-- =====================================================
-- FIX EXISTING DATA - ASSIGN created_by TO ORPHANED RECORDS
-- =====================================================
-- This assigns created_by to records that have NULL values
-- WARNING: Review the user assignments before running!
-- =====================================================

-- =====================================================
-- STEP 1: CHECK WHAT NEEDS TO BE FIXED
-- =====================================================

-- Count orphaned records
SELECT 
  '📊 ORPHANED RECORDS COUNT' as report,
  (SELECT COUNT(*) FROM products WHERE created_by IS NULL) as products_without_owner,
  (SELECT COUNT(*) FROM companies WHERE created_by IS NULL) as companies_without_owner,
  (SELECT COUNT(*) FROM invoices WHERE created_by IS NULL) as invoices_without_owner;

-- =====================================================
-- STEP 2: OPTION A - ASSIGN TO FIRST/OLDEST USER
-- =====================================================
-- Use this if you want to assign all orphaned data to the first user

-- Get the first user ID (usually the admin/owner)
DO $$ 
DECLARE
  first_user_id UUID;
BEGIN
  -- Get the oldest user (likely the main admin)
  SELECT id INTO first_user_id 
  FROM users 
  ORDER BY created_at ASC 
  LIMIT 1;

  IF first_user_id IS NULL THEN
    RAISE EXCEPTION '❌ No users found in database!';
  END IF;

  -- Assign orphaned products to first user
  UPDATE products 
  SET created_by = first_user_id 
  WHERE created_by IS NULL;
  
  RAISE NOTICE '✅ Updated % products', (SELECT COUNT(*) FROM products WHERE created_by = first_user_id);

  -- Assign orphaned companies to first user
  UPDATE companies 
  SET created_by = first_user_id 
  WHERE created_by IS NULL;
  
  RAISE NOTICE '✅ Updated % companies', (SELECT COUNT(*) FROM companies WHERE created_by = first_user_id);

  -- Assign orphaned invoices to first user
  UPDATE invoices 
  SET created_by = first_user_id 
  WHERE created_by IS NULL;
  
  RAISE NOTICE '✅ Updated % invoices', (SELECT COUNT(*) FROM invoices WHERE created_by = first_user_id);

  RAISE NOTICE '✅ Assigned all orphaned records to user: %', first_user_id;
END $$;

-- =====================================================
-- STEP 3: VERIFY THE FIX
-- =====================================================

SELECT 
  '✅ VERIFICATION - ORPHANED RECORDS FIXED' as report,
  (SELECT COUNT(*) FROM products WHERE created_by IS NULL) as products_still_orphaned,
  (SELECT COUNT(*) FROM companies WHERE created_by IS NULL) as companies_still_orphaned,
  (SELECT COUNT(*) FROM invoices WHERE created_by IS NULL) as invoices_still_orphaned;

-- Show distribution of data by user
SELECT 
  '📊 DATA DISTRIBUTION BY USER' as report,
  u.email,
  u.full_name,
  COUNT(DISTINCT p.id) as products_count,
  COUNT(DISTINCT c.id) as companies_count,
  COUNT(DISTINCT i.id) as invoices_count
FROM users u
LEFT JOIN products p ON p.created_by = u.id
LEFT JOIN companies c ON c.created_by = u.id
LEFT JOIN invoices i ON i.created_by = u.id
GROUP BY u.id, u.email, u.full_name
ORDER BY u.created_at;

-- =====================================================
-- ✅ SCRIPT COMPLETE
-- =====================================================
-- All orphaned records now have a created_by owner
-- The RLS policies will now work correctly
-- Each user can see their own data
-- =====================================================
