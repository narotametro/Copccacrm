-- =====================================================
-- CREATE USER: teddy@gmail.com
-- =====================================================
-- This creates the account directly in the database
-- Password: 198916Ahib@
-- =====================================================

-- Note: You need to run this in Supabase Dashboard with Service Role
-- Or go to: Authentication → Users → "Add User" manually

-- If this fails, use Supabase Dashboard Authentication section instead:
-- 1. Go to Authentication → Users
-- 2. Click "Add user"
-- 3. Email: teddy@gmail.com
-- 4. Password: 198916Ahib@
-- 5. Check "Auto Confirm User"
-- 6. Click "Create user"

SELECT 'To create teddy@gmail.com account:' as instruction,
       '1. Go to Supabase Dashboard → Authentication → Users' as step_1,
       '2. Click "Add user" button' as step_2,
       '3. Email: teddy@gmail.com' as step_3,
       '4. Password: 198916Ahib@' as step_4,
       '5. Check "Auto Confirm User" checkbox' as step_5,
       '6. Click "Create user"' as step_6;
