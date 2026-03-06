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
  keep_users UUID[];
  deleted_count INT;
  total_deleted INT := 0;
BEGIN
  -- Get list of user IDs to keep
  SELECT ARRAY_AGG(id) INTO keep_users
  FROM auth.users 
  WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com');
  
  RAISE NOTICE '🔥 Starting comprehensive data cleanup...';
  RAISE NOTICE '📋 Keeping users: teddy@gmail.com, narotametro@gmail.com, sales@copcca.com';
  
  -- Delete from tables with created_by column
  -- Delete companies first (has assigned_to FK)
  DELETE FROM companies WHERE assigned_to IS NOT NULL AND assigned_to != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Companies: % deleted', deleted_count;
  
  DELETE FROM support_tickets WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Support tickets: % deleted', deleted_count;
  
  DELETE FROM deals WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Deals: % deleted', deleted_count;
  
  DELETE FROM invoices WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Invoices: % deleted', deleted_count;
  
  DELETE FROM expenses WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Expenses: % deleted', deleted_count;
  
  DELETE FROM stock_transfers WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Stock transfers: % deleted', deleted_count;
  
  DELETE FROM products WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Products: % deleted', deleted_count;
  
  DELETE FROM locations WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Locations: % deleted', deleted_count;
  
  DELETE FROM inventory_locations WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Inventory locations: % deleted', deleted_count;
  
  DELETE FROM brands WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Brands: % deleted', deleted_count;
  
  DELETE FROM categories WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Categories: % deleted', deleted_count;
  
  DELETE FROM sales_hub_orders WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Orders: % deleted', deleted_count;
  
  DELETE FROM sales_hub_customers WHERE created_by IS NOT NULL AND created_by != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Customers: % deleted', deleted_count;
  
  -- Delete from tables with user_id column
  DELETE FROM interactions WHERE user_id IS NOT NULL AND user_id != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Interactions: % deleted', deleted_count;
  
  DELETE FROM user_subscriptions WHERE user_id IS NOT NULL AND user_id != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ User subscriptions: % deleted', deleted_count;
  
  DELETE FROM notifications WHERE user_id IS NOT NULL AND user_id != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Notifications: % deleted', deleted_count;
  
  DELETE FROM sales_hub_sessions WHERE user_id IS NOT NULL AND user_id != ALL(keep_users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✓ Sales hub sessions: % deleted', deleted_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Data cleanup complete! Total records deleted: %', total_deleted;
END $$;

-- STEP 2: NOW delete from public.users (after cleaning up their data)
DELETE FROM users 
WHERE id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com')
);

-- Show results
DO $$
DECLARE
  remaining_count INT;
  deleted_auth_users TEXT;
BEGIN
  SELECT COUNT(*) INTO remaining_count FROM users;
  RAISE NOTICE '';
  RAISE NOTICE '✅ USER CLEANUP COMPLETE';
  RAISE NOTICE '  - Remaining users in public.users: %', remaining_count;
  
  -- Show which auth users still need manual deletion
  SELECT STRING_AGG(email, ', ') INTO deleted_auth_users
  FROM auth.users
  WHERE email NOT IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com');
  
  IF deleted_auth_users IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  MANUAL ACTION REQUIRED';
    RAISE NOTICE '  These auth accounts need deletion in Supabase Dashboard:';
    RAISE NOTICE '  %', deleted_auth_users;
    RAISE NOTICE '';
    RAISE NOTICE '  Go to: Supabase Dashboard → Authentication → Users → Delete each user';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ No auth users need manual deletion';
  END IF;
END $$;
