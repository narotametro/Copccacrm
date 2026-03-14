-- =====================================================
-- 🚀 ENABLE STOCK HISTORY TRACKING WITH PURCHASE COSTS
-- =====================================================
-- Run these steps IN ORDER to enable full tracking
-- =====================================================

-- STEP 1: Check your current schema first
-- Run: CHECK-YOUR-STOCK-HISTORY-SCHEMA.sql

-- STEP 2: Fix schema to match code (if needed)
-- Run: FIX-STOCK-HISTORY-TO-MATCH-CODE.sql

-- STEP 3: Add purchase cost columns (if not done yet)
-- Run: add-purchase-cost-to-stock-history.sql

-- STEP 4: Fix RLS policies
-- Run: fix-stock-history-rls-policies.sql

-- STEP 5: Verify everything works (AFTER running schema fix)
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
□ Schema matches code expectations (action, stock_before, stock_after)
□ RLS policies allow authenticated users to insert/select
□ No 400 errors when querying stock_history

STEPS TO ENABLE:

1️⃣  CHECK YOUR SCHEMA:
   ✓ Run CHECK-YOUR-STOCK-HISTORY-SCHEMA.sql
   ✓ Compare columns with what code expects
   ✓ Note any mismatches (change_type vs action, etc.)

2️⃣  FIX SCHEMA (if needed):
   ✓ Run FIX-STOCK-HISTORY-TO-MATCH-CODE.sql
   ✓ This renames columns to match code
   ✓ Adds any missing columns
   ✓ Creates performance indexes

3️⃣  ADD PURCHASE COST COLUMNS:
   ✓ Run add-purchase-cost-to-stock-history.sql
   ✓ Adds purchase_cost_per_unit
   ✓ Adds purchase_cost_total

4️⃣  FIX RLS POLICIES:
   ✓ Run fix-stock-history-rls-policies.sql
   ✓ Allows authenticated users full access
   ✓ Test query returns results without 400

5️⃣  VERIFY DATABASE:
   ✓ Run verification query (Step 5 above)
   ✓ Should show total_records and purchase costs
   ✓ No errors in Supabase console

6️⃣  UNCOMMENT CODE:
   ✓ In SalesHub.tsx, uncomment stock history insert (~line 4390)
   ✓ In InventoryStatusSection, enable stock_history query (~line 7175)
   ✓ Git commit and push changes

7️⃣  TEST:
   ✓ Restock a product with purchase cost
   ✓ Check console for "✅ Stock history recorded"
   ✓ Verify data in Supabase stock_history table
   ✓ Check Purchase Cost metric updates

⚠️  CURRENT STATUS: DISABLED
    Stock tracking is temporarily disabled to prevent 400 errors.
    Follow steps above to re-enable.

' as checklist;
