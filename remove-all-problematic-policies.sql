-- Remove ALL remaining problematic policies that could cause recursion
-- Focus on the ones with subqueries or complex logic

DROP POLICY IF EXISTS "Users can view their own company users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- Keep only the essential safe policies
-- These should remain:
-- - Users can view their own profile (auth.uid() = id)
-- - Users can update their own profile (auth.uid() = id)
-- - Users can insert their own profile (auth.uid() = id)
-- - Admins can manage all users (JWT based)
-- - Authenticated users can read users (auth.role() = 'authenticated')