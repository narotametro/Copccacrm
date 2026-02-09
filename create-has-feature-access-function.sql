-- Create the missing has_feature_access RPC function
-- This function checks if a user has access to a specific feature based on their subscription

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