-- =====================================================
-- 🔧 FIX RLS POLICIES FOR PURCHASE COST COLUMNS
-- =====================================================
-- Purpose: Update RLS policies to allow purchase_cost columns
-- Run this if you're getting 400 errors on stock_history
-- =====================================================

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stock_history;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON stock_history;
DROP POLICY IF EXISTS "Users can insert stock history" ON stock_history;
DROP POLICY IF EXISTS "Users can view stock history" ON stock_history;

-- Enable RLS on stock_history table
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Create new SELECT policy (allows reading all columns including purchase_cost)
CREATE POLICY "Users can view stock history"
ON stock_history
FOR SELECT
TO authenticated
USING (true);

-- Create new INSERT policy (allows inserting all columns including purchase_cost)
CREATE POLICY "Users can insert stock history"
ON stock_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create UPDATE policy (for future updates)
CREATE POLICY "Users can update stock history"
ON stock_history
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT 
  '✅ RLS POLICIES CREATED' as status,
  policyname,
  cmd as operation,
  permissive
FROM pg_policies
WHERE tablename = 'stock_history'
ORDER BY policyname;

-- =====================================================
-- ✅ SUCCESS MESSAGE
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  ✅ RLS POLICIES UPDATED                                        ║
╚══════════════════════════════════════════════════════════════════╝

🎯 WHAT CHANGED:

✅ Dropped old restrictive policies
✅ Created new SELECT policy (read access to all columns)
✅ Created new INSERT policy (write access including purchase_cost)
✅ Created new UPDATE policy (for future use)

📊 HOW IT WORKS:

- All authenticated users can:
  ✓ View all stock_history records (including purchase_cost)
  ✓ Insert new records with purchase_cost data
  ✓ Update existing records

🔍 NEXT STEPS:

1. Refresh your browser (Ctrl+F5)
2. Try restocking a product with purchase cost
3. Should work without 400 errors now

⚠️  Security Note:

These policies allow full access to authenticated users.
For production, you may want to add company_id filtering
to ensure users only see their own company data.

' as success_message;
