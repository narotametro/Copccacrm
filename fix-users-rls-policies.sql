-- =====================================================
-- FIX USERS TABLE RLS POLICIES FOR SUBSCRIPTION GUARD
-- Allows authenticated users to read company-related columns
-- while protecting sensitive data
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;

-- Create new policy that allows authenticated users to read from users table
-- This is needed for SubscriptionGuard to check company ownership
CREATE POLICY "authenticated_users_can_read_users" ON users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Keep update restricted to own profile or admin
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Keep insert/delete admin-only
DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "admins_can_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "admins_can_delete_users" ON users
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Verify policies
DO $$
BEGIN
  RAISE NOTICE '✅ Users table RLS policies updated';
  RAISE NOTICE '   - Authenticated users can now SELECT from users table';
  RAISE NOTICE '   - Users can UPDATE own profile or admins can update any';
  RAISE NOTICE '   - Only admins can INSERT or DELETE users';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Current SELECT policies on users table:';
END $$;

-- Show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;
