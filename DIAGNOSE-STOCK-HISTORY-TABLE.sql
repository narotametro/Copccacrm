-- =====================================================
-- 🔍 DIAGNOSE STOCK HISTORY TABLE
-- =====================================================
-- Run this to check if your stock_history table is ready
-- =====================================================

-- Check if stock_history table exists
SELECT 
  '📊 TABLE EXISTS' as status,
  tablename as table_name
FROM pg_tables
WHERE tablename = 'stock_history' AND schemaname = 'public';

-- Check ALL columns in stock_history table
SELECT 
  '📋 TABLE COLUMNS' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stock_history'
ORDER BY ordinal_position;

-- Check specifically for purchase_cost columns
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock_history' 
      AND column_name = 'purchase_cost_per_unit'
    ) THEN '✅ purchase_cost_per_unit column EXISTS'
    ELSE '❌ purchase_cost_per_unit column MISSING - Run add-purchase-cost-to-stock-history.sql'
  END as purchase_cost_per_unit_status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock_history' 
      AND column_name = 'purchase_cost_total'
    ) THEN '✅ purchase_cost_total column EXISTS'
    ELSE '❌ purchase_cost_total column MISSING - Run add-purchase-cost-to-stock-history.sql'
  END as purchase_cost_total_status;

-- Check for correct field names (action vs change_type, stock_before vs quantity_before)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock_history' 
      AND column_name = 'action'
    ) THEN '✅ "action" column EXISTS (correct)'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock_history' 
      AND column_name = 'change_type'
    ) THEN '⚠️ "change_type" column found - should be "action"'
    ELSE '❌ Neither "action" nor "change_type" column found'
  END as action_column_status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock_history' 
      AND column_name = 'stock_before'
    ) THEN '✅ "stock_before" column EXISTS (correct)'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock_history' 
      AND column_name = 'quantity_before'
    ) THEN '⚠️ "quantity_before" column found - should be "stock_before"'
    ELSE '❌ Neither "stock_before" nor "quantity_before" column found'
  END as stock_before_column_status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock_history' 
      AND column_name = 'stock_after'
    ) THEN '✅ "stock_after" column EXISTS (correct)'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock_history' 
      AND column_name = 'quantity_after'
    ) THEN '⚠️ "quantity_after" column found - should be "stock_after"'
    ELSE '❌ Neither "stock_after" nor "quantity_after" column found'
  END as stock_after_column_status;

-- =====================================================
-- 📝 INTERPRETATION
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  🔍 STOCK HISTORY TABLE DIAGNOSIS                               ║
╚══════════════════════════════════════════════════════════════════╝

📊 RUN THIS FILE TO CHECK YOUR TABLE STATUS

✅ If you see all green checkmarks:
   Your table is ready to use with purchase cost tracking

❌ If you see red X marks for purchase_cost columns:
   Run: add-purchase-cost-to-stock-history.sql

⚠️  If you see mismatched column names:
   Your database schema is outdated
   Contact support for migration script

🔍 NEXT STEP:
   Check the results above and follow the instructions

' as interpretation;
