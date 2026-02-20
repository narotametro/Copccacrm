-- =====================================================
-- FIX: Update functions to match actual database schema
-- =====================================================

-- 1. Fix get_trial_status() - compute is_trial from dates
DROP FUNCTION IF EXISTS get_trial_status();

CREATE FUNCTION get_trial_status()
RETURNS TABLE (
  is_trial BOOLEAN,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  days_remaining INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (s.trial_start_date IS NOT NULL AND 
     (s.trial_end_date IS NULL OR s.trial_end_date > NOW())) as is_trial,
    s.trial_start_date,
    s.trial_end_date,
    CASE 
      WHEN s.trial_end_date IS NOT NULL THEN 
        EXTRACT(DAY FROM (s.trial_end_date - NOW()))::INTEGER
      ELSE NULL
    END as days_remaining,
    CASE 
      WHEN s.trial_start_date IS NULL THEN 'paid'
      WHEN s.trial_end_date IS NULL THEN 'trial_unlimited'
      WHEN NOW() > s.trial_end_date THEN 'trial_expired'
      ELSE 'trial_active'
    END as status
  FROM user_subscriptions s
  WHERE s.user_id = auth.uid();
END;
$$;

-- 2. Fix has_feature_access() - check features JSONB column
DROP FUNCTION IF EXISTS has_feature_access(UUID, TEXT);

CREATE FUNCTION has_feature_access(p_user_id UUID, p_feature_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM user_subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
      AND (
        -- Check if feature exists in features JSONB as true
        (sp.features ? p_feature_name AND (sp.features ->> p_feature_name)::boolean = true)
        OR
        -- If features JSONB is null, assume all features enabled
        sp.features IS NULL
      )
  )
  INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;

-- 3. Re-add wrapper function with flipped parameters
DROP FUNCTION IF EXISTS has_feature_access(TEXT, UUID);

CREATE FUNCTION has_feature_access(p_feature TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN has_feature_access(p_user_id, p_feature);
END;
$$;
