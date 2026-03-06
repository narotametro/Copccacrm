-- =====================================================
-- SECURE DATA ISOLATION - PREVENT DATA LEAKAGE
-- =====================================================
-- Each user can only see their OWN data (created_by)
-- No more seeing other users' products/customers
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "products_access" ON products;
DROP POLICY IF EXISTS "brands_access" ON brands;
DROP POLICY IF EXISTS "categories_access" ON categories;
DROP POLICY IF EXISTS "locations_access" ON locations;
DROP POLICY IF EXISTS "sales_hub_orders_access" ON sales_hub_orders;
DROP POLICY IF EXISTS "sales_hub_customers_access" ON sales_hub_customers;

-- ===============================
-- SECURE POLICIES WITH DATA ISOLATION
-- ===============================

-- PRODUCTS: Only see products YOU created
CREATE POLICY "products_access" ON products FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  created_by = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  created_by = auth.uid()
);

-- BRANDS: Only see brands YOU created
CREATE POLICY "brands_access" ON brands FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  (created_by = auth.uid() OR created_by IS NULL)
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- CATEGORIES: Only see categories YOU created
CREATE POLICY "categories_access" ON categories FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  (created_by = auth.uid() OR created_by IS NULL)
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- LOCATIONS: Only see locations YOU created
CREATE POLICY "locations_access" ON locations FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  created_by = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  created_by = auth.uid()
);

-- SALES_HUB_ORDERS: Only see orders YOU created
CREATE POLICY "sales_hub_orders_access" ON sales_hub_orders FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  created_by = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- SALES_HUB_CUSTOMERS: Only see customers YOU created
CREATE POLICY "sales_hub_customers_access" ON sales_hub_customers FOR ALL
USING (
  auth.uid() IS NOT NULL AND 
  created_by = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- ===============================
-- VERIFICATION
-- ===============================
SELECT 
  '✅ SECURE DATA ISOLATION ENABLED' as status,
  'Users can only see their own data' as isolation_level;

-- Show policies
SELECT 
  tablename,
  policyname,
  cmd as operations,
  'created_by = auth.uid()' as isolation_rule
FROM pg_policies 
WHERE tablename IN (
  'products', 'brands', 'categories', 'locations',
  'sales_hub_orders', 'sales_hub_customers'
)
ORDER BY tablename, policyname;

-- Test: Count visible products (should only show YOUR products)
SELECT 
  'Your visible products' as test,
  COUNT(*) as count
FROM products;

-- Test: Count visible customers (should only show YOUR customers)
SELECT 
  'Your visible customers' as test,
  COUNT(*) as count
FROM sales_hub_customers;
