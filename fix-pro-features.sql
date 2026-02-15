-- ================================================================
-- FIX PRO PLAN FEATURES - ADD ALL FEATURES
-- ================================================================

-- Check current PRO plan features
SELECT 
  name,
  display_name,
  features,
  jsonb_array_length(features) as feature_count
FROM subscription_plans
WHERE name = 'pro';

-- Update PRO plan to include all features
UPDATE subscription_plans
SET features = '[
  "all_features",
  "dashboard",
  "customers_basic",
  "pos_system",
  "my_workplace",
  "after_sales",
  "sales_pipeline",
  "kpi_dashboard",
  "debt_collection",
  "admin_panel",
  "marketing_campaigns",
  "product_intelligence",
  "competitor_analysis",
  "advanced_analytics",
  "multi_user_collaboration"
]'::jsonb
WHERE name = 'pro';

-- Verify the update
SELECT 
  'AFTER UPDATE' as status,
  name,
  display_name,
  features,
  jsonb_array_length(features) as feature_count
FROM subscription_plans
WHERE name = 'pro';

-- Show all PRO features
SELECT 
  'PRO FEATURES' as plan,
  jsonb_array_elements_text(features) as feature_name
FROM subscription_plans
WHERE name = 'pro';

-- Verify complete plan comparison
SELECT 
  name as plan,
  display_name,
  jsonb_array_length(features) as feature_count,
  '👤 ' || CASE WHEN max_users = -1 THEN 'Unlimited' ELSE max_users::text END as users,
  '📦 ' || CASE WHEN max_products = -1 THEN 'Unlimited' ELSE max_products::text END as products,
  features @> '"all_features"'::jsonb as has_all_features_flag
FROM subscription_plans
ORDER BY 
  CASE name
    WHEN 'start' THEN 1
    WHEN 'grow' THEN 2
    WHEN 'pro' THEN 3
    WHEN 'enterprise' THEN 4
    ELSE 5
  END;
