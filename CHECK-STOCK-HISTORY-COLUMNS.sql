-- =====================================================
-- 🔍 CHECK STOCK HISTORY PURCHASE COST COLUMNS
-- =====================================================
-- Run this to verify the purchase cost columns exist
-- and check RLS policies
-- =====================================================

-- 1. Check if columns exist
SELECT 
  '📋 COLUMN CHECK' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stock_history'
  AND (column_name LIKE '%purchase_cost%' OR column_name IN ('action', 'quantity', 'stock_before', 'stock_after'))
ORDER BY ordinal_position;

-- 2. Check RLS policies on stock_history table
SELECT 
  '🔒 RLS POLICIES' as check_type,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'stock_history'
ORDER BY policyname;

-- 3. Check if RLS is enabled
SELECT 
  '🔐 RLS STATUS' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'stock_history';

-- 4. Test query that the frontend uses
SELECT 
  '📊 TEST QUERY' as check_type,
  COUNT(*) as total_records,
  COUNT(purchase_cost_per_unit) as records_with_cost
FROM stock_history
WHERE action = 'restock';

-- 5. Show sample data
SELECT 
  '📝 SAMPLE DATA' as check_type,
  id,
  product_id,
  action,
  quantity,
  stock_before,
  stock_after,
  purchase_cost_per_unit,
  purchase_cost_total,
  created_at
FROM stock_history
WHERE action = 'restock'
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 📝 INTERPRETATION
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  🔍 DIAGNOSTIC RESULTS                                          ║
╚══════════════════════════════════════════════════════════════════╝

✅ What to check:

1. COLUMN CHECK:
   - purchase_cost_per_unit should be numeric/decimal
   - purchase_cost_total should be numeric/decimal
   - Both should allow NULL values
   
2. RLS POLICIES:
   - Should have SELECT policy allowing authenticated users
   - Should have INSERT policy allowing authenticated users
   - Check if policies include purchase_cost columns
   
3. RLS STATUS:
   - rls_enabled should be true
   
4. TEST QUERY:
   - Should return count without error
   
5. SAMPLE DATA:
   - Check if purchase_cost values appear

⚠️  Common Issues:

- Columns missing → Run add-purchase-cost-to-stock-history.sql
- RLS blocking query → Add/update RLS policies
- No data → Haven''t restocked with costs yet

' as interpretation;
