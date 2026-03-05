-- =====================================================
-- EMERGENCY FIX: Resolve all 406 and 409 errors
-- This will fix users table RLS and companies table issues
-- =====================================================

-- ===================
-- FIX 1: USERS TABLE 406 ERRORS
-- ===================
-- The issue: auth.role() = 'authenticated' doesn't work in Supabase RLS
-- Solution: Use auth.uid() IS NOT NULL instead

DROP POLICY IF EXISTS "authenticated_users_can_read_users" ON users;

CREATE POLICY "authenticated_users_can_read_users" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);  -- This checks if user is authenticated

-- ===================
-- FIX 2: COMPANIES TABLE 409 ERRORS
-- ===================
-- The 409 error suggests constraint violations
-- Let's check current policies and make them permissive

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Authenticated users can read companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON companies;
DROP POLICY IF EXISTS "Users can manage companies" ON companies;
DROP POLICY IF EXISTS "companies_select_all" ON companies;
DROP POLICY IF EXISTS "companies_insert_all" ON companies;
DROP POLICY IF EXISTS "companies_update_all" ON companies;
DROP POLICY IF EXISTS "companies_delete_admin" ON companies;

-- Create simple permissive policies for companies
CREATE POLICY "companies_select_all" ON companies
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "companies_insert_all" ON companies
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "companies_update_all" ON companies
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "companies_delete_admin" ON companies
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ===================
-- VERIFICATION
-- ===================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ EMERGENCY FIX APPLIED';
  RAISE NOTICE '===========================';
  RAISE NOTICE '';
  RAISE NOTICE '1. USERS TABLE:';
  RAISE NOTICE '   - Fixed SELECT policy to use auth.uid() IS NOT NULL';
  RAISE NOTICE '   - This properly checks authentication status';
  RAISE NOTICE '';
  RAISE NOTICE '2. COMPANIES TABLE:';
  RAISE NOTICE '   - All authenticated users can SELECT/INSERT/UPDATE';
  RAISE NOTICE '   - Only admins can DELETE';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Checking policies now...';
END $$;

-- Show current policies
SELECT '=== USERS POLICIES ===' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' ORDER BY cmd;

SELECT '=== COMPANIES POLICIES ===' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'companies' ORDER BY cmd;
