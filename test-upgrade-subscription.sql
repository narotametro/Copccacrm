-- ================================================================
-- TEST SUBSCRIPTION UPGRADE
-- ================================================================
-- Quick test to upgrade florenz@gmail.com from START to GROW plan
-- ================================================================

-- Check current subscription
SELECT 
  us.user_id,
  u.email,
  sp.name as current_plan,
  sp.display_name,
  sp.features,
  us.status,
  us.trial_end_date,
  us.current_period_end
FROM user_subscriptions us
JOIN users u ON u.id = us.user_id
JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE u.email = 'florenz@gmail.com'
AND us.status IN ('trial', 'active')
ORDER BY us.created_at DESC
LIMIT 1;

-- Upgrade to GROW plan
SELECT upgrade_user_subscription(
  (SELECT id FROM users WHERE email = 'florenz@gmail.com'),
  'grow',
  'monthly'
);

-- Verify the upgrade
SELECT 
  'AFTER UPGRADE' as status,
  us.user_id,
  u.email,
  sp.name as new_plan,
  sp.display_name,
  sp.features,
  us.status,
  us.trial_end_date,
  us.current_period_end,
  us.updated_at
FROM user_subscriptions us
JOIN users u ON u.id = us.user_id
JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE u.email = 'florenz@gmail.com'
AND us.status IN ('trial', 'active')
ORDER BY us.created_at DESC
LIMIT 1;

-- Check feature access
SELECT 
  user_has_feature(
    (SELECT id FROM users WHERE email = 'florenz@gmail.com'),
    'after_sales'
  ) as can_access_after_sales,
  user_has_feature(
    (SELECT id FROM users WHERE email = 'florenz@gmail.com'),
    'sales_pipeline'
  ) as can_access_sales_pipeline,
  user_has_feature(
    (SELECT id FROM users WHERE email = 'florenz@gmail.com'),
    'kpi_dashboard'
  ) as can_access_kpi_dashboard,
  user_has_feature(
    (SELECT id FROM users WHERE email = 'florenz@gmail.com'),
    'debt_collection'
  ) as can_access_debt_collection;
