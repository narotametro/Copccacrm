-- =====================================================
-- ⚠️  CRITICAL: FIX SUBSCRIPTION PLAN FEATURES PERMANENTLY
-- =====================================================
-- ISSUE: Database has human-readable text ("KPI Tracking") 
--        but code checks for technical keys ("kpi_dashboard")
-- RESULT: GROW plan users see "Upgrade Plan" for features they paid for
-- FIX: Update ALL subscription plans with correct technical feature keys
-- =====================================================
-- Date: March 11, 2026
-- Affects: ALL USERS (START, GROW, PRO)
-- =====================================================

-- =====================================================
-- STEP 1: VERIFY CURRENT BROKEN STATE
-- =====================================================

SELECT 
  '❌ BEFORE FIX - BROKEN FEATURES' as status,
  name as plan,
  display_name,
  features as current_features_broken,
  'Human-readable text will NOT match code checks' as problem
FROM subscription_plans
WHERE name IN ('start', 'grow', 'pro', 'START', 'GROW', 'PRO')
ORDER BY 
  CASE LOWER(name)
    WHEN 'start' THEN 1
    WHEN 'grow' THEN 2
    WHEN 'pro' THEN 3
    ELSE 4
  END;

-- =====================================================
-- STEP 2: FIX START PLAN - 4 TECHNICAL FEATURES
-- =====================================================

UPDATE subscription_plans
SET features = '[
  "dashboard",
  "customers_basic",
  "pos_system",
  "my_workplace"
]'::jsonb
WHERE LOWER(name) = 'start';

-- =====================================================
-- STEP 3: FIX GROW PLAN - 8 TECHNICAL FEATURES
-- =====================================================

UPDATE subscription_plans
SET features = '[
  "dashboard",
  "customers_basic",
  "pos_system",
  "my_workplace",
  "customer_health",
  "kpi_dashboard",
  "debt_collection",
  "admin_panel"
]'::jsonb
WHERE LOWER(name) = 'grow';

-- =====================================================
-- STEP 4: FIX PRO PLAN - ALL FEATURES FLAG + COMPLETE LIST
-- =====================================================

UPDATE subscription_plans
SET features = '[
  "all_features",
  "dashboard",
  "customers_basic",
  "pos_system",
  "my_workplace",
  "customer_health",
  "sales_pipeline",
  "kpi_dashboard",
  "debt_collection",
  "admin_panel",
  "marketing_campaigns",
  "competitor_analysis",
  "product_intelligence",
  "reports_advanced",
  "reports_basic",
  "advanced_analytics",
  "multi_user_collaboration",
  "api_access",
  "custom_integrations",
  "white_label",
  "dedicated_support",
  "sla_guarantees"
]'::jsonb
WHERE LOWER(name) = 'pro';

-- =====================================================
-- STEP 5: VERIFY FIX - SHOW TECHNICAL KEYS
-- =====================================================

SELECT 
  '✅ AFTER FIX - TECHNICAL FEATURES' as status,
  name as plan,
  display_name,
  features as technical_features_correct,
  jsonb_array_length(features) as feature_count,
  'Technical keys match code checks' as solution
FROM subscription_plans
WHERE LOWER(name) IN ('start', 'grow', 'pro')
ORDER BY 
  CASE LOWER(name)
    WHEN 'start' THEN 1
    WHEN 'grow' THEN 2
    WHEN 'pro' THEN 3
    ELSE 4
  END;

-- =====================================================
-- STEP 6: DETAILED FEATURE BREAKDOWN PER PLAN
-- =====================================================

-- START Plan (4 features)
SELECT 
  '📦 START PLAN' as plan,
  'TZS 25,000/month' as price,
  '4 features' as total,
  feature_key,
  CASE feature_key
    WHEN 'dashboard' THEN '→ Dashboard (AI Center)'
    WHEN 'customers_basic' THEN '→ Customer 360 Management'
    WHEN 'pos_system' THEN '→ Sales Hub & POS'
    WHEN 'my_workplace' THEN '→ My Workplace (COPCCA Apps)'
    ELSE '→ ' || feature_key
  END as display_name
FROM subscription_plans
CROSS JOIN LATERAL jsonb_array_elements_text(features) as feature_key
WHERE LOWER(name) = 'start';

-- GROW Plan (8 features)
SELECT 
  '📈 GROW PLAN' as plan,
  'TZS 80,000/month' as price,
  '8 features' as total,
  feature_key,
  CASE feature_key
    WHEN 'dashboard' THEN '→ Dashboard (AI Center)'
    WHEN 'customers_basic' THEN '→ Customer 360 Management'
    WHEN 'pos_system' THEN '→ Sales Hub & POS'
    WHEN 'my_workplace' THEN '→ My Workplace (COPCCA Apps)'
    WHEN 'customer_health' THEN '→ After Sales & Task Management ⭐'
    WHEN 'kpi_dashboard' THEN '→ KPI Tracking ⭐'
    WHEN 'debt_collection' THEN '→ Debt Collection ⭐'
    WHEN 'admin_panel' THEN '→ Admin Panel ⭐'
    ELSE '→ ' || feature_key
  END as display_name
FROM subscription_plans
CROSS JOIN LATERAL jsonb_array_elements_text(features) as feature_key
WHERE LOWER(name) = 'grow';

-- PRO Plan (all_features flag)
SELECT 
  '🚀 PRO PLAN' as plan,
  'TZS 120,000/month' as price,
  'ALL FEATURES' as total,
  feature_key,
  CASE 
    WHEN feature_key = 'all_features' 
      THEN '→ ✨ ALL FEATURES FLAG (grants everything)'
    WHEN feature_key = 'sales_pipeline' 
      THEN '→ Sales Pipeline ⭐⭐'
    WHEN feature_key = 'marketing_campaigns' 
      THEN '→ Marketing Campaigns ⭐⭐'
    WHEN feature_key = 'competitor_analysis' 
      THEN '→ Competitor Analysis ⭐⭐'
    WHEN feature_key = 'product_intelligence' 
      THEN '→ Product Intelligence ⭐⭐'
    ELSE '→ ' || feature_key
  END as display_name
FROM subscription_plans
CROSS JOIN LATERAL jsonb_array_elements_text(features) as feature_key
WHERE LOWER(name) = 'pro'
LIMIT 10;

-- =====================================================
-- STEP 7: CODE-TO-FEATURE MAPPING VERIFICATION
-- =====================================================

DO $$
DECLARE
  grow_features jsonb;
  has_kpi boolean;
  has_debt boolean;
  has_after_sales boolean;
BEGIN
  -- Get GROW plan features
  SELECT features INTO grow_features
  FROM subscription_plans
  WHERE LOWER(name) = 'grow';

  -- Check if technical keys exist (what code checks for)
  has_kpi := grow_features @> '"kpi_dashboard"'::jsonb;
  has_debt := grow_features @> '"debt_collection"'::jsonb;
  has_after_sales := grow_features @> '"customer_health"'::jsonb;

  RAISE NOTICE '🔍 GROW PLAN CODE COMPATIBILITY CHECK:';
  RAISE NOTICE '✅ kpi_dashboard (KPI Tracking page): %', has_kpi;
  RAISE NOTICE '✅ debt_collection (Debt Collection page): %', has_debt;
  RAISE NOTICE '✅ customer_health (After Sales page): %', has_after_sales;
  
  IF has_kpi AND has_debt AND has_after_sales THEN
    RAISE NOTICE '✅✅✅ GROW USERS WILL SEE ALL 8 FEATURES!';
  ELSE
    RAISE NOTICE '❌ GROW users will still see "Upgrade Plan" messages!';
  END IF;
END $$;

-- =====================================================
-- STEP 8: FINAL SUMMARY
-- =====================================================

SELECT 
  '✅ SUBSCRIPTION FEATURES FIXED PERMANENTLY' as status,
  'START' as plan_1,
  '4 features' as start_total,
  'GROW' as plan_2,
  '8 features' as grow_total,
  'PRO' as plan_3,
  'ALL features' as pro_total;

-- =====================================================
-- ✅ FIX COMPLETE
-- =====================================================
-- 
-- WHAT CHANGED:
-- 1. START plan: 4 technical feature keys (dashboard, customers_basic, pos_system, my_workplace)
-- 2. GROW plan: 8 technical feature keys INCLUDING kpi_dashboard, debt_collection, customer_health
-- 3. PRO plan: all_features flag + complete technical key list
-- 
-- RESULT FOR GROW USERS:
-- ✅ KPI Tracking page: NOW ACCESSIBLE (code checks for "kpi_dashboard")
-- ✅ Debt Collection page: NOW ACCESSIBLE (code checks for "debt_collection")
-- ✅ After Sales page: NOW ACCESSIBLE (code checks for "customer_health")
-- ✅ Admin Panel: NOW ACCESSIBLE (code checks for "admin_panel")
-- ✅ My Workplace: ACCESSIBLE (code checks for "my_workplace")
-- ✅ Dashboard: ACCESSIBLE (code checks for "dashboard")
-- ✅ Customers: ACCESSIBLE (code checks for "customers_basic")
-- ✅ Sales Hub: ACCESSIBLE (code checks for "pos_system")
-- 
-- NO MORE "Upgrade Plan" MESSAGES FOR PAID FEATURES!
-- 
-- TABS PER PLAN:
-- - START: 4 tabs (Dashboard, Customers, Sales Hub, My Workplace)
-- - GROW: 8 tabs (START features + After Sales, KPI Tracking, Debt Collection, Admin Panel)
-- - PRO: ALL tabs (unlimited access via all_features flag)
-- 
-- =====================================================
