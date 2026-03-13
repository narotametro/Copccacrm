-- =====================================================
-- 🔍 CHECK STOCK DEDUCTION ISSUES
-- =====================================================
-- Why stock isn't decreasing after sales

-- STEP 1: Check if stock_history is recording sales
SELECT 
  '1️⃣ RECENT STOCK CHANGES FROM SALES' as check_name,
  COUNT(*) as total_sales_deductions,
  SUM(ABS(quantity_change)) as total_units_sold,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM stock_history
WHERE change_type = 'sale' OR action = 'pos_sale'
AND created_at >= NOW() - INTERVAL '7 days';

-- Show recent sales deductions
SELECT 
  sh.created_at,
  p.name as product_name,
  sh.quantity_change as units_sold,
  sh.quantity_before as stock_before,
  sh.quantity_after as stock_after,
  sh.reference_id as order_number
FROM stock_history sh
LEFT JOIN products p ON sh.product_id = p.id
WHERE (sh.change_type = 'sale' OR sh.action = 'pos_sale')
AND sh.created_at >= NOW() - INTERVAL '7 days'
ORDER BY sh.created_at DESC
LIMIT 10;

-- STEP 2: Check products table RLS policies
SELECT 
  '2️⃣ PRODUCTS TABLE RLS POLICIES' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'products';

-- STEP 3: Check if user has UPDATE permission on products
SELECT 
  '3️⃣ CHECK UPDATE PERMISSIONS' as check_name,
  has_table_privilege('products', 'UPDATE') as can_update_products,
  has_table_privilege('stock_history', 'INSERT') as can_insert_stock_history;

-- STEP 4: Compare orders vs stock changes
SELECT 
  '4️⃣ ORDERS VS STOCK CHANGES' as check_name,
  (SELECT COUNT(*) FROM sales_hub_orders WHERE created_at >= NOW() - INTERVAL '7 days') as orders_last_7_days,
  (SELECT COUNT(DISTINCT reference_id) FROM stock_history WHERE (change_type = 'sale' OR action = 'pos_sale') AND created_at >= NOW() - INTERVAL '7 days') as orders_with_stock_deduction,
  (SELECT COUNT(*) FROM sales_hub_orders WHERE created_at >= NOW() - INTERVAL '7 days') - 
  (SELECT COUNT(DISTINCT reference_id) FROM stock_history WHERE (change_type = 'sale' OR action = 'pos_sale') AND created_at >= NOW() - INTERVAL '7 days') as orders_missing_stock_deduction;

-- STEP 5: Show specific products that should have decreased stock
SELECT 
  '5️⃣ PRODUCTS IN RECENT ORDERS' as check_name,
  p.name as product_name,
  p.sku,
  p.stock_quantity as current_stock,
  COUNT(DISTINCT sho.id) as times_sold,
  'Stock should have decreased but maybe did not' as note
FROM sales_hub_orders sho,
     jsonb_array_elements(sho.items) as item
LEFT JOIN products p ON (item->>'product_id')::uuid = p.id
WHERE sho.created_at >= NOW() - INTERVAL '7 days'
GROUP BY p.id, p.name, p.sku, p.stock_quantity
ORDER BY times_sold DESC
LIMIT 10;

-- =====================================================
-- 📊 DIAGNOSIS
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  🔍 STOCK DEDUCTION DIAGNOSIS                                    ║
╚══════════════════════════════════════════════════════════════════╝

CHECK THE RESULTS ABOVE:

1️⃣ RECENT STOCK CHANGES FROM SALES:
   - If total_sales_deductions = 0: Stock deduction is NOT working
   - If > 0: Stock deduction IS working but UI may not refresh

2️⃣ PRODUCTS TABLE RLS POLICIES:
   - Check if UPDATE policy exists and allows authenticated users
   - If no policies or restrictive policies: RLS is blocking updates

3️⃣ CHECK UPDATE PERMISSIONS:
   - can_update_products should be TRUE
   - can_insert_stock_history should be TRUE
   - If FALSE: Permission issue

4️⃣ ORDERS VS STOCK CHANGES:
   - orders_missing_stock_deduction should be 0
   - If > 0: Some orders not deducting stock

5️⃣ PRODUCTS IN RECENT ORDERS:
   - Shows which products appear in orders
   - Compare current_stock with what it should be

═══════════════════════════════════════════════════════════════════

🎯 LIKELY CAUSES:

A) RLS POLICY ISSUE:
   - Products table has restrictive RLS
   - User cannot UPDATE products
   - Fix: Update RLS policies

B) CODE ERROR (Silent Failure):
   - Stock deduction code runs in background
   - Errors caught silently
   - Check browser console (F12) for errors

C) UI NOT REFRESHING:
   - Stock IS being deducted
   - But UI cache not updating
   - Fix: Hard refresh page (Ctrl+F5)

✅ NEXT STEPS:

1. Check "orders_missing_stock_deduction" number
2. If > 0: RLS or permission issue
3. If = 0: UI cache issue, refresh page
4. Check browser console (F12) during checkout for errors

' as diagnosis;
