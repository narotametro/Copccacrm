-- Check User Company Setup
-- Run this to verify your company_id is set correctly

-- Check your user record
SELECT 
  id,
  email,
  full_name,
  company_id,
  is_company_owner,
  'Your User Record' as record_type
FROM users
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- Check companies you created
SELECT 
  id,
  name,
  email,
  status,
  created_by,
  created_at,
  'Companies You Created' as record_type
FROM companies
WHERE created_by = (SELECT id FROM users WHERE email = 'YOUR_EMAIL_HERE')
ORDER BY created_at;

-- Check if company_id matches
SELECT 
  u.email as user_email,
  u.company_id as user_company_id,
  c.id as company_id,
  c.name as company_name,
  CASE 
    WHEN u.company_id = c.id THEN '✅ MATCH - This is YOUR company'
    ELSE '❌ MISMATCH - This is a CUSTOMER'
  END as status
FROM users u
CROSS JOIN companies c
WHERE u.email = 'YOUR_EMAIL_HERE'
  AND c.created_by = u.id
ORDER BY c.created_at;
