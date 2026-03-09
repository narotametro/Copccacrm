-- =====================================================
-- CLEANUP DUPLICATE INVITATIONS
-- =====================================================
-- Remove duplicate invitation records and mark accepted invitations as used
-- Run this script in Supabase SQL Editor to clean up your database
-- =====================================================

-- Step 1: Mark all invitations as "used" where the email exists in users table
-- (These were accepted but not marked as used for some reason)
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

-- Step 2: Find and display duplicate invitation records (same email, multiple invitations)
-- This query shows you which emails have multiple invitation records
SELECT 
  email,
  COUNT(*) as invitation_count,
  STRING_AGG(id::text, ', ') as invitation_ids
FROM invitation_links
WHERE used = false
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY invitation_count DESC;

-- Step 3: Keep only the most recent invitation for each email
-- Delete older duplicate invitations (keeps the newest one)
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

-- Step 4: Verify cleanup - show remaining pending invitations
-- Should show each email only once
SELECT 
  id,
  email,
  role,
  created_at,
  expires_at,
  used,
  created_by
FROM invitation_links
WHERE used = false
ORDER BY created_at DESC;

-- Step 5: Final verification - check for any duplicates
SELECT 
  '✅ CLEANUP COMPLETE' as status,
  COUNT(*) as total_pending_invitations,
  COUNT(DISTINCT email) as unique_emails,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT email) THEN '✅ No duplicates found'
    ELSE '⚠️ Duplicates still exist - review Step 2 output'
  END as duplicate_check
FROM invitation_links
WHERE used = false;
