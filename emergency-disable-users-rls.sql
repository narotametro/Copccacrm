-- Emergency fix: Temporarily disable RLS on users table
-- This will allow the app to work while we debug the policy issues

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable with a simple permissive policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emergency_users_access" ON users;
CREATE POLICY "emergency_users_access" ON users FOR ALL USING (auth.role() = 'authenticated');