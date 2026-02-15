-- ================================================================
-- FIX: SUBSCRIPTION ERRORS (406 & 403)
-- ================================================================

-- STEP 1: Check subscription_plans table schema
SELECT 
  'SUBSCRIPTION_PLANS SCHEMA' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- STEP 2: Check user_subscriptions table schema
SELECT 
  'USER_SUBSCRIPTIONS SCHEMA' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- STEP 3: Check RLS policies on user_subscriptions
SELECT 
  'USER_SUBSCRIPTIONS RLS' as section,
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'user_subscriptions';

-- STEP 4: Create missing RLS policies on user_subscriptions
-- Allow users to view their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" 
ON user_subscriptions FOR SELECT 
USING (user_id = auth.uid());

-- Allow users to update their own subscriptions
DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can update own subscriptions" 
ON user_subscriptions FOR UPDATE 
USING (user_id = auth.uid());

-- Allow users to insert their own subscriptions
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert own subscriptions" 
ON user_subscriptions FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- STEP 5: Enable RLS on subscription_plans (read-only for all authenticated users)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can view subscription plans" 
ON subscription_plans FOR SELECT 
USING (auth.role() = 'authenticated');

-- STEP 6: Enable RLS on user_subscriptions if not already enabled
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- STEP 7: Verify RLS setup
DO $$
DECLARE
  user_subs_policies INTEGER;
  plans_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_subs_policies FROM pg_policies WHERE tablename = 'user_subscriptions';
  SELECT COUNT(*) INTO plans_policies FROM pg_policies WHERE tablename = 'subscription_plans';
  
  RAISE NOTICE '=== RLS VERIFICATION ===';
  RAISE NOTICE 'user_subscriptions policies: %', user_subs_policies;
  RAISE NOTICE 'subscription_plans policies: %', plans_policies;
  
  IF user_subs_policies >= 3 AND plans_policies >= 1 THEN
    RAISE NOTICE '✓ RLS policies configured';
  ELSE
    RAISE NOTICE '⚠️ Some policies missing';
  END IF;
END $$;
