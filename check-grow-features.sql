-- ================================================================
-- CHECK GROW PLAN FEATURES
-- ================================================================

-- Show all subscription plans with their features
SELECT 
  name,
  display_name,
  features,
  jsonb_array_length(features) as feature_count
FROM subscription_plans
ORDER BY name;

-- Check specifically for after_sales variations
SELECT 
  name,
  display_name,
  features,
  features ? 'after_sales' as has_after_sales,
  features ? 'after-sales' as has_after_sales_hyphen,
  features ? 'aftersales' as has_aftersales,
  features @> '"after_sales"'::jsonb as contains_after_sales,
  features @> '"after-sales"'::jsonb as contains_after_sales_hyphen
FROM subscription_plans
WHERE name = 'grow';

-- Show each feature individually for GROW plan
SELECT 
  jsonb_array_elements_text(features) as feature_name
FROM subscription_plans
WHERE name = 'grow';
