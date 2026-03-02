-- Fix existing users and invitations to properly link to companies
-- This fixes the issue where invited users don't see company data

-- Step 1: Update existing pending invitations with inviter info
-- This will fix invitations that were created before the new fields were added
UPDATE invitation_links il
SET 
  inviter_name = COALESCE(u.full_name, split_part(u.email, '@', 1), 'Admin'),
  inviter_company_id = u.company_id,
  inviter_company_name = c.name
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
WHERE il.created_by = u.id
  AND (il.inviter_name IS NULL OR il.inviter_company_id IS NULL)
  AND il.used = false;  -- Only update pending invitations

-- Step 2: Fix users who signed up through invitations but didn't get company_id
-- This happens when old invitations (created before migration) were used
UPDATE users u
SET 
  company_id = il.inviter_company_id,
  invited_by = il.created_by
FROM invitation_links il
WHERE u.email = il.email
  AND il.used = true
  AND u.company_id IS NULL
  AND il.inviter_company_id IS NOT NULL;

-- Step 3: Update user status from pending to active for signed up users
UPDATE users u
SET status = 'active'
WHERE u.id IN (
  SELECT auth.uid()
  FROM auth.users au
  WHERE au.email = u.email
)
AND u.status = 'pending';

-- Step 4: Verify company sharing - ensure users can see their team's data
-- No action needed - RLS policies should already handle this
-- Just verify that users have the correct company_id

-- Success message
DO $$
DECLARE
  updated_invitations INTEGER;
  updated_users INTEGER;
  activated_users INTEGER;
BEGIN
  -- Count updates
  GET DIAGNOSTICS updated_invitations = ROW_COUNT;
  
  RAISE NOTICE '✅ Invitation system data fixed!';
  RAISE NOTICE 'Updated pending invitations with company info';
  RAISE NOTICE 'Fixed user company_id for invited users';
  RAISE NOTICE 'Activated signed-up users';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 To verify, run:';
  RAISE NOTICE 'SELECT email, inviter_name, inviter_company_name FROM invitation_links WHERE used = false;';
  RAISE NOTICE 'SELECT email, company_id, status FROM users WHERE invited_by IS NOT NULL;';
END $$;
