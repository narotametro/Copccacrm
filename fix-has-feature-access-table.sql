-- Fix has_feature_access to use user_subscriptions instead of subscriptions

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
    JOIN plan_features pf ON sp.id = pf.plan_id
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
      AND pf.feature_name = p_feature_name
      AND pf.is_enabled = true
  )
  INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;
