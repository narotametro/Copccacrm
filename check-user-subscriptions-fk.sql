-- =====================================================
-- CHECK AND FIX user_subscriptions FOREIGN KEY
-- =====================================================

-- 1. Check current foreign key constraint
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='user_subscriptions'
  AND kcu.column_name = 'user_id';

-- 2. Check if current user exists in auth.users
SELECT 'Checking auth.users table...' as info;
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- 3. Check user_subscriptions structure
SELECT 'Checking user_subscriptions structure...' as info;
\d user_subscriptions
