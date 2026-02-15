-- ================================================================
-- AUTO-ASSIGN START PLAN TO NEW USERS
-- ================================================================
-- This migration ensures new users automatically get the START plan
-- when they sign up, so they have immediate access to basic features.
-- ================================================================

-- ================================================================
-- STEP 1: Create trigger to auto-assign START plan to new users
-- ================================================================

CREATE OR REPLACE FUNCTION assign_start_plan_to_new_user()
RETURNS TRIGGER AS $$
DECLARE
  start_plan_id UUID;
  trial_end TIMESTAMPTZ;
BEGIN
  -- Get the START plan ID
  SELECT id INTO start_plan_id 
  FROM subscription_plans 
  WHERE name = 'start' 
  LIMIT 1;
  
  -- If no START plan exists, raise error
  IF start_plan_id IS NULL THEN
    RAISE EXCEPTION 'START plan not found. Please run subscription management setup first.';
  END IF;
  
  -- Calculate trial end date (7 days from now)
  trial_end := NOW() + INTERVAL '7 days';
  
  -- Create subscription for new user
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    billing_cycle,
    trial_start_date,
    trial_end_date,
    current_period_start,
    current_period_end,
    cancel_at_period_end
  ) VALUES (
    NEW.id,
    start_plan_id,
    'trial',
    'monthly',
    NOW(),
    trial_end,
    NOW(),
    trial_end,
    false
  );
  
  RAISE NOTICE 'Assigned START plan to user %', NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_assign_start_plan ON users;

-- Create trigger to run after user insert
CREATE TRIGGER trigger_assign_start_plan
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_start_plan_to_new_user();

-- ================================================================
-- STEP 2: Assign START plan to existing users without subscription
-- ================================================================

DO $$
DECLARE
  start_plan_id UUID;
  trial_end TIMESTAMPTZ;
  user_record RECORD;
  assigned_count INTEGER := 0;
BEGIN
  -- Get the START plan ID
  SELECT id INTO start_plan_id 
  FROM subscription_plans 
  WHERE name = 'start' 
  LIMIT 1;
  
  IF start_plan_id IS NULL THEN
    RAISE EXCEPTION 'START plan not found. Please run subscription management setup first.';
  END IF;
  
  -- Calculate trial end date
  trial_end := NOW() + INTERVAL '7 days';
  
  -- Loop through users without subscriptions
  FOR user_record IN 
    SELECT u.id, u.email 
    FROM users u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id
    WHERE us.id IS NULL
  LOOP
    -- Create subscription
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      billing_cycle,
      trial_start_date,
      trial_end_date,
      current_period_start,
      current_period_end,
      cancel_at_period_end
    ) VALUES (
      user_record.id,
      start_plan_id,
      'trial',
      'monthly',
      NOW(),
      trial_end,
      NOW(),
      trial_end,
      false
    );
    
    assigned_count := assigned_count + 1;
    RAISE NOTICE 'Assigned START plan to existing user: %', user_record.email;
  END LOOP;
  
  RAISE NOTICE '✓ Assigned START plan to % existing users', assigned_count;
END $$;

-- ================================================================
-- STEP 3: Create has_feature_access helper function
-- ================================================================

-- Drop existing function first (parameter names may differ)
DROP FUNCTION IF EXISTS has_feature_access(UUID, TEXT);

CREATE OR REPLACE FUNCTION has_feature_access(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_features JSONB;
  plan_features JSONB;
BEGIN
  -- Get user's plan features
  SELECT sp.features INTO plan_features
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid
    AND us.status IN ('trial', 'active')
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If no subscription, deny access
  IF plan_features IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If plan has "all_features", allow access
  IF plan_features @> '["all_features"]'::jsonb THEN
    RETURN TRUE;
  END IF;
  
  -- Check if specific feature is in plan
  RETURN plan_features @> to_jsonb(ARRAY[feature_name]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- VERIFICATION
-- ================================================================

DO $$
DECLARE
  users_with_subscription INTEGER;
  users_without_subscription INTEGER;
  start_plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_with_subscription
  FROM users u
  INNER JOIN user_subscriptions us ON u.id = us.user_id;
  
  SELECT COUNT(*) INTO users_without_subscription
  FROM users u
  LEFT JOIN user_subscriptions us ON u.id = us.user_id
  WHERE us.id IS NULL;
  
  SELECT COUNT(*) INTO start_plan_count
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE sp.name = 'start';
  
  RAISE NOTICE '=== SUBSCRIPTION AUTO-ASSIGNMENT VERIFICATION ===';
  RAISE NOTICE 'Users with subscription: %', users_with_subscription;
  RAISE NOTICE 'Users without subscription: %', users_without_subscription;
  RAISE NOTICE 'Users on START plan: %', start_plan_count;
  
  IF users_without_subscription = 0 THEN
    RAISE NOTICE '✓ All users have subscriptions';
  ELSE
    RAISE NOTICE '⚠️ % users still need subscription assignment', users_without_subscription;
  END IF;
  
  RAISE NOTICE '✓ Subscription auto-assignment configured successfully';
  RAISE NOTICE 'New users will automatically get START plan (7-day trial)';
END $$;
