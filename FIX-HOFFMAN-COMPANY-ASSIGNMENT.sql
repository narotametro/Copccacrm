-- =====================================================
-- DIAGNOSE HOFFMAN MISSING FROM ADMIN PANEL
-- =====================================================
-- Check why Hoffman doesn't appear in Teddy's admin panel
-- =====================================================

-- Step 1: Check both users and their company assignments
SELECT 
  '👤 USER COMPANY ASSIGNMENTS' as check_type,
  full_name,
  email,
  company_id,
  is_company_owner,
  invited_by,
  status,
  role
FROM users
WHERE email IN ('teddy@gmail.com', 'hoffman@gmail.com')
ORDER BY email;

-- Step 2: Check companies table
SELECT 
  '🏢 COMPANIES' as check_type,
  id as company_id,
  name as company_name,
  email as company_email,
  created_by,
  subscription_plan
FROM companies
ORDER BY created_at;

-- Step 3: Check invitation record for Hoffman
SELECT 
  '📧 HOFFMAN INVITATION DETAILS' as check_type,
  email,
  role,
  created_by as invited_by_user_id,
  inviter_company_id,
  used,
  created_at,
  expires_at
FROM invitation_links
WHERE email = 'hoffman@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- Step 4: Find the root cause
SELECT 
  '🔍 ROOT CAUSE ANALYSIS' as analysis,
  CASE 
    WHEN (SELECT company_id FROM users WHERE email = 'teddy@gmail.com') = 
         (SELECT company_id FROM users WHERE email = 'hoffman@gmail.com')
    THEN '✅ SAME COMPANY - Should appear in admin panel'
    WHEN (SELECT company_id FROM users WHERE email = 'hoffman@gmail.com') IS NULL
    THEN '❌ HOFFMAN HAS NO COMPANY - Need to assign to Teddy''s company'
    ELSE '❌ DIFFERENT COMPANIES - Hoffman in wrong company'
  END as diagnosis,
  (SELECT company_id FROM users WHERE email = 'teddy@gmail.com') as teddy_company_id,
  (SELECT company_id FROM users WHERE email = 'hoffman@gmail.com') as hoffman_company_id;

-- =====================================================
-- FIX: ASSIGN HOFFMAN TO TEDDY'S COMPANY
-- =====================================================

-- Step 5: Get Teddy's company_id and invited_by user_id
DO $$
DECLARE
  teddy_company UUID;
  teddy_user_id UUID;
BEGIN
  -- Get Teddy's details
  SELECT company_id, id INTO teddy_company, teddy_user_id
  FROM users 
  WHERE email = 'teddy@gmail.com';
  
  -- Update Hoffman to be in Teddy's company
  UPDATE users
  SET 
    company_id = teddy_company,
    invited_by = teddy_user_id,
    is_company_owner = false
  WHERE email = 'hoffman@gmail.com'
    AND (company_id IS NULL OR company_id != teddy_company OR invited_by IS NULL);
  
  RAISE NOTICE 'Hoffman assigned to Teddy''s company (%))', teddy_company;
END $$;

-- Step 6: Verify the fix
SELECT 
  '✅ VERIFICATION AFTER FIX' as check_type,
  u.full_name,
  u.email,
  u.company_id,
  u.is_company_owner,
  u.invited_by,
  u.status,
  c.name as company_name,
  CASE 
    WHEN u.company_id = (SELECT company_id FROM users WHERE email = 'teddy@gmail.com')
    THEN '✅ In same company as Teddy'
    ELSE '❌ Still in different company'
  END as company_check
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email IN ('teddy@gmail.com', 'hoffman@gmail.com')
ORDER BY u.is_company_owner DESC, u.email;

-- Step 7: Final validation
SELECT 
  '📊 FINAL STATUS' as report,
  CASE 
    WHEN (SELECT company_id FROM users WHERE email = 'teddy@gmail.com') = 
         (SELECT company_id FROM users WHERE email = 'hoffman@gmail.com')
    THEN '✅ SUCCESS - Both users in same company. Hoffman will now appear in admin panel.'
    ELSE '⚠️ ISSUE - Users still in different companies. Manual investigation needed.'
  END as final_status;
