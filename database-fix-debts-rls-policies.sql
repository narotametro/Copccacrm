-- =====================================================
-- FIX DEBTS TABLE RLS POLICIES
-- Allows users to create debt records for any customer
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can access debts from their company" ON debts;

-- Create separate policies for different operations
-- SELECT: Users can view debts they created or from their company
CREATE POLICY "Users can view their debts" ON debts FOR SELECT USING (
  created_by = auth.uid()
);

-- INSERT: Users can create debt records for any customer
CREATE POLICY "Users can create debts" ON debts FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

-- UPDATE: Users can update debts they created
CREATE POLICY "Users can update their debts" ON debts FOR UPDATE USING (
  created_by = auth.uid()
) WITH CHECK (
  created_by = auth.uid()
);

-- DELETE: Users can delete debts they created
CREATE POLICY "Users can delete their debts" ON debts FOR DELETE USING (
  created_by = auth.uid()
);

-- Verify policies
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
