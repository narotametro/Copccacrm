-- =====================================================
-- CHECK USER: teddy@gmail.com
-- =====================================================

-- Check if user exists in auth.users
SELECT 
  '🔍 AUTH.USERS' as check_type,
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at,
  banned_until,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email not confirmed'
    WHEN banned_until IS NOT NULL THEN '❌ User is banned'
    ELSE '✅ Auth status OK'
  END as status
FROM auth.users
WHERE email = 'teddy@gmail.com';

-- Check if user exists in public.users
SELECT 
  '🔍 PUBLIC.USERS' as check_type,
  id,
  email,
  full_name,
  role,
  company_id,
  is_company_owner,
  created_at,
  CASE 
    WHEN role IS NULL THEN '⚠️  No role assigned'
    WHEN company_id IS NULL THEN '⚠️  No company_id'
    ELSE '✅ Profile OK'
  END as status
FROM users
WHERE email = 'teddy@gmail.com';

-- Check RLS policies on users table
SELECT 
  '📋 USERS TABLE POLICIES' as check_type,
  policyname,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- Test if we can see the user (this query itself uses RLS)
-- If this returns no rows but auth.users shows the user, RLS is blocking access
SELECT 
  '🧪 RLS TEST' as check_type,
  COUNT(*) as visible_users_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ RLS blocking all users'
    ELSE '✅ RLS allows access'
  END as rls_status
FROM users;
