-- =====================================================
-- CLEANUP: Remove all duplicate/old policies on users table
-- Keep only the clean new policies
-- =====================================================

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert any user" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Now recreate ONLY the clean policies we need

-- SELECT: All authenticated users can read users table (needed for subscription/company checks)
CREATE POLICY "authenticated_users_can_read_users" ON users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- UPDATE: Users can update own profile, admins can update any
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: Only admins can insert users
CREATE POLICY "admins_can_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE: Only admins can delete users
CREATE POLICY "admins_can_delete_users" ON users
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Verify the cleanup
DO $$
BEGIN
  RAISE NOTICE '✅ Users table RLS policies cleaned up';
  RAISE NOTICE '   - Removed all duplicate/old policies';
  RAISE NOTICE '   - 4 clean policies now active:';
  RAISE NOTICE '     1. SELECT: authenticated users can read';
  RAISE NOTICE '     2. UPDATE: own profile or admin';
  RAISE NOTICE '     3. INSERT: admin only';
  RAISE NOTICE '     4. DELETE: admin only';
END $$;

-- Show final policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;
