-- =====================================================
-- FIX BRANDS AND CATEGORIES TABLE RLS POLICIES
-- Allow authenticated users to INSERT/UPDATE/DELETE
-- =====================================================

-- BRANDS TABLE: Clean up and create permissive policies
DROP POLICY IF EXISTS "Users can view brands" ON brands;
DROP POLICY IF EXISTS "Users can manage their brands" ON brands;
DROP POLICY IF EXISTS "brands_select_all" ON brands;
DROP POLICY IF EXISTS "brands_insert_all" ON brands;
DROP POLICY IF EXISTS "brands_update_all" ON brands;
DROP POLICY IF EXISTS "brands_delete_all" ON brands;

-- Create single ALL policy for brands (simple and permissive)
CREATE POLICY "brands_all_authenticated" ON brands
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- CATEGORIES TABLE: Clean up and create permissive policies
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Users can manage their categories" ON categories;
DROP POLICY IF EXISTS "categories_select_all" ON categories;
DROP POLICY IF EXISTS "categories_insert_all" ON categories;
DROP POLICY IF EXISTS "categories_update_all" ON categories;
DROP POLICY IF EXISTS "categories_delete_all" ON categories;

-- Create single ALL policy for categories (simple and permissive)
CREATE POLICY "categories_all_authenticated" ON categories
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- PRODUCTS TABLE: Clean up and create permissive policies
DROP POLICY IF EXISTS "Users can view products" ON products;
DROP POLICY IF EXISTS "Users can manage their products" ON products;
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_insert_all" ON products;
DROP POLICY IF EXISTS "products_update_all" ON products;
DROP POLICY IF EXISTS "products_delete_all" ON products;

-- Create single ALL policy for products (simple and permissive)
CREATE POLICY "products_all_authenticated" ON products
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ BRANDS, CATEGORIES, PRODUCTS RLS FIXED';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All authenticated users can now:';
  RAISE NOTICE '  - SELECT from brands, categories, products';
  RAISE NOTICE '  - INSERT into brands, categories, products';
  RAISE NOTICE '  - UPDATE brands, categories, products';
  RAISE NOTICE '  - DELETE from brands, categories, products';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 403 ERRORS SHOULD BE GONE';
END $$;

-- Show current policies
SELECT 'BRANDS POLICIES:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'brands' ORDER BY cmd;

SELECT 'CATEGORIES POLICIES:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'categories' ORDER BY cmd;

SELECT 'PRODUCTS POLICIES:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'products' ORDER BY cmd;
