-- =====================================================
-- 🔍 CHECK YOUR STOCK HISTORY TABLE SCHEMA
-- =====================================================
-- Run this to see what columns you actually have
-- =====================================================

SELECT 
  '📋 YOUR CURRENT STOCK_HISTORY COLUMNS:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stock_history'
ORDER BY ordinal_position;

-- =====================================================
-- Compare with what the code expects:
-- 
-- EXPECTED COLUMNS (from SalesHub.tsx):
-- - action (not change_type)
-- - stock_before (not quantity_before)
-- - stock_after (not quantity_after) 
-- - quantity (not quantity_change)
-- - created_by (not performed_by)
-- - location_id
-- - notes
-- - product_id
-- - purchase_cost_per_unit
-- - purchase_cost_total
-- - created_at
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  🔍 DIAGNOSIS COMPLETE                                          ║
╚══════════════════════════════════════════════════════════════════╝

📋 Check the columns listed above against what the code expects.

⚠️  COMMON ISSUES:

1. If you see "change_type" instead of "action"
   → Run FIX-STOCK-HISTORY-TO-MATCH-CODE.sql

2. If you see "quantity_before/quantity_after" 
   → Run FIX-STOCK-HISTORY-TO-MATCH-CODE.sql

3. If you see "performed_by" instead of "created_by"
   → Run FIX-STOCK-HISTORY-TO-MATCH-CODE.sql

4. If columns match but still get 400 errors
   → Run fix-stock-history-rls-policies.sql

✅  NEXT STEP: Run the appropriate fix script above
' as diagnosis;
