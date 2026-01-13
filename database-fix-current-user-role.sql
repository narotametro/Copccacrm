-- Fix all existing users' roles in JWT
-- This updates auth.users table to add role='admin' to all users that don't have a role yet
-- Run this in Supabase SQL Editor

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE raw_user_meta_data->>'role' IS NULL;

-- Verify the update
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users;
