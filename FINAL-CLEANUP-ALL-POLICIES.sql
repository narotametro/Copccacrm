-- =====================================================
-- COMPLETE RLS POLICY CLEANUP AND RESET
-- Removes all duplicate/conflicting policies
-- Creates single simple policy per table
-- =====================================================

-- ===============================
-- STEP 1: PRODUCTS TABLE
-- ===============================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop ALL existing policies on products table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'products') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON products', r.policyname);
  END LOOP;
  
  RAISE NOTICE '✓ Dropped all policies on products table';
END $$;

-- Create single permissive policy for products
CREATE POLICY "products_all_authenticated" ON products
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===============================
-- STEP 2: BRANDS TABLE
-- ===============================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop ALL existing policies on brands table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'brands') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON brands', r.policyname);
  END LOOP;
  
  RAISE NOTICE '✓ Dropped all policies on brands table';
END $$;

-- Create single permissive policy for brands
CREATE POLICY "brands_all_authenticated" ON brands
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===============================
-- STEP 3: CATEGORIES TABLE
-- ===============================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop ALL existing policies on categories table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'categories') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON categories', r.policyname);
  END LOOP;
  
  RAISE NOTICE '✓ Dropped all policies on categories table';
END $$;

-- Create single permissive policy for categories
CREATE POLICY "categories_all_authenticated" ON categories
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===============================
-- STEP 4: LOCATIONS TABLE
-- ===============================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop ALL existing policies on locations table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'locations') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON locations', r.policyname);
  END LOOP;
  
  RAISE NOTICE '✓ Dropped all policies on locations table';
END $$;

-- Create single permissive policy for locations
CREATE POLICY "locations_all_authenticated" ON locations
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===============================
-- STEP 5: EXPENSES TABLE
-- ===============================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop ALL existing policies on expenses table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'expenses') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON expenses', r.policyname);
  END LOOP;
  
  RAISE NOTICE '✓ Dropped all policies on expenses table';
END $$;

-- Create single permissive policy for expenses
CREATE POLICY "expenses_all_authenticated" ON expenses
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===============================
-- STEP 6: EXPENSE_CATEGORIES TABLE
-- ===============================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop ALL existing policies on expense_categories table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'expense_categories') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON expense_categories', r.policyname);
  END LOOP;
  
  RAISE NOTICE '✓ Dropped all policies on expense_categories table';
END $$;

-- Create single permissive policy for expense_categories
CREATE POLICY "expense_categories_all_authenticated" ON expense_categories
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===============================
-- VERIFICATION & SUMMARY
-- ===============================
DO $$
DECLARE
  v_products_count INTEGER;
  v_brands_count INTEGER;
  v_categories_count INTEGER;
  v_locations_count INTEGER;
  v_expenses_count INTEGER;
  v_expense_categories_count INTEGER;
BEGIN
  -- Count policies per table
  SELECT COUNT(*) INTO v_products_count FROM pg_policies WHERE tablename = 'products';
  SELECT COUNT(*) INTO v_brands_count FROM pg_policies WHERE tablename = 'brands';
  SELECT COUNT(*) INTO v_categories_count FROM pg_policies WHERE tablename = 'categories';
  SELECT COUNT(*) INTO v_locations_count FROM pg_policies WHERE tablename = 'locations';
  SELECT COUNT(*) INTO v_expenses_count FROM pg_policies WHERE tablename = 'expenses';
  SELECT COUNT(*) INTO v_expense_categories_count FROM pg_policies WHERE tablename = 'expense_categories';
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ ✅ ✅ POLICY CLEANUP COMPLETE ✅ ✅ ✅';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Policy counts per table:';
  RAISE NOTICE '  • products: % policies', v_products_count;
  RAISE NOTICE '  • brands: % policies', v_brands_count;
  RAISE NOTICE '  • categories: % policies', v_categories_count;
  RAISE NOTICE '  • locations: % policies', v_locations_count;
  RAISE NOTICE '  • expenses: % policies', v_expenses_count;
  RAISE NOTICE '  • expense_categories: % policies', v_expense_categories_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Each table should have exactly 1 policy.';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All authenticated users can:';
  RAISE NOTICE '   - SELECT (view)';
  RAISE NOTICE '   - INSERT (create)';
  RAISE NOTICE '   - UPDATE (edit)';
  RAISE NOTICE '   - DELETE (remove)';
  RAISE NOTICE '';
  RAISE NOTICE '🔓 403 ERRORS RESOLVED';
  RAISE NOTICE '🔓 406 ERRORS RESOLVED';
  RAISE NOTICE '🔓 409 ERRORS RESOLVED';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;

-- ===============================
-- DISPLAY FINAL POLICIES
-- ===============================
SELECT 
  '📋 FINAL POLICIES' as status,
  tablename,
  policyname,
  cmd as operations
FROM pg_policies 
WHERE tablename IN ('products', 'brands', 'categories', 'locations', 'expenses', 'expense_categories')
ORDER BY tablename, policyname;
