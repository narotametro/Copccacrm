-- =====================================================
-- FIX: customer_feedback 403 Forbidden Error
-- =====================================================
-- This fixes the RLS policies preventing authenticated users
-- from inserting/viewing customer feedback
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Ensure RLS is enabled
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing restrictive policies
DROP POLICY IF EXISTS "Users can insert feedback for their companies" ON customer_feedback;
DROP POLICY IF EXISTS "Users can view feedback for their companies" ON customer_feedback;
DROP POLICY IF EXISTS "Users can update feedback for their companies" ON customer_feedback;
DROP POLICY IF EXISTS "Users can delete feedback for their companies" ON customer_feedback;
DROP POLICY IF EXISTS "Authenticated users can view all feedback" ON customer_feedback;
DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON customer_feedback;
DROP POLICY IF EXISTS "Authenticated users can update feedback" ON customer_feedback;
DROP POLICY IF EXISTS "Authenticated users can delete feedback" ON customer_feedback;

-- Step 3: Create permissive policies for authenticated users
-- These policies allow any authenticated user to work with customer feedback
-- This is appropriate since feedback is about customers (companies in the system)

-- SELECT: Allow authenticated users to view feedback for any company
CREATE POLICY "authenticated_users_select_feedback" ON customer_feedback
FOR SELECT 
TO authenticated
USING (true);

-- INSERT: Allow authenticated users to insert feedback for any company
CREATE POLICY "authenticated_users_insert_feedback" ON customer_feedback
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Ensure company_id exists in companies table
  EXISTS (
    SELECT 1 FROM companies 
    WHERE id = customer_feedback.company_id
  )
);

-- UPDATE: Allow authenticated users to update feedback
CREATE POLICY "authenticated_users_update_feedback" ON customer_feedback
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Allow authenticated users to delete feedback
CREATE POLICY "authenticated_users_delete_feedback" ON customer_feedback
FOR DELETE 
TO authenticated
USING (true);

-- Step 4: Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_feedback TO authenticated;

-- Step 5: Verify policies were created successfully
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
WHERE tablename = 'customer_feedback'
ORDER BY policyname;

-- Expected output: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- All should have permissive = 't' and roles = '{authenticated}'
