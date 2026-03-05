-- =====================================================
-- ADD UNIQUE CONSTRAINT TO user_subscriptions
-- Fix: "no unique or exclusion constraint matching ON CONFLICT"
-- =====================================================

-- First, check if constraint already exists
DO $$
BEGIN
  -- Drop the constraint if it exists (in case of partial application)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_subscriptions_user_id_key'
  ) THEN
    ALTER TABLE user_subscriptions DROP CONSTRAINT user_subscriptions_user_id_key;
    RAISE NOTICE '✓ Dropped existing constraint';
  END IF;
END $$;

-- Remove any duplicate rows first (keep the most recent one per user)
DELETE FROM user_subscriptions a
USING user_subscriptions b
WHERE a.user_id = b.user_id
  AND a.created_at < b.created_at;

-- Add the UNIQUE constraint
ALTER TABLE user_subscriptions 
ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);

-- Recreate the upsert function (now it will work with the constraint)
CREATE OR REPLACE FUNCTION upsert_user_subscription(
  p_user_id UUID,
  p_plan_id UUID,
  p_status TEXT DEFAULT 'active',
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS user_subscriptions AS $$
DECLARE
  v_subscription user_subscriptions;
BEGIN
  -- Try to insert, if conflict then update
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end
  ) VALUES (
    p_user_id,
    p_plan_id,
    p_status,
    p_billing_cycle,
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = EXCLUDED.status,
    billing_cycle = EXCLUDED.billing_cycle,
    updated_at = NOW()
  RETURNING * INTO v_subscription;
  
  RETURN v_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION upsert_user_subscription(UUID, UUID, TEXT, TEXT) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ UNIQUE constraint added successfully!';
  RAISE NOTICE '   - user_subscriptions now has UNIQUE(user_id)';
  RAISE NOTICE '   - upsert_user_subscription function recreated';
  RAISE NOTICE '   - Duplicate rows cleaned up';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Test plan selection now - should work!';
END $$;
