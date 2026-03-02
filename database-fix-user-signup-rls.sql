-- FIX: Allow users to create their own profile after signup
-- CRITICAL BUG: Current RLS policy blocks invited users from creating their user record
-- This causes users to exist in auth.users but NOT in the users table

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert any user" ON users;

-- Add policy that allows users to insert their OWN profile
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Re-add admin policy for managing ALL users
CREATE POLICY "Admins can insert any user" ON users
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
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
WHERE tablename = 'users'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ User signup RLS policy fixed!';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 What was changed:';
  RAISE NOTICE '1. Removed admin-only INSERT restriction';
  RAISE NOTICE '2. Added policy: Users can insert their own profile';
  RAISE NOTICE '3. Added policy: Admins can insert any user';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Impact:';
  RAISE NOTICE '✅ New invited users can now create their user record';
  RAISE NOTICE '✅ Invitation signup will work correctly';
  RAISE NOTICE '✅ Fixes the root cause permanently';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Still need to run database-fix-drake-account.sql to fix Drake';
END $$;
