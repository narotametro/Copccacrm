-- ================================================================
-- ADD AFTER_SALES FEATURE TO GROW PLAN
-- ================================================================

-- Show current GROW plan features
SELECT 
  name,
  display_name,
  features
FROM subscription_plans
WHERE name = 'grow';

-- Add after_sales to GROW plan
UPDATE subscription_plans
SET features = jsonb_insert(
  features,
  '{0}',  -- Insert at the beginning of array
  '"after_sales"'::jsonb
)
WHERE name = 'grow'
AND NOT (features @> '"after_sales"'::jsonb);

-- Also add to PRO plan if missing
UPDATE subscription_plans
SET features = jsonb_insert(
  features,
  '{0}',
  '"after_sales"'::jsonb
)
WHERE name = 'pro'
AND NOT (features @> '"after_sales"'::jsonb);

-- Verify the update
SELECT 
  'AFTER UPDATE' as status,
  name,
  display_name,
  features,
  jsonb_array_length(features) as feature_count,
  features @> '"after_sales"'::jsonb as has_after_sales
FROM subscription_plans
WHERE name IN ('grow', 'pro')
ORDER BY name;

-- Show all features for GROW plan
SELECT 
  'GROW FEATURES' as plan,
  jsonb_array_elements_text(features) as feature_name
FROM subscription_plans
WHERE name = 'grow';

-- Test feature access again
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
  ) as can_access_kpi_dashboard;
