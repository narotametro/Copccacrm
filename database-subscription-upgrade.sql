-- ================================================================
-- SUBSCRIPTION UPGRADE SYSTEM
-- ================================================================
-- Handles plan upgrades and subscription management
-- ================================================================

-- Function to upgrade user subscription
CREATE OR REPLACE FUNCTION upgrade_user_subscription(
  p_user_id UUID,
  p_new_plan_name TEXT,
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_plan_id UUID;
  v_current_subscription_id UUID;
  v_current_plan_name TEXT;
  v_result JSONB;
BEGIN
  -- Get the new plan ID
  SELECT id INTO v_new_plan_id
  FROM subscription_plans
  WHERE name = p_new_plan_name;

  IF v_new_plan_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Plan not found: ' || p_new_plan_name
    );
  END IF;

  -- Get current subscription
  SELECT id, plan_id INTO v_current_subscription_id, v_current_plan_name
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND status IN ('trial', 'active')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_current_subscription_id IS NULL THEN
    -- No active subscription, create new one
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      billing_cycle,
      current_period_start,
      current_period_end,
      trial_start_date,
      trial_end_date
    ) VALUES (
      p_user_id,
      v_new_plan_id,
      'trial',
      p_billing_cycle,
      NOW(),
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW() + INTERVAL '7 days'
    )
    RETURNING id INTO v_current_subscription_id;

    RETURN jsonb_build_object(
      'success', true,
      'subscription_id', v_current_subscription_id,
      'action', 'created',
      'status', 'trial'
    );
  ELSE
    -- Update existing subscription
    UPDATE user_subscriptions
    SET 
      plan_id = v_new_plan_id,
      status = CASE 
        WHEN status = 'trial' AND trial_end_date > NOW() THEN 'trial'
        ELSE 'active'
      END,
      billing_cycle = p_billing_cycle,
      current_period_start = NOW(),
      current_period_end = CASE
        WHEN p_billing_cycle = 'annual' THEN NOW() + INTERVAL '1 year'
        ELSE NOW() + INTERVAL '30 days'
      END,
      updated_at = NOW()
    WHERE id = v_current_subscription_id;

    RETURN jsonb_build_object(
      'success', true,
      'subscription_id', v_current_subscription_id,
      'action', 'upgraded',
      'status', 'active'
    );
  END IF;
END;
$$;

-- Function to activate subscription (convert trial to paid)
CREATE OR REPLACE FUNCTION activate_subscription(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id UUID;
  v_billing_cycle TEXT;
BEGIN
  -- Get current trial subscription
  SELECT id, billing_cycle INTO v_subscription_id, v_billing_cycle
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND status = 'trial'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No trial subscription found'
    );
  END IF;

  -- Activate the subscription
  UPDATE user_subscriptions
  SET 
    status = 'active',
    current_period_start = NOW(),
    current_period_end = CASE
      WHEN billing_cycle = 'annual' THEN NOW() + INTERVAL '1 year'
      ELSE NOW() + INTERVAL '30 days'
    END,
    trial_start_date = NULL,
    trial_end_date = NULL,
    updated_at = NOW()
  WHERE id = v_subscription_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'status', 'active'
  );
END;
$$;

-- Function to check if user can access a feature
CREATE OR REPLACE FUNCTION user_has_feature(
  p_user_id UUID,
  p_feature_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_features JSONB;
BEGIN
  -- Get user's current plan features (stored as JSONB)
  SELECT sp.features INTO v_features
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id
  AND us.status IN ('trial', 'active')
  ORDER BY us.created_at DESC
  LIMIT 1;

  IF v_features IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if plan has all_features flag
  IF v_features ? 'all_features' THEN
    RETURN TRUE;
  END IF;

  -- Check if specific feature is in plan (JSONB array contains element)
  RETURN v_features @> to_jsonb(p_feature_name);
END;
$$;

-- Create index for faster subscription lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status 
ON user_subscriptions(user_id, status) 
WHERE status IN ('trial', 'active');

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upgrade_user_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION activate_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_feature TO authenticated;

-- Example usage:
-- Upgrade user to GROW plan:
-- SELECT upgrade_user_subscription('user-uuid-here', 'grow', 'monthly');

-- Activate trial (convert to paid):
-- SELECT activate_subscription('user-uuid-here');

-- Check feature access:
-- SELECT user_has_feature('user-uuid-here', 'after_sales');

-- Verification
DO $$
DECLARE
  v_function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname IN ('upgrade_user_subscription', 'activate_subscription', 'user_has_feature');
  
  RAISE NOTICE 'Subscription functions created: %', v_function_count;
  
  IF v_function_count >= 3 THEN
    RAISE NOTICE '✅ Subscription upgrade system ready!';
    RAISE NOTICE 'Available functions:';
    RAISE NOTICE '  - upgrade_user_subscription(user_id, plan_name, billing_cycle)';
    RAISE NOTICE '  - activate_subscription(user_id)';
    RAISE NOTICE '  - user_has_feature(user_id, feature_name)';
  ELSE
    RAISE WARNING '⚠ Some functions may not have been created properly';
  END IF;
END $$;
