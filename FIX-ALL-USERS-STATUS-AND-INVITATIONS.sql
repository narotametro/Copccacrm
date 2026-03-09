-- =====================================================
-- COMPREHENSIVE FIX: ALL USERS STATUS AND INVITATIONS
-- =====================================================
-- This script fixes ALL users in the system:
-- 1. Sets status to 'active' for all users who have signed up
-- 2. Marks ALL invitations as 'used' where user exists
-- 3. Removes duplicate pending invitations (keeps most recent)
-- 4. Verifies cleanup across entire system
-- =====================================================

-- ======================================
-- SECTION 1: FIX ALL USER STATUSES
-- ======================================

-- Step 1.1: Check current user statuses BEFORE fix
SELECT 
  '📊 CURRENT USER STATUSES (BEFORE FIX)' as report,
  status,
  COUNT(*) as user_count,
  STRING_AGG(email, ', ') as emails
FROM users
GROUP BY status
ORDER BY status;

-- Step 1.2: Update ALL users to 'active' status
-- (They've already signed up and have accounts, so they should be active)
UPDATE users
SET status = 'active'
WHERE status != 'active';

-- Step 1.3: Verify user statuses AFTER fix
SELECT 
  '✅ USER STATUSES (AFTER FIX)' as report,
  status,
  COUNT(*) as user_count,
  STRING_AGG(email, ', ') as emails
FROM users
GROUP BY status
ORDER BY status;

-- ======================================
-- SECTION 2: FIX ALL INVITATION RECORDS
-- ======================================

-- Step 2.1: Check invitations BEFORE cleanup
SELECT 
  '📊 INVITATION STATUS (BEFORE CLEANUP)' as report,
  COUNT(*) as total_invitations,
  SUM(CASE WHEN used = true THEN 1 ELSE 0 END) as used_invitations,
  SUM(CASE WHEN used = false THEN 1 ELSE 0 END) as pending_invitations
FROM invitation_links;

-- Step 2.2: Mark ALL invitations as 'used = true' where the email exists in users table
-- (These users have accepted their invitations but records weren't updated)
UPDATE invitation_links
SET 
  used = true,
  used_at = COALESCE(used_at, NOW())
WHERE 
  used = false
  AND email IN (
    SELECT DISTINCT email 
    FROM users
  );

-- Step 2.3: Show affected invitations
SELECT 
  '✅ INVITATIONS MARKED AS USED' as report,
  email,
  role,
  created_at,
  expires_at
FROM invitation_links
WHERE used = true
  AND email IN (SELECT email FROM users)
ORDER BY email;

-- ======================================
-- SECTION 3: REMOVE DUPLICATE INVITATIONS
-- ======================================

-- Step 3.1: Find duplicate invitations BEFORE cleanup
SELECT 
  '📊 DUPLICATE INVITATIONS (BEFORE CLEANUP)' as report,
  email,
  COUNT(*) as invitation_count,
  STRING_AGG(id::text, ', ') as invitation_ids
FROM invitation_links
WHERE used = false
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY invitation_count DESC;

-- Step 3.2: Keep only the most recent invitation for each email
-- Delete older duplicate invitations
WITH ranked_invitations AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM invitation_links
  WHERE used = false
)
DELETE FROM invitation_links
WHERE id IN (
  SELECT id 
  FROM ranked_invitations 
  WHERE rn > 1
);

-- Step 3.3: Verify no duplicates remain
SELECT 
  '✅ DUPLICATE CHECK (AFTER CLEANUP)' as report,
  email,
  COUNT(*) as invitation_count
FROM invitation_links
WHERE used = false
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY invitation_count DESC;

-- ======================================
-- SECTION 4: COMPREHENSIVE VERIFICATION
-- ======================================

-- Step 4.1: List ALL users with their current status
SELECT 
  '✅ ALL USERS - FINAL STATUS' as report,
  u.full_name,
  u.email,
  u.status,
  u.role,
  u.company_id,
  CASE 
    WHEN u.is_company_owner THEN '👑 Company Owner' 
    WHEN u.invited_by IS NOT NULL THEN '👤 Team Member (Invited)'
    ELSE '👤 User'
  END as user_type,
  u.created_at::date as signup_date
FROM users u
ORDER BY u.company_id, u.is_company_owner DESC, u.created_at;

-- Step 4.2: List remaining pending invitations (should be only un-accepted ones)
SELECT 
  '✅ PENDING INVITATIONS - FINAL STATUS' as report,
  email,
  role,
  created_at::date as invited_date,
  expires_at::date as expires_date,
  CASE 
    WHEN expires_at < NOW() THEN '⚠️ EXPIRED'
    ELSE '⏳ ACTIVE'
  END as invitation_status
FROM invitation_links
WHERE used = false
ORDER BY created_at DESC;

-- Step 4.3: Final summary report
SELECT 
  '📊 FINAL SYSTEM SUMMARY' as report,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
  (SELECT COUNT(*) FROM users WHERE status != 'active') as non_active_users,
  (SELECT COUNT(*) FROM invitation_links WHERE used = true) as used_invitations,
  (SELECT COUNT(*) FROM invitation_links WHERE used = false) as pending_invitations,
  (SELECT COUNT(*) FROM invitation_links WHERE used = false AND expires_at < NOW()) as expired_invitations;

-- Step 4.4: Check for any remaining issues
SELECT 
  '✅ VALIDATION CHECK' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM users WHERE status != 'active') = 0 
    THEN '✅ All users have ACTIVE status'
    ELSE '⚠️ ' || (SELECT COUNT(*) FROM users WHERE status != 'active')::text || ' users still have non-active status'
  END as user_status_check,
  CASE 
    WHEN (SELECT COUNT(*) 
          FROM invitation_links 
          WHERE used = false 
            AND email IN (SELECT email FROM users)) = 0
    THEN '✅ All accepted invitations marked as used'
    ELSE '⚠️ ' || (SELECT COUNT(*) 
                    FROM invitation_links 
                    WHERE used = false 
                      AND email IN (SELECT email FROM users))::text || ' accepted invitations not marked as used'
  END as invitation_cleanup_check,
  CASE 
    WHEN (SELECT COUNT(*) 
          FROM (
            SELECT email, COUNT(*) as cnt 
            FROM invitation_links 
            WHERE used = false 
            GROUP BY email 
            HAVING COUNT(*) > 1
          ) duplicates) = 0
    THEN '✅ No duplicate invitations found'
    ELSE '⚠️ ' || (SELECT COUNT(*) 
                    FROM (
                      SELECT email, COUNT(*) as cnt 
                      FROM invitation_links 
                      WHERE used = false 
                      GROUP BY email 
                      HAVING COUNT(*) > 1
                    ) duplicates)::text || ' emails still have duplicate invitations'
  END as duplicate_check;

-- =====================================================
-- ✅ SCRIPT COMPLETE
-- =====================================================
-- All users should now be:
-- 1. Status = 'active' (if they've signed up)
-- 2. Their invitations marked as 'used = true'
-- 3. No duplicate pending invitations
-- 4. Ready to appear in admin panel and team member filters
-- =====================================================
