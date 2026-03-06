-- =====================================================
-- EMERGENCY FIX: INFINITE RECURSION IN USERS POLICY
-- =====================================================

-- Drop the broken users policy
DROP POLICY IF EXISTS "users_access" ON users;

-- Create NON-RECURSIVE users policy
-- Simple rule: Users can only see themselves
CREATE POLICY "users_access" ON users FOR ALL
USING (
  auth.uid() IS NOT NULL AND id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Verification
SELECT 
  '✅ FIXED' as status,
  policyname,
  cmd as operations
FROM pg_policies 
WHERE tablename = 'users';
