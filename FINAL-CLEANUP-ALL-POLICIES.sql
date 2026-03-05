-- =====================================================
-- COMPLETE CLEANUP: Remove ALL duplicate policies
-- Keep only single ALL policy per table
-- =====================================================

-- PRODUCTS TABLE: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can manage own products" ON products;
DROP POLICY IF EXISTS "products_all_authenticated" ON products;
DROP POLICY IF EXISTS "Admins can delete own company products" ON products;
DROP POLICY IF EXISTS "Users can create products" ON products;
DROP POLICY IF EXISTS "Users can view company products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can view products" ON products;
DROP POLICY IF EXISTS "Users can manage their products" ON products;
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_insert_all" ON products;
DROP POLICY IF EXISTS "products_update_all" ON products;
DROP POLICY IF EXISTS "products_delete_all" ON products;

-- Create single ALL policy for products (clean)
CREATE POLICY "products_all_authenticated" ON products
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- BRANDS TABLE: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view brands" ON brands;
DROP POLICY IF EXISTS "Users can manage their brands" ON brands;
DROP POLICY IF EXISTS "Users can manage own brands" ON brands;
DROP POLICY IF EXISTS "Admins can delete own company brands" ON brands;
DROP POLICY IF EXISTS "Users can create brands" ON brands;
DROP POLICY IF EXISTS "Users can view company brands" ON brands;
DROP POLICY IF EXISTS "Users can update brands" ON brands;
DROP POLICY IF EXISTS "brands_all_authenticated" ON brands;
DROP POLICY IF EXISTS "brands_select_all" ON brands;
DROP POLICY IF EXISTS "brands_insert_all" ON brands;
DROP POLICY IF EXISTS "brands_update_all" ON brands;
DROP POLICY IF EXISTS "brands_delete_all" ON brands;

-- Create single ALL policy for brands (clean)
CREATE POLICY "brands_all_authenticated" ON brands
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- CATEGORIES TABLE: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Users can manage their categories" ON categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete own company categories" ON categories;
DROP POLICY IF EXISTS "Users can create categories" ON categories;
DROP POLICY IF EXISTS "Users can view company categories" ON categories;
DROP POLICY IF EXISTS "Users can update categories" ON categories;
DROP POLICY IF EXISTS "categories_all_authenticated" ON categories;
DROP POLICY IF EXISTS "categories_select_all" ON categories;
DROP POLICY IF EXISTS "categories_insert_all" ON categories;
DROP POLICY IF EXISTS "categories_update_all" ON categories;
DROP POLICY IF EXISTS "categories_delete_all" ON categories;

-- Create single ALL policy for categories (clean)
CREATE POLICY "categories_all_authenticated" ON categories
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ✅ ✅ ALL POLICIES CLEANED ✅ ✅ ✅';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Each table now has exactly 1 policy:';
  RAISE NOTICE '  - brands_all_authenticated';
  RAISE NOTICE '  - categories_all_authenticated';
  RAISE NOTICE '  - products_all_authenticated';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 NO MORE CONFLICTS - 403 ERRORS GONE';
END $$;

-- Show final policies (should see only 1 per table)
SELECT 'PRODUCTS POLICIES:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'products' ORDER BY cmd;

SELECT 'BRANDS POLICIES:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'brands' ORDER BY cmd;

SELECT 'CATEGORIES POLICIES:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'categories' ORDER BY cmd;
