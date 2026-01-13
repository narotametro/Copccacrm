-- Debug: Check current user's JWT and database records
-- Run this in Supabase SQL Editor to see what's happening
-- This will help diagnose why the RLS policy is blocking you

-- Check 1: View your JWT claims (role should be 'admin')
SELECT 
  auth.uid() as user_id,
  auth.jwt()->>'role' as jwt_role,
  auth.jwt()->>'email' as jwt_email,
  auth.role() as auth_role;

-- Check 2: View your auth.users record
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as metadata_role,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data
FROM auth.users
WHERE id = auth.uid();

-- Check 3: View your users table record
SELECT *
FROM users
WHERE id = auth.uid();

-- Check 4: Test if the RLS policy would allow you
SELECT 
  (auth.jwt()->>'role') = 'admin' as jwt_check_passes,
  auth.role() = 'service_role' as service_role_check_passes;
