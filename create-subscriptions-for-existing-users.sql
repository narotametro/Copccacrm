-- Create subscription records for existing users who don't have one
-- This will give all existing users PRO plan subscriptions for now

-- First, ensure subscription plans exist
INSERT INTO subscription_plans (
  name, display_name, description, price_monthly, price_yearly, currency,
  max_users, max_products, max_invoices_monthly, max_pos_locations, max_inventory_locations,
  features, trial_days
) VALUES
  (
    'start',
    'START',
    'Perfect for micro-businesses, freelancers, and small shops getting started digitally',
    25000.00,
    250000.00,
    'TZS',
    1, 100, 100, 1, 1,
    '["dashboard", "customers_basic", "pos_system", "my_workplace"]'::jsonb,
    7
  ),
  (
    'grow',
    'GROW',
    'For growing retail shops, service businesses, and small distributors',
    80000.00,
    800000.00,
    'TZS',
    3, 500, 500, 2, 2,
    '["dashboard", "customers_basic", "pos_system", "sales_pipeline", "kpi_dashboard", "debt_collection", "admin_panel", "my_workplace"]'::jsonb,
    7
  ),
  (
    'pro',
    'PRO',
    'For established SMBs, small chains, and growing wholesalers',
    120000.00,
    1200000.00,
    'TZS',
    10, -1, -1, -1, -1,
    '["all_features"]'::jsonb,
    7
  )
ON CONFLICT (name) DO NOTHING;

-- Create PRO subscriptions for all users who don't have one
INSERT INTO user_subscriptions (
  user_id,
  plan_id,
  status,
  trial_start_date,
  trial_end_date,
  current_period_start,
  current_period_end
)
SELECT
  u.id as user_id,
  sp.id as plan_id,
  'active' as status,
  NOW() as trial_start_date,
  NOW() + INTERVAL '30 days' as trial_end_date,
  NOW() as current_period_start,
  NOW() + INTERVAL '30 days' as current_period_end
FROM users u
CROSS JOIN subscription_plans sp
WHERE sp.name = 'pro'
AND NOT EXISTS (
  SELECT 1 FROM user_subscriptions us WHERE us.user_id = u.id
);

-- Show the results
SELECT
  u.email,
  u.full_name,
  sp.display_name as plan_name,
  us.status,
  us.trial_end_date,
  us.current_period_end
FROM users u
JOIN user_subscriptions us ON u.id = us.user_id
JOIN subscription_plans sp ON us.plan_id = sp.id
ORDER BY u.created_at DESC;