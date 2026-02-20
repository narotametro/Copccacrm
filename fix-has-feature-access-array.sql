-- Fix has_feature_access to work with JSON arrays (not objects)

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
        -- Check if features array contains "all_features"
        (sp.features @> '["all_features"]'::jsonb)
        OR
        -- Check if features array contains the specific feature
        (sp.features @> jsonb_build_array(p_feature_name))
        OR
        -- If features is null, assume all features enabled
        sp.features IS NULL
      )
  )
  INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;

-- Also update the wrapper function
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
