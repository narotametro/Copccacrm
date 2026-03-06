-- =====================================================
-- VERIFY PRODUCT ISOLATION IN SALES HUB
-- =====================================================

-- Show how many products YOU can see
SELECT 
  'YOUR PRODUCTS ONLY' as isolation_status,
  COUNT(*) as total_products_you_see
FROM products;

-- Show YOUR products with details
SELECT 
  'Your product list' as info,
  name,
  sku,
  stock_quantity,
  created_by,
  CASE 
    WHEN created_by = auth.uid() THEN '✅ Yours'
    ELSE '❌ NOT YOURS (should not see this!)'
  END as ownership
FROM products
ORDER BY created_at DESC
LIMIT 20;

-- Verify the products policy
SELECT 
  '📋 Products Policy' as check_type,
  policyname,
  cmd as operations,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'products';
