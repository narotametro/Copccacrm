-- =====================================================
-- FIX HOFFMAN STATUS TO ACTIVE
-- =====================================================
-- Check and fix Hoffman's user status + mark invitations as used
-- =====================================================

-- Step 1: Check current status of Hoffman in users table
SELECT 
  id,
  full_name,
  email,
  status,
  role,
  company_id,
  invited_by,
  is_company_owner,
  created_at
FROM users
WHERE email = 'hoffman@gmail.com';

-- Step 2: Update Hoffman's status to ACTIVE
UPDATE users
SET status = 'active'
WHERE email = 'hoffman@gmail.com'
  AND status != 'active';

-- Step 3: Mark all invitations for Hoffman as USED
UPDATE invitation_links
SET 
  used = true,
  used_at = COALESCE(used_at, NOW())
WHERE email = 'hoffman@gmail.com'
  AND used = false;

-- Step 4: Verify the fix
SELECT 
  '✅ USER STATUS CHECK' as check_type,
  u.email,
  u.full_name,
  u.status as current_status,
  u.role,
  u.company_id,
  CASE 
    WHEN u.status = 'active' THEN '✅ Status is ACTIVE'
    ELSE '⚠️ Status is ' || u.status
  END as status_check
FROM users u
WHERE u.email = 'hoffman@gmail.com';

-- Step 5: Verify invitation cleanup
SELECT 
  '✅ INVITATION STATUS CHECK' as check_type,
  email,
  COUNT(*) as total_invitations,
  SUM(CASE WHEN used = true THEN 1 ELSE 0 END) as used_invitations,
  SUM(CASE WHEN used = false THEN 1 ELSE 0 END) as pending_invitations,
  CASE 
    WHEN SUM(CASE WHEN used = false THEN 1 ELSE 0 END) = 0 THEN '✅ All invitations marked as used'
    ELSE '⚠️ ' || SUM(CASE WHEN used = false THEN 1 ELSE 0 END)::text || ' pending invitations still exist'
  END as cleanup_status
FROM invitation_links
WHERE email = 'hoffman@gmail.com'
GROUP BY email;

-- Step 6: List all users in Hoffman's company for verification
SELECT 
  '✅ COMPANY USERS' as check_type,
  u.full_name,
  u.email,
  u.status,
  u.role,
  CASE WHEN u.is_company_owner THEN '👑 Owner' ELSE '👤 Team Member' END as user_type
FROM users u
WHERE u.company_id = (
  SELECT company_id FROM users WHERE email = 'hoffman@gmail.com' LIMIT 1
)
ORDER BY u.is_company_owner DESC, u.created_at;
