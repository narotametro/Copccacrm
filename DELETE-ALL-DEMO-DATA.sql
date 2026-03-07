-- =====================================================
-- DELETE ALL DEMO DATA - COMPREHENSIVE CLEANUP
-- =====================================================
-- Remove ALL demo/test data from the system
-- Keep ONLY real production data
-- =====================================================

DO $$
DECLARE
  deleted_count INT;
  total_deleted INT := 0;
BEGIN
  -- Disable triggers
  SET session_replication_role = replica;
  
  RAISE NOTICE '🔥 Starting comprehensive DEMO data cleanup...';
  RAISE NOTICE '';
  
  -- Delete demo companies first
  DELETE FROM companies WHERE email IN (
    'admin@techcorp.ng',
    'admin@globaltrade.com',
    'contact@innovationhub.ng'
  ) OR name IN (
    'Techcorp Nigeria Ltd',
    'Global Trade Solutions',
    'Innovation Hub Lagos'
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  ✓ Demo companies: % deleted', deleted_count;
  total_deleted := total_deleted + deleted_count;
  
  -- Delete users from demo companies
  DELETE FROM users WHERE email IN (
    'admin@techcorp.ng',
    'admin@globaltrade.com',
    'contact@innovationhub.ng'
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  ✓ Demo company users: % deleted', deleted_count;
  total_deleted := total_deleted + deleted_count;
  
  -- Delete any test/demo products (you can add more criteria)
  DELETE FROM products WHERE name ILIKE '%demo%' OR name ILIKE '%test%' OR name ILIKE '%sample%';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  ✓ Demo products: % deleted', deleted_count;
  total_deleted := total_deleted + deleted_count;
  
  -- Delete any test/demo customers
  DELETE FROM sales_hub_customers WHERE name ILIKE '%demo%' OR name ILIKE '%test%' OR email ILIKE '%test%';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  ✓ Demo customers: % deleted', deleted_count;
  total_deleted := total_deleted + deleted_count;
  
  -- Delete any test/demo orders
  DELETE FROM sales_hub_orders WHERE notes ILIKE '%demo%' OR notes ILIKE '%test%';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  ✓ Demo orders: % deleted', deleted_count;
  total_deleted := total_deleted + deleted_count;
  
  -- Re-enable triggers
  SET session_replication_role = DEFAULT;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Demo data cleanup complete! Total records deleted: %', total_deleted;
END $$;

-- Show remaining real data
SELECT 
  '📊 REMAINING DATA SUMMARY' as info,
  (SELECT COUNT(*) FROM companies) as companies,
  (SELECT COUNT(*) FROM users WHERE email NOT IN ('teddy@gmail.com', 'narotametro@gmail.com', 'sales@copcca.com', 'admin@copcca.com')) as users,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM sales_hub_customers) as customers,
  (SELECT COUNT(*) FROM sales_hub_orders) as orders;

-- List remaining companies
SELECT 
  '✅ REMAINING COMPANIES' as status,
  id,
  name,
  email,
  status,
  created_at
FROM companies
ORDER BY created_at DESC;
