-- =====================================================
-- VERIFY LOCATION-BASED PRODUCTS MIGRATION
-- Run these queries to confirm everything is working
-- =====================================================

-- 1. Check if location_id column exists and has NOT NULL constraint
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products' 
AND column_name = 'location_id';

-- Expected: is_nullable = 'NO' (if all products were migrated)
-- Expected: is_nullable = 'YES' (if some products still need locations)

-- 2. Count products with and without locations
SELECT 
  CASE 
    WHEN location_id IS NULL THEN '⚠️ No Location Assigned'
    ELSE '✅ Location Assigned'
  END as status,
  COUNT(*) as product_count
FROM products
GROUP BY CASE WHEN location_id IS NULL THEN '⚠️ No Location Assigned' ELSE '✅ Location Assigned' END;

-- 3. View all products with their assigned locations
SELECT 
  p.name as product_name,
  p.sku,
  l.name as location_name,
  l.type as location_type,
  p.stock_quantity
FROM products p
LEFT JOIN locations l ON p.location_id = l.id
ORDER BY l.name, p.name;

-- 4. Count products per location
SELECT 
  l.name as location_name,
  l.type as location_type,
  COUNT(p.id) as product_count
FROM locations l
LEFT JOIN products p ON l.id = p.location_id
GROUP BY l.id, l.name, l.type
ORDER BY l.type, l.name;

-- 5. Check if helper functions were created successfully
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('get_products_by_location', 'can_add_product_to_location')
ORDER BY routine_name;

-- Expected: 2 rows (both functions should exist)

-- 6. Test the get_products_by_location function (replace with your company_id)
-- SELECT * FROM get_products_by_location('your-company-id-here'::uuid);

-- 7. Check RLS policies on products table
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- Expected: 3 policies (view, create, update)
