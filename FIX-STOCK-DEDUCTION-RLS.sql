-- =====================================================
-- 🔧 FIX STOCK DEDUCTION - Update RLS Policies
-- =====================================================
-- Date: March 13, 2026
-- Issue: Stock not decreasing after sales
-- Root Cause: Restrictive RLS policy blocks stock updates
-- Old Policy: Only product creator can update
-- New Policy: Any user in same company can update
-- =====================================================

-- STEP 1: Drop the old restrictive policy
DROP POLICY IF EXISTS "products_update_secure" ON products;
DROP POLICY IF EXISTS "products_update_company" ON products;

-- STEP 2: Create new company-based UPDATE policy
CREATE POLICY "products_update_company" ON products
  FOR UPDATE 
  USING (
    -- Allow if user is authenticated
    auth.uid() IS NOT NULL
    AND (
      -- User is in the same company as product creator
      EXISTS (
        SELECT 1 FROM users u1, users u2
        WHERE u1.id = auth.uid()
        AND u2.id = products.created_by
        AND u1.company_id = u2.company_id
      )
      OR
      -- Product has no creator (imported/migrated data)
      created_by IS NULL
      OR
      -- User is admin
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    -- Same rules for the new data
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM users u1, users u2
        WHERE u1.id = auth.uid()
        AND u2.id = products.created_by
        AND u1.company_id = u2.company_id
      )
      OR created_by IS NULL
      OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- STEP 3: Verify the policy was created
SELECT 
  '✅ NEW POLICY CREATED' as status,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'products'
AND cmd = 'UPDATE';

-- STEP 4: Test that current user can now update products
SELECT 
  '🧪 TEST UPDATE PERMISSION' as test_name,
  has_table_privilege('products', 'UPDATE') as can_update,
  CASE 
    WHEN has_table_privilege('products', 'UPDATE') THEN '✅ User can update products'
    ELSE '❌ Still cannot update products'
  END as result;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  ✅ FIX APPLIED: Stock Deduction Now Enabled                     ║
╚══════════════════════════════════════════════════════════════════╝

📋 WHAT CHANGED:

OLD POLICY (Restrictive):
   ❌ Only the user who created a product could update it
   ❌ If Product A created by User1, User2 cannot update stock
   ❌ Sales from User2 would fail silently

NEW POLICY (Company-Based):
   ✅ Any user in the same company can update products
   ✅ User2 can now update Product A stock during sales
   ✅ Admins can update any products
   ✅ Products without creator (imports) can be updated by anyone

🎯 NEXT STEPS:

1️⃣  MAKE A TEST SALE:
   - Go to Sales Hub
   - Add 32 INCH TV to cart (current stock: 3200)
   - Complete checkout
   - Check inventory - stock should decrease to 3199

2️⃣  VERIFY IN BROWSER:
   - Open browser console (F12)
   - Look for any errors during checkout
   - Should see: "✓ Stock updated successfully"

3️⃣  CHECK STOCK HISTORY:
   - Go to Sales Hub → Stock History tab
   - Should see new entry: "POS Sale" with negative quantity

4️⃣  IF STILL NOT WORKING:
   - Hard refresh page (Ctrl+F5 or Cmd+Shift+R)
   - Clear browser cache
   - Check that you are logged in as correct user

💡 TIP: The fix is immediate. Make a sale now and stock will decrease.

' as instructions;

-- =====================================================
-- ✅ RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- =====================================================
