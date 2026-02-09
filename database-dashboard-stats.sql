-- ===========================================
-- DASHBOARD STATISTICS FUNCTION
-- Provides real-time metrics for the admin dashboard
-- ===========================================

CREATE OR REPLACE FUNCTION get_subscription_dashboard_stats()
RETURNS TABLE (
  total_companies BIGINT,
  active_subscriptions BIGINT,
  trial_accounts BIGINT,
  expired_accounts BIGINT,
  past_due_accounts BIGINT,
  total_users BIGINT,
  active_users BIGINT,
  monthly_revenue DECIMAL(10,2),
  avg_revenue_per_company DECIMAL(10,2),
  growth_rate DECIMAL(5,2),
  cash_payments_pending BIGINT,
  cash_payments_verified BIGINT,
  trials_expiring_soon BIGINT
) AS $$
DECLARE
  v_total_companies BIGINT;
  v_active_subscriptions BIGINT;
  v_trial_accounts BIGINT;
  v_expired_accounts BIGINT;
  v_past_due_accounts BIGINT;
  v_total_users BIGINT;
  v_active_users BIGINT;
  v_monthly_revenue DECIMAL(10,2);
  v_avg_revenue_per_company DECIMAL(10,2);
  v_growth_rate DECIMAL(5,2);
  v_cash_payments_pending BIGINT;
  v_cash_payments_verified BIGINT;
  v_trials_expiring_soon BIGINT;
BEGIN
  -- Get subscription status counts
  SELECT
    COUNT(*) FILTER (WHERE status IN ('active', 'trial', 'past_due', 'cancelled')) as total_companies,
    COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
    COUNT(*) FILTER (WHERE status = 'trial') as trial_accounts,
    COUNT(*) FILTER (WHERE status = 'cancelled') as expired_accounts,
    COUNT(*) FILTER (WHERE status = 'past_due') as past_due_accounts
  INTO v_total_companies, v_active_subscriptions, v_trial_accounts, v_expired_accounts, v_past_due_accounts
  FROM user_subscriptions;

  -- Get user counts
  SELECT COUNT(*) INTO v_total_users FROM users;
  -- Estimate active users (users with active subscriptions)
  SELECT COUNT(DISTINCT u.id) INTO v_active_users
  FROM users u
  JOIN user_subscriptions us ON u.id = us.user_id
  WHERE us.status = 'active';

  -- Calculate monthly revenue from active subscriptions
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_revenue
  FROM user_subscriptions
  WHERE status = 'active';

  -- Calculate average revenue per company
  v_avg_revenue_per_company := CASE
    WHEN v_active_subscriptions > 0 THEN v_monthly_revenue / v_active_subscriptions
    ELSE 0
  END;

  -- Calculate growth rate (simplified - would need historical data)
  v_growth_rate := 15.5; -- Placeholder

  -- Get cash payment statistics
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'verified') as verified
  INTO v_cash_payments_pending, v_cash_payments_verified
  FROM cash_payments;

  -- Get trials expiring in next 7 days
  SELECT COUNT(*) INTO v_trials_expiring_soon
  FROM user_subscriptions
  WHERE status = 'trial'
  AND trial_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';

  -- Return all statistics
  RETURN QUERY SELECT
    v_total_companies,
    v_active_subscriptions,
    v_trial_accounts,
    v_expired_accounts,
    v_past_due_accounts,
    v_total_users,
    v_active_users,
    v_monthly_revenue,
    v_avg_revenue_per_company,
    v_growth_rate,
    v_cash_payments_pending,
    v_cash_payments_verified,
    v_trials_expiring_soon;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;