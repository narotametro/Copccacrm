-- Assign company_id to existing users
-- This script ensures all existing users have a company_id so admin filtering works correctly

-- Step 1: Create missing companies for users who signed up independently
-- Each independent sign-up gets their own company
INSERT INTO companies (id, name, status, created_at, updated_at, subscription_plan, subscription_status, max_users)
SELECT 
  gen_random_uuid() as id,
  COALESCE(u.full_name || '''s Company', 'Company ' || u.id) as name,
  'active' as status,
  u.created_at as created_at,
  NOW() as updated_at,
  'starter' as subscription_plan,
  'active' as subscription_status,
  10 as max_users
FROM users u
WHERE u.company_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.id = u.id
  )
ON CONFLICT (id) DO NOTHING;

-- Step 2: Assign company_id to users without one
-- Use their own user ID as company ID (each gets their own company)
UPDATE users u
SET 
  company_id = (
    SELECT id FROM companies 
    WHERE name LIKE u.full_name || '%' 
    OR id = u.id
    LIMIT 1
  ),
  is_company_owner = true
WHERE u.company_id IS NULL;

-- Step 3: If any users still don't have a company, create one for them
DO $$
DECLARE
  user_record RECORD;
  new_company_id UUID;
BEGIN
  FOR user_record IN 
    SELECT id, full_name, email, created_at 
    FROM users 
    WHERE company_id IS NULL
  LOOP
    -- Create a company for this user
    INSERT INTO companies (
      id, 
      name, 
      email, 
      status, 
      created_at, 
      updated_at,
      subscription_plan,
      subscription_status,
      max_users,
      created_by
    )
    VALUES (
      gen_random_uuid(),
      COALESCE(user_record.full_name || '''s Company', 'Company ' || user_record.email),
      user_record.email,
      'active',
      user_record.created_at,
      NOW(),
      'starter',
      'active',
      10,
      user_record.id
    )
    RETURNING id INTO new_company_id;

    -- Assign this company to the user
    UPDATE users 
    SET 
      company_id = new_company_id,
      is_company_owner = true,
      updated_at = NOW()
    WHERE id = user_record.id;
    
    RAISE NOTICE 'Created company % for user %', new_company_id, user_record.email;
  END LOOP;
END $$;

-- Verification: Check that all users now have a company_id
SELECT 
  COUNT(*) as total_users,
  COUNT(company_id) as users_with_company,
  COUNT(*) - COUNT(company_id) as users_without_company
FROM users;

-- Show companies and their user counts
SELECT 
  c.name as company_name,
  c.status,
  c.subscription_plan,
  COUNT(u.id) as user_count
FROM companies c
LEFT JOIN users u ON u.company_id = c.id
GROUP BY c.id, c.name, c.status, c.subscription_plan
ORDER BY user_count DESC;
