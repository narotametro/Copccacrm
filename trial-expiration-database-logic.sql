-- ===========================================
-- TRIAL EXPIRATION WORKFLOW IMPLEMENTATION
-- ===========================================

-- ===========================================
-- 1. ENHANCED FEATURE ACCESS FUNCTION WITH TRIAL LOGIC
-- ===========================================

CREATE OR REPLACE FUNCTION has_feature_access(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan_features JSONB;
  user_status TEXT;
  trial_end_date TIMESTAMPTZ;
  days_since_expiry INTEGER;
BEGIN
  -- Get user's subscription details
  SELECT
    sp.features,
    us.status,
    us.trial_end_date
  INTO user_plan_features, user_status, trial_end_date
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid
  AND us.status IN ('trial', 'active', 'past_due')
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- No subscription found - deny access
  IF user_plan_features IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Active paid subscription - full access
  IF user_status = 'active' THEN
    RETURN (user_plan_features ? feature_name) OR (user_plan_features ? 'all_features');
  END IF;

  -- Trial logic
  IF user_status = 'trial' THEN
    -- Trial still active
    IF trial_end_date > CURRENT_DATE THEN
      RETURN (user_plan_features ? feature_name) OR (user_plan_features ? 'all_features');
    END IF;

    -- Trial expired - calculate days since expiry
    days_since_expiry := EXTRACT(EPOCH FROM (CURRENT_DATE - trial_end_date)) / 86400;

    -- Grace period (7 days) - allow basic features
    IF days_since_expiry <= 7 THEN
      -- Allow basic read-only features during grace period
      RETURN feature_name IN ('dashboard', 'customers_basic', 'pos_system');
    END IF;

    -- Extended grace period (14 days) - very limited access
    IF days_since_expiry <= 14 THEN
      -- Only dashboard access
      RETURN feature_name = 'dashboard';
    END IF;

    -- Trial completely expired - no access
    RETURN FALSE;
  END IF;

  -- Past due subscription - limited access for 30 days
  IF user_status = 'past_due' THEN
    -- Allow read-only access to existing data
    RETURN feature_name IN ('dashboard', 'customers_basic');
  END IF;

  -- Cancelled or expired - no access
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 2. AUTOMATIC TRIAL STATUS UPDATE FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION update_trial_statuses()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update trials that just expired to 'past_due'
  UPDATE user_subscriptions
  SET
    status = 'past_due',
    updated_at = NOW()
  WHERE status = 'trial'
  AND trial_end_date < CURRENT_DATE
  AND trial_end_date >= CURRENT_DATE - INTERVAL '7 days';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Update very expired trials to 'cancelled'
  UPDATE user_subscriptions
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE status = 'past_due'
  AND trial_end_date < CURRENT_DATE - INTERVAL '30 days';

  -- Update expired past_due subscriptions to cancelled
  UPDATE user_subscriptions
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE status = 'past_due'
  AND current_period_end < CURRENT_DATE - INTERVAL '30 days';

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 3. GET TRIAL STATUS FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION get_trial_status(user_uuid UUID)
RETURNS TABLE (
  status TEXT,
  trial_end_date TIMESTAMPTZ,
  days_remaining INTEGER,
  days_overdue INTEGER,
  can_access_features BOOLEAN,
  grace_period_active BOOLEAN
) AS $$
DECLARE
  user_status TEXT;
  end_date TIMESTAMPTZ;
  days_remaining_calc INTEGER;
  days_overdue_calc INTEGER;
BEGIN
  -- Get user's trial details
  SELECT us.status, us.trial_end_date
  INTO user_status, end_date
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- No subscription found
  IF user_status IS NULL THEN
    RETURN QUERY SELECT
      'no_subscription'::TEXT,
      NULL::TIMESTAMPTZ,
      NULL::INTEGER,
      NULL::INTEGER,
      FALSE,
      FALSE;
    RETURN;
  END IF;

  -- Calculate days remaining/overdue
  IF end_date > CURRENT_DATE THEN
    days_remaining_calc := EXTRACT(EPOCH FROM (end_date - CURRENT_DATE)) / 86400;
    days_overdue_calc := 0;
  ELSE
    days_remaining_calc := 0;
    days_overdue_calc := EXTRACT(EPOCH FROM (CURRENT_DATE - end_date)) / 86400;
  END IF;

  -- Determine access and grace period status
  RETURN QUERY SELECT
    user_status,
    end_date,
    days_remaining_calc,
    days_overdue_calc,
    CASE
      WHEN user_status = 'active' THEN TRUE
      WHEN user_status = 'trial' AND end_date > CURRENT_DATE THEN TRUE
      WHEN user_status = 'trial' AND days_overdue_calc <= 14 THEN TRUE
      WHEN user_status = 'past_due' THEN TRUE
      ELSE FALSE
    END,
    CASE
      WHEN user_status = 'trial' AND end_date < CURRENT_DATE AND days_overdue_calc <= 14 THEN TRUE
      ELSE FALSE
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 4. TRIAL CONVERSION ANALYTICS FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION get_trial_analytics(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  metric TEXT,
  value INTEGER,
  percentage DECIMAL
) AS $$
DECLARE
  total_trials INTEGER;
  converted_trials INTEGER;
  expired_trials INTEGER;
  active_trials INTEGER;
BEGIN
  -- Get trial statistics
  SELECT
    COUNT(*) FILTER (WHERE status IN ('trial', 'active', 'past_due', 'cancelled')) as total,
    COUNT(*) FILTER (WHERE status = 'active') as converted,
    COUNT(*) FILTER (WHERE status = 'cancelled' AND trial_end_date < CURRENT_DATE) as expired,
    COUNT(*) FILTER (WHERE status = 'trial' AND trial_end_date > CURRENT_DATE) as active
  INTO total_trials, converted_trials, expired_trials, active_trials
  FROM user_subscriptions
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back;

  -- Return analytics
  RETURN QUERY
  SELECT 'total_trials'::TEXT, total_trials, 100.0::DECIMAL;

  RETURN QUERY
  SELECT 'converted_trials'::TEXT, converted_trials,
         CASE WHEN total_trials > 0 THEN (converted_trials::DECIMAL / total_trials) * 100 ELSE 0 END;

  RETURN QUERY
  SELECT 'expired_trials'::TEXT, expired_trials,
         CASE WHEN total_trials > 0 THEN (expired_trials::DECIMAL / total_trials) * 100 ELSE 0 END;

  RETURN QUERY
  SELECT 'active_trials'::TEXT, active_trials,
         CASE WHEN total_trials > 0 THEN (active_trials::DECIMAL / total_trials) * 100 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 5. SCHEDULED JOB FOR AUTOMATIC UPDATES (RUN DAILY)
-- ===========================================

-- This function should be called daily via a cron job or scheduled task
CREATE OR REPLACE FUNCTION process_trial_expirations()
RETURNS TABLE (
  trials_expired INTEGER,
  accounts_cancelled INTEGER,
  notifications_sent INTEGER
) AS $$
DECLARE
  expired_count INTEGER;
  cancelled_count INTEGER;
  notification_count INTEGER;
BEGIN
  -- Update trial statuses
  SELECT update_trial_statuses() INTO expired_count;

  -- Count newly cancelled accounts
  cancelled_count := 0; -- Would need additional logic for tracking

  -- Send notifications (placeholder - would integrate with email service)
  notification_count := 0; -- Would count emails sent

  RETURN QUERY SELECT expired_count, cancelled_count, notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;