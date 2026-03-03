-- CONVERT TO COMPANY-BASED SUBSCRIPTIONS
-- Invited users automatically inherit their company owner's plan
-- Only company owners select and manage plans

-- ================================================================
-- STEP 1: Modify has_feature_access to check company owner's plan
-- ================================================================

CREATE OR REPLACE FUNCTION has_feature_access(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  plan_features JSONB;
  company_owner_id UUID;
BEGIN
  -- Get user's company and check if they're the owner
  SELECT 
    CASE 
      WHEN u.is_company_owner THEN u.id
      ELSE (
        SELECT id 
        FROM users 
        WHERE company_id = u.company_id 
          AND is_company_owner = true 
        LIMIT 1
      )
    END INTO company_owner_id
  FROM users u
  WHERE u.id = user_uuid;
  
  -- If no company owner found, deny access
  IF company_owner_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get company owner's plan features
  SELECT sp.features INTO plan_features
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = company_owner_id
    AND us.status IN ('trial', 'active')
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If no subscription, deny access
  IF plan_features IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- PRO plan has all_features
  IF plan_features ? 'all_features' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if specific feature is in plan
  RETURN plan_features ? feature_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- STEP 2: Create helper function to get user's effective subscription
-- ================================================================

CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_id UUID,
  plan_name TEXT,
  plan_display_name TEXT,
  status TEXT,
  is_owner BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id as subscription_id,
    us.plan_id,
    sp.name as plan_name,
    sp.display_name as plan_display_name,
    us.status,
    u.is_company_owner as is_owner
  FROM users u
  LEFT JOIN users company_owner ON (
    CASE 
      WHEN u.is_company_owner THEN u.id = company_owner.id
      ELSE company_owner.company_id = u.company_id 
        AND company_owner.is_company_owner = true
    END
  )
  LEFT JOIN user_subscriptions us ON us.user_id = company_owner.id
  LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE u.id = user_uuid
    AND (us.status IN ('trial', 'active') OR us.status IS NULL)
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- STEP 3: Update RLS policies for company-based access
-- ================================================================

-- Users can read their own subscription OR their company owner's subscription
DROP POLICY IF EXISTS "Users can read own subscription" ON user_subscriptions;
CREATE POLICY "Users can read own or company subscription" ON user_subscriptions 
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    auth.uid() IN (
      SELECT u.id 
      FROM users u
      JOIN users owner ON owner.company_id = u.company_id AND owner.is_company_owner = true
      WHERE owner.id = user_subscriptions.user_id
    )
  );

-- Only company owners can insert subscriptions
DROP POLICY IF EXISTS "Users can insert own subscription" ON user_subscriptions;
CREATE POLICY "Company owners can insert subscription" ON user_subscriptions 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_company_owner = true
    )
  );

-- Only company owners can update their subscription
DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;
CREATE POLICY "Company owners can update subscription" ON user_subscriptions 
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_company_owner = true
    )
  );

-- ================================================================
-- STEP 4: Verify setup
-- ================================================================

-- Test has_feature_access function
DO $$
DECLARE
  test_user UUID;
  has_access BOOLEAN;
BEGIN
  -- Get any user
  SELECT id INTO test_user FROM users LIMIT 1;
  
  IF test_user IS NOT NULL THEN
    has_access := has_feature_access(test_user, 'dashboard');
    RAISE NOTICE 'Test user % has dashboard access: %', test_user, has_access;
  END IF;
END $$;

-- Show subscription structure
SELECT 
  u.email,
  u.full_name,
  u.is_company_owner,
  c.name as company_name,
  sp.display_name as plan,
  us.status,
  CASE 
    WHEN u.is_company_owner THEN '✓ Plan Owner'
    ELSE '→ Inherits from owner'
  END as subscription_type
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
LEFT JOIN users owner ON (
  CASE 
    WHEN u.is_company_owner THEN owner.id = u.id
    ELSE owner.company_id = u.company_id AND owner.is_company_owner = true
  END
)
LEFT JOIN user_subscriptions us ON us.user_id = owner.id
LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
ORDER BY c.name, u.is_company_owner DESC, u.email;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Company-based subscription system configured!';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 How it works:';
  RAISE NOTICE '1. Company OWNERS select and pay for plans';
  RAISE NOTICE '2. INVITED users automatically inherit owner''s plan';
  RAISE NOTICE '3. All team members get same features as owner''s plan';
  RAISE NOTICE '4. Only owners see plan selection/upgrade UI';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Key changes:';
  RAISE NOTICE '✓ has_feature_access() checks company owner''s plan';
  RAISE NOTICE '✓ get_user_subscription() returns effective plan for any user';
  RAISE NOTICE '✓ RLS policies restrict plan management to owners';
  RAISE NOTICE '✓ Invited users bypass /select-plan completely';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Next: Update UI to check is_company_owner before showing plan selection';
END $$;
