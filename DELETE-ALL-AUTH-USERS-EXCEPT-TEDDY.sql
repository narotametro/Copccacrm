-- =====================================================
-- DELETE ALL AUTH USERS EXCEPT teddy@gmail.com
-- =====================================================
-- WARNING: This shows which auth users need manual deletion
-- Auth users can only be deleted via Supabase Dashboard
-- =====================================================

-- Show which auth users will be deleted
SELECT 
  '⚠️ THESE AUTH USERS NEED MANUAL DELETION' as warning,
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email != 'teddy@gmail.com'
ORDER BY created_at DESC;

-- Count of users to delete
SELECT 
  '📊 DELETION SUMMARY' as info,
  COUNT(*) as users_to_delete
FROM auth.users
WHERE email != 'teddy@gmail.com';

-- Show what will remain
SELECT 
  '✅ USER TO KEEP' as info,
  email,
  created_at
FROM auth.users
WHERE email = 'teddy@gmail.com';

-- =====================================================
-- MANUAL DELETION INSTRUCTIONS:
-- =====================================================
-- 1. Go to Supabase Dashboard
-- 2. Navigate to: Authentication → Users
-- 3. For EACH user listed above (except teddy@gmail.com):
--    - Click the ⋮ (three dots) menu
--    - Click "Delete user"
--    - Confirm deletion
-- 4. Repeat until only teddy@gmail.com remains
-- =====================================================

-- Note: If you have admin access, you can also delete via Supabase Management API
-- but that requires service_role key which should never be exposed in SQL scripts
