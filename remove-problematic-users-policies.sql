-- Remove problematic RLS policies causing infinite recursion
-- These policies query the users table from within policies on users

DROP POLICY IF EXISTS "Admins can manage their company users" ON users;
DROP POLICY IF EXISTS "Users access policy" ON users;

-- Keep only the safe policies:
-- - Users can view their own profile
-- - Users can update their own profile
-- - Users can insert their own profile
-- - Admins can manage all users (using JWT)
-- - Authenticated users can read users (simple auth check)