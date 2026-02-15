-- ================================================================
-- FIX: ENABLE RLS ON ALL TABLES
-- ================================================================
-- The RLS policies were created but RLS wasn't enabled on tables
-- ================================================================

-- STEP 1: Enable RLS on all critical tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_hub_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_hub_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- STEP 2: Verify RLS is enabled
DO $$
DECLARE
  tables_with_rls INTEGER;
  tables_without_rls INTEGER;
BEGIN
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('products', 'sales_hub_customers', 'sales_hub_orders', 'after_sales_tasks', 'expenses', 'stock_history')
    AND rowsecurity = true;
    
  SELECT COUNT(*) INTO tables_without_rls
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('products', 'sales_hub_customers', 'sales_hub_orders', 'after_sales_tasks', 'expenses', 'stock_history')
    AND rowsecurity = false;
  
  RAISE NOTICE '=== RLS STATUS ===';
  RAISE NOTICE 'Tables with RLS enabled: %', tables_with_rls;
  RAISE NOTICE 'Tables without RLS: %', tables_without_rls;
  
  IF tables_without_rls = 0 THEN
    RAISE NOTICE '✓ RLS enabled on all critical tables';
  ELSE
    RAISE NOTICE '⚠️ Some tables still need RLS enabled';
  END IF;
END $$;

-- STEP 3: Verify policies exist
DO $$
DECLARE
  products_policies INTEGER;
  customers_policies INTEGER;
  orders_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO products_policies FROM pg_policies WHERE tablename = 'products';
  SELECT COUNT(*) INTO customers_policies FROM pg_policies WHERE tablename = 'sales_hub_customers';
  SELECT COUNT(*) INTO orders_policies FROM pg_policies WHERE tablename = 'sales_hub_orders';
  
  RAISE NOTICE '=== RLS POLICIES COUNT ===';
  RAISE NOTICE 'Products policies: %', products_policies;
  RAISE NOTICE 'Customers policies: %', customers_policies;
  RAISE NOTICE 'Orders policies: %', orders_policies;
  
  IF products_policies >= 4 AND customers_policies >= 4 AND orders_policies >= 4 THEN
    RAISE NOTICE '✓ All required policies are in place';
  ELSE
    RAISE NOTICE '⚠️ Some policies might be missing';
  END IF;
  
  RAISE NOTICE '✓ RLS enabled successfully';
  RAISE NOTICE 'You should now only see data from your own company';
END $$;
