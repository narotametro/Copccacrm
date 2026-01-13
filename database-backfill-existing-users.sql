-- Backfill users table for existing auth users
-- Creates users table rows for any auth.users that don't have a matching users row
-- Run this in Supabase SQL Editor

INSERT INTO users (id, email, full_name, role, status)
SELECT 
  auth.users.id,
  auth.users.email,
  COALESCE(auth.users.raw_user_meta_data->>'full_name', split_part(auth.users.email, '@', 1)),
  COALESCE(auth.users.raw_user_meta_data->>'role', 'admin'),
  'active'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE users.id = auth.users.id
);

-- Verify all auth users now have users table rows
SELECT 
  au.email,
  u.full_name,
  u.role,
  u.status
FROM auth.users au
LEFT JOIN users u ON u.id = au.id;
