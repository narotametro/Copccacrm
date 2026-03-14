-- =====================================================
-- 🚀 ENABLE STOCK HISTORY TRACKING WITH PURCHASE COSTS
-- =====================================================
-- Run these steps IN ORDER to enable full tracking
-- =====================================================

-- STEP 1: Add purchase cost columns (if not done yet)
-- Run: add-purchase-cost-to-stock-history.sql

-- STEP 2: Fix RLS policies
-- Run: fix-stock-history-rls-policies.sql

-- STEP 3: Verify everything works
SELECT 
  '✅ VERIFICATION CHECK' as status,
  COUNT(*) as total_records,
  COUNT(purchase_cost_per_unit) as records_with_cost,
  SUM(purchase_cost_total) as total_purchase_cost
FROM stock_history
WHERE action = 'restock';

-- STEP 4: After running above scripts successfully:
-- 1. Go to src/pages/SalesHub.tsx
-- 2. Search for: "STOCK HISTORY INSERT - DISABLED"
-- 3. Uncomment the stock history insert code
-- 4. Search for: "stock_history disabled until DB setup"
-- 5. Replace with the async query version from git history

-- =====================================================
-- 📋 QUICK ENABLE CHECKLIST
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  📋 STOCK HISTORY TRACKING SETUP CHECKLIST                      ║
╚══════════════════════════════════════════════════════════════════╝

PREREQUISITES:
□ Database columns exist (purchase_cost_per_unit, purchase_cost_total)
□ RLS policies allow authenticated users to insert/select
□ No 400 errors when querying stock_history

STEPS TO ENABLE:

1️⃣  RUN SQL SCRIPTS:
   ✓ add-purchase-cost-to-stock-history.sql
   ✓ fix-stock-history-rls-policies.sql

2️⃣  VERIFY DATABASE:
   ✓ Run CHECK-STOCK-HISTORY-COLUMNS.sql
   ✓ Confirm no RLS blocking
   ✓ Test query returns results without 400 error

3️⃣  UNCOMMENT CODE:
   ✓ In SalesHub.tsx, uncomment stock history insert
   ✓ In InventoryStatusSection, enable stock_history query
   ✓ Git commit and push changes

4️⃣  TEST:
   ✓ Restock a product with purchase cost
   ✓ Check console for "✅ Stock history recorded"
   ✓ Verify data in Supabase stock_history table
   ✓ Check Purchase Cost metric updates

⚠️  CURRENT STATUS: DISABLED
    Stock tracking is temporarily disabled to prevent 400 errors.
    Follow steps above to re-enable.

' as checklist;
