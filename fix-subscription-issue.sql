-- ===========================================
-- COMPLETE SUBSCRIPTION FIX
-- Run this in your Supabase SQL Editor
-- ===========================================

-- Step 1: Drop existing functions if they exist (comprehensive cleanup)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all functions with name containing 'has_feature_access'
    FOR func_record IN
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'has_feature_access'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_record.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Also try direct drops for common variations
DROP FUNCTION IF EXISTS has_feature_access(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS has_feature_access(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_subscription(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_current_usage(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_trial_status(UUID) CASCADE;

-- Step 2: Create the missing get_trial_status RPC function
CREATE OR REPLACE FUNCTION get_trial_status(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  user_id_to_check UUID;
  user_subscription RECORD;
  result JSON;
BEGIN
  -- If no user_id provided, get from auth
  IF p_user_id IS NULL THEN
    user_id_to_check := auth.uid();
  ELSE
    user_id_to_check := p_user_id;
  END IF;

  IF user_id_to_check IS NULL THEN
    RETURN json_build_object(
      'isTrial', false,
      'daysLeft', 0,
      'isInGracePeriod', false,
      'gracePeriodDaysLeft', 0,
      'canAccessFeatures', false
    );
  END IF;

  -- Get user's subscription
  SELECT
    us.status,
    us.trial_start_date,
    us.trial_end_date,
    us.current_period_end
  INTO user_subscription
  FROM user_subscriptions us
  WHERE us.user_id = user_id_to_check
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- If no subscription, return default
  IF user_subscription IS NULL THEN
    RETURN json_build_object(
      'isTrial', false,
      'daysLeft', 0,
      'isInGracePeriod', false,
      'gracePeriodDaysLeft', 0,
      'canAccessFeatures', false
    );
  END IF;

  -- Calculate trial status
  IF user_subscription.status = 'trial' THEN
    RETURN json_build_object(
      'isTrial', true,
      'daysLeft', GREATEST(0, EXTRACT(EPOCH FROM (user_subscription.trial_end_date - NOW())) / 86400)::INTEGER,
      'isInGracePeriod', false,
      'gracePeriodDaysLeft', 0,
      'canAccessFeatures', user_subscription.trial_end_date > NOW()
    );
  ELSE
    RETURN json_build_object(
      'isTrial', false,
      'daysLeft', 0,
      'isInGracePeriod', false,
      'gracePeriodDaysLeft', 0,
      'canAccessFeatures', true
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the missing has_feature_access RPC function
CREATE OR REPLACE FUNCTION has_feature_access(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_subscription RECORD;
  plan_features JSONB;
BEGIN
  -- Get the user's active subscription
  SELECT
    us.status,
    us.trial_end_date,
    us.current_period_end,
    sp.features
  INTO user_subscription
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
  AND (us.status IN ('active', 'trial') OR (us.status = 'past_due' AND us.trial_end_date > NOW()))
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- If no subscription found, deny access
  IF user_subscription IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check subscription status
  IF user_subscription.status = 'trial' AND user_subscription.trial_end_date < NOW() THEN
    RETURN FALSE; -- Trial expired
  END IF;

  IF user_subscription.status = 'active' AND user_subscription.current_period_end < NOW() THEN
    RETURN FALSE; -- Subscription expired
  END IF;

  IF user_subscription.status = 'past_due' THEN
    RETURN FALSE; -- Payment required
  END IF;

  -- Check if feature is in the plan's features
  plan_features := user_subscription.features;
  IF plan_features IS NULL THEN
    RETURN FALSE;
  END IF;

  -- PRO plan has "all_features" which grants access to everything
  IF plan_features ? 'all_features' THEN
    RETURN TRUE;
  END IF;

  -- Check if the specific feature is included
  RETURN plan_features ? p_feature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure subscription plans exist
INSERT INTO subscription_plans (
  name, display_name, description, price_monthly, price_yearly, currency,
  max_users, max_products, max_invoices_monthly, max_pos_locations, max_inventory_locations,
  features, trial_days
) VALUES
  (
    'start',
    'START',
    'Perfect for micro-businesses, freelancers, and small shops getting started digitally',
    25000.00,
    250000.00,
    'TZS',
    1, 100, 100, 1, 1,
    '["dashboard", "customers_basic", "pos_system", "my_workplace"]'::jsonb,
    7
  ),
  (
    'grow',
    'GROW',
    'For growing retail shops, service businesses, and small distributors',
    80000.00,
    800000.00,
    'TZS',
    3, 500, 500, 2, 2,
    '["dashboard", "customers_basic", "pos_system", "sales_pipeline", "kpi_dashboard", "debt_collection", "admin_panel", "my_workplace", "products_management", "invoices", "marketing_campaigns"]'::jsonb,
    7
  ),
  (
    'pro',
    'PRO',
    'For established SMBs, small chains, and growing wholesalers',
    120000.00,
    1200000.00,
    'TZS',
    10, -1, -1, -1, -1,
    '["all_features"]'::jsonb,
    7
  )
ON CONFLICT (name) DO NOTHING;

-- Step 5: Create PRO subscriptions for all users who don't have one
INSERT INTO user_subscriptions (
  user_id,
  plan_id,
  status,
  trial_start_date,
  trial_end_date,
  current_period_start,
  current_period_end
)
SELECT
  u.id as user_id,
  sp.id as plan_id,
  'active' as status,
  NOW() as trial_start_date,
  NOW() + INTERVAL '30 days' as trial_end_date,
  NOW() as current_period_start,
  NOW() + INTERVAL '30 days' as current_period_end
FROM users u
CROSS JOIN subscription_plans sp
WHERE sp.name = 'pro'
AND NOT EXISTS (
  SELECT 1 FROM user_subscriptions us WHERE us.user_id = u.id
);

-- Step 6: Verify the fix
SELECT
  'Users with subscriptions:' as check_type,
  COUNT(*) as count
FROM user_subscriptions;

SELECT
  u.email,
  u.full_name,
  sp.display_name as plan_name,
  us.status,
  us.current_period_end
FROM users u
JOIN user_subscriptions us ON u.id = us.user_id
JOIN subscription_plans sp ON us.plan_id = sp.id
ORDER BY u.created_at DESC;

-- Test the functions
SELECT
  u.email,
  has_feature_access(u.id, 'dashboard') as has_dashboard,
  has_feature_access(u.id, 'all_features') as has_all_features,
  has_feature_access(u.id, 'admin_panel') as has_admin,
  get_trial_status(u.id) as trial_status
FROM users u
LIMIT 5;