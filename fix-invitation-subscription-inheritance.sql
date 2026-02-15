-- ================================================================
-- INVITATION SYSTEM - INHERIT ADMIN'S SUBSCRIPTION PLAN
-- ================================================================
-- When invited user signs up, they should get the same plan as admin
-- ================================================================

-- Function to copy admin's subscription to invited user
CREATE OR REPLACE FUNCTION assign_inviter_subscription_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inviter_subscription user_subscriptions%ROWTYPE;
  v_inviter_company_id UUID;
BEGIN
  -- Check if user was invited (has invited_by field)
  IF NEW.invited_by IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get inviter's company_id
  SELECT company_id INTO v_inviter_company_id
  FROM users
  WHERE id = NEW.invited_by;

  -- Get the inviter's current subscription
  SELECT * INTO v_inviter_subscription
  FROM user_subscriptions
  WHERE user_id = NEW.invited_by
  AND status IN ('trial', 'active')
  ORDER BY created_at DESC
  LIMIT 1;

  -- If inviter has a subscription, copy it to new user
  IF v_inviter_subscription.id IS NOT NULL THEN
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      billing_cycle,
      current_period_start,
      current_period_end,
      trial_start_date,
      trial_end_date,
      cancel_at_period_end
    ) VALUES (
      NEW.id,
      v_inviter_subscription.plan_id,
      v_inviter_subscription.status,
      v_inviter_subscription.billing_cycle,
      v_inviter_subscription.current_period_start,
      v_inviter_subscription.current_period_end,
      v_inviter_subscription.trial_start_date,
      v_inviter_subscription.trial_end_date,
      false
    )
    ON CONFLICT (user_id) WHERE status IN ('trial', 'active')
    DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      status = EXCLUDED.status,
      billing_cycle = EXCLUDED.billing_cycle,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      trial_start_date = EXCLUDED.trial_start_date,
      trial_end_date = EXCLUDED.trial_end_date;

    RAISE NOTICE 'Assigned subscription from inviter % to user %', NEW.invited_by, NEW.id;
  ELSE
    -- Fallback: assign START plan if inviter has no subscription
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      billing_cycle,
      current_period_start,
      current_period_end,
      trial_start_date,
      trial_end_date
    )
    SELECT
      NEW.id,
      sp.id,
      'trial',
      'monthly',
      NOW(),
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW() + INTERVAL '7 days'
    FROM subscription_plans sp
    WHERE sp.name = 'start'
    ON CONFLICT (user_id) WHERE status IN ('trial', 'active')
    DO NOTHING;

    RAISE NOTICE 'Inviter has no subscription, assigned START plan to user %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_assign_inviter_subscription ON users;

-- Create trigger that runs AFTER user insert
CREATE TRIGGER trigger_assign_inviter_subscription
  AFTER INSERT ON users
  FOR EACH ROW
  WHEN (NEW.invited_by IS NOT NULL)
  EXECUTE FUNCTION assign_inviter_subscription_to_user();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION assign_inviter_subscription_to_user TO authenticated;

-- Verification
DO $$
DECLARE
  v_trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger
  WHERE tgname = 'trigger_assign_inviter_subscription';
  
  IF v_trigger_count > 0 THEN
    RAISE NOTICE '✅ Invitation subscription inheritance enabled!';
    RAISE NOTICE 'Invited users will now inherit their admin''s subscription plan';
  ELSE
    RAISE WARNING '⚠ Trigger not found';
  END IF;
END $$;

-- Test query to see subscription inheritance
SELECT 
  u.email as invited_user,
  u.full_name,
  u.role,
  u.company_id,
  inviter.email as invited_by_email,
  sp.display_name as subscription_plan,
  us.status as subscription_status,
  us.trial_end_date
FROM users u
LEFT JOIN users inviter ON inviter.id = u.invited_by
LEFT JOIN user_subscriptions us ON us.user_id = u.id AND us.status IN ('trial', 'active')
LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE u.invited_by IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 10;
