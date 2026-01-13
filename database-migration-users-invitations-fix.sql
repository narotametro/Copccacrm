-- Migration: Fix users policy recursion
-- Purpose: replace recursive admin policy on users with JWT-claim based policy to avoid infinite recursion errors.
-- Run in Supabase SQL editor.

-- Drop the recursive policy and recreate using JWT role claim
-- Drop both old and new policy names to make this migration idempotent
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users (jwt)" ON users;

CREATE POLICY "Admins can manage all users (jwt)" ON users
  FOR ALL
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin' OR auth.role() = 'service_role')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin' OR auth.role() = 'service_role');

-- Fix invitation_links policy to use JWT instead of users table lookup
-- Drop both old and new policy names to make this migration idempotent
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitation_links;
DROP POLICY IF EXISTS "Admins can manage invitations (jwt)" ON invitation_links;

CREATE POLICY "Admins can manage invitations (jwt)" ON invitation_links
  FOR ALL
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin' OR auth.role() = 'service_role')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin' OR auth.role() = 'service_role');
