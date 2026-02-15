-- ================================================================
-- FIX: UPDATE has_feature_access FUNCTION PARAMETERS
-- ================================================================
-- The frontend code expects different parameter names
-- ================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS has_feature_access(UUID, TEXT);

-- Recreate with correct parameter names matching frontend code
CREATE OR REPLACE FUNCTION has_feature_access(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  plan_features JSONB;
BEGIN
  -- Get user's plan features
  SELECT sp.features INTO plan_features
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
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
  RETURN plan_features @> to_jsonb(ARRAY[p_feature]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'has_feature_access'
  ) THEN
    RAISE NOTICE '✓ has_feature_access function updated successfully';
  ELSE
    RAISE NOTICE '⚠️ Function not found';
  END IF;
END $$;
