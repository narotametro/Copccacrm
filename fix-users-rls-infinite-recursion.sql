-- =====================================================
-- FIX: Infinite Recursion in users table RLS policies
-- =====================================================
-- The "Admins can manage all users" policy causes infinite recursion
-- by querying the users table from within a users table policy check

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Recreate with auth.jwt() instead of querying users table
-- This reads the role from the JWT token metadata, not from the database
CREATE POLICY "Admins can manage all users" ON users
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role'::text) = 'admin'::text 
  OR auth.uid() = id
)
WITH CHECK (
  (auth.jwt() ->> 'role'::text) = 'admin'::text 
  OR auth.uid() = id
);

-- Note: This assumes the role is stored in the JWT token's claims
-- If not, we need to use a different approach (like user metadata table)
