-- =====================================================
-- CLEAN UP DEBTS TABLE RLS POLICIES
-- Remove old conflicting policies
-- =====================================================

-- Drop all old restrictive policies that check company_id
DROP POLICY IF EXISTS "Users can insert own company debts" ON debts;
DROP POLICY IF EXISTS "Users can update own company debts" ON debts;
DROP POLICY IF EXISTS "Users can view own company debts" ON debts;

-- Keep only the simple created_by policies (already created):
-- ✓ Users can view their debts (SELECT, created_by = auth.uid())
-- ✓ Users can create debts (INSERT, created_by = auth.uid())
-- ✓ Users can update their debts (UPDATE, created_by = auth.uid())
-- ✓ Users can delete their debts (DELETE, created_by = auth.uid())
-- ✓ Admins can delete debts (DELETE, admin check)

-- Verify final policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'debts'
ORDER BY policyname;
