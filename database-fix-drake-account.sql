-- Manual fix for Drake's account
-- Drake exists in auth.users but not in users table
-- This inserts his user record with proper company linkage

-- Drop ALL problematic triggers and functions that reference non-existent subscriptions table
DROP TRIGGER IF EXISTS assign_inviter_subscription ON users;
DROP TRIGGER IF EXISTS assign_inviter_subscription_trigger ON users;
DROP TRIGGER IF EXISTS assign_start_plan_trigger ON users;
DROP TRIGGER IF EXISTS assign_start_plan ON users;
DROP FUNCTION IF EXISTS assign_inviter_subscription_to_user() CASCADE;
DROP FUNCTION IF EXISTS assign_start_plan_to_new_user() CASCADE;

-- Step 1: Insert Drake into users table with correct company_id
INSERT INTO users (
  id,
  email,
  company_id,
  full_name,
  role,
  status,
  invited_by,
  is_company_owner,
  created_at,
  updated_at
)
VALUES (
  '09c1068b-0c23-4dac-b554-6e6e4f8f1143',  -- Drake's auth.users ID
  'drake@gmail.com',
  '53911317-6a31-4b7e-a98f-92e085a47180',  -- DONADS company_id (from Teddy)
  'Drake',  -- Can be updated by user later
  'user',  -- Default role, adjust if needed
  'active',
  'f3992c78-0635-46fb-9c17-1bcfe7077ede',  -- Teddy's user ID
  false,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  company_id = EXCLUDED.company_id,
  invited_by = EXCLUDED.invited_by,
  status = 'active',
  updated_at = NOW();

-- Note: The assign_inviter_subscription trigger was dropped because it references
-- a non-existent 'subscriptions' table. If you need this trigger, fix the table first.

-- Step 2: Mark invitation as used
UPDATE invitation_links
SET 
  used = true,
  used_at = NOW()
WHERE email = 'drake@gmail.com'
  AND used = false;

-- Step 3: Verify the fix
SELECT 
  'Drake User Record' as check_type,
  id, 
  email, 
  company_id, 
  status, 
  invited_by,
  is_company_owner
FROM users 
WHERE email = 'drake@gmail.com';

-- Step 4: Verify invitation is marked as used
SELECT 
  'Invitation Status' as check_type,
  email, 
  used, 
  used_at,
  inviter_company_name
FROM invitation_links 
WHERE email = 'drake@gmail.com';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Drake account fixed!';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 What was done:';
  RAISE NOTICE '1. Created Drake user record in users table';
  RAISE NOTICE '2. Linked Drake to DONADS company (same as Teddy)';
  RAISE NOTICE '3. Set status to active';
  RAISE NOTICE '4. Marked invitation as used';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Have Drake log out completely';
  RAISE NOTICE '2. Drake should log back in';
  RAISE NOTICE '3. Drake should now see "DONADS" in navbar';
  RAISE NOTICE '4. Drake should see all team data (customers, sales)';
  RAISE NOTICE '5. User Management should show Drake as ACTIVE';
END $$;
