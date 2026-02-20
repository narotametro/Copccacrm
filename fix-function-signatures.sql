-- =====================================================
-- FIX: Function signature mismatches
-- =====================================================

-- 1. Add get_trial_status() with no parameters (uses auth.uid())
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
    s.is_trial,
    s.trial_start_date,
    s.trial_end_date,
    CASE 
      WHEN s.trial_end_date IS NOT NULL THEN 
        EXTRACT(DAY FROM (s.trial_end_date - NOW()))::INTEGER
      ELSE NULL
    END as days_remaining,
    CASE 
      WHEN s.is_trial = false THEN 'paid'
      WHEN s.trial_end_date IS NULL THEN 'trial_unlimited'
      WHEN NOW() > s.trial_end_date THEN 'trial_expired'
      ELSE 'trial_active'
    END as status
  FROM user_subscriptions s
  WHERE s.user_id = auth.uid();
END;
$$;

-- 2. Add has_feature_access wrapper with parameter order (p_feature, p_user_id)
DROP FUNCTION IF EXISTS has_feature_access(TEXT, UUID);

CREATE FUNCTION has_feature_access(p_feature TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the existing function with correct parameter order
  RETURN has_feature_access(p_user_id, p_feature);
END;
$$;
