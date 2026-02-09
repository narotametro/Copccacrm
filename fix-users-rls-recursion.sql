-- Fix infinite recursion in RLS policies for users table
-- Remove problematic policies that reference the users table

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users (jwt)" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON users;

-- Create proper policies that don't cause recursion
-- Use JWT claims for role-based access
CREATE POLICY "Users can view their own profile" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin policy using JWT metadata (safer)
CREATE POLICY "Admins can manage all users" ON users
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);