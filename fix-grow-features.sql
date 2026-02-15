-- ================================================================
-- FIX GROW PLAN FEATURES - EXACTLY 8 FEATURES
-- ================================================================
-- Remove unrelated features from GROW plan
-- ================================================================

-- Check current GROW plan features
SELECT 
  'CURRENT GROW FEATURES' as status,
  jsonb_array_elements_text(features) as feature_name
FROM subscription_plans
WHERE name = 'grow';

-- Update GROW plan with exactly 8 features
UPDATE subscription_plans
SET features = '[
  "dashboard",
  "customers_basic",
  "pos_system",
  "my_workplace",
  "after_sales",
  "kpi_dashboard",
  "debt_collection",
  "admin_panel"
]'::jsonb
WHERE name = 'grow';

-- Verify the update
SELECT 
  'AFTER UPDATE' as status,
  name,
  display_name,
  jsonb_array_length(features) as feature_count,
  features
FROM subscription_plans
WHERE name = 'grow';

-- Show all GROW features with labels
SELECT 
  'GROW FEATURES (8)' as plan,
  feature_name,
  CASE feature_name
    WHEN 'dashboard' THEN '→ Dashboard (AI Center)'
    WHEN 'customers_basic' THEN '→ Customer Management (Customer 360)'
    WHEN 'pos_system' THEN '→ Advanced POS (Sales Hub)'
    WHEN 'my_workplace' THEN '→ My Workplace (COPCCA Apps)'
    WHEN 'after_sales' THEN '→ After Sales & Task Management'
    WHEN 'kpi_dashboard' THEN '→ KPI Tracking'
    WHEN 'debt_collection' THEN '→ Debt Collection'
    WHEN 'admin_panel' THEN '→ Admin Panel'
    ELSE '→ ' || feature_name
  END as display_name
FROM subscription_plans
CROSS JOIN LATERAL jsonb_array_elements_text(features) as feature_name
WHERE name = 'grow';

-- Verify all plans
SELECT 
  name as plan,
  display_name,
  jsonb_array_length(features) as feature_count,
  '👤 ' || CASE WHEN max_users = -1 THEN 'Unlimited' ELSE max_users::text END as users,
  '📦 ' || CASE WHEN max_products = -1 THEN 'Unlimited' ELSE max_products::text END as products
FROM subscription_plans
ORDER BY 
  CASE name
    WHEN 'start' THEN 1
    WHEN 'grow' THEN 2
    WHEN 'pro' THEN 3
    WHEN 'enterprise' THEN 4
    ELSE 5
  END;
