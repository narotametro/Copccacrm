-- =====================================================
-- FIX SUBSCRIPTION PLAN LOCATION LIMITS
-- =====================================================
-- Updates existing subscription plans to have proper location limits
-- =====================================================

-- Update Free plan
UPDATE subscription_plans
SET 
  max_pos_locations = 1,
  max_inventory_locations = 1,
  features = '{"features": ["Up to 3 users", "100 products", "1 location each", "Basic reports", "Email support"]}'
WHERE name = 'Free';

-- Update Starter plan  
UPDATE subscription_plans
SET 
  max_pos_locations = 3,
  max_inventory_locations = 3,
  features = '{"features": ["Up to 10 users", "1000 products", "Up to 3 locations", "Advanced reports", "Priority support"]}'
WHERE name = 'Starter';

-- Update Professional plan (UNLIMITED)
UPDATE subscription_plans
SET 
  max_pos_locations = -1,
  max_inventory_locations = -1,
  features = '{"features": ["Up to 50 users", "Unlimited products", "Unlimited locations", "Custom reports", "24/7 support"]}'
WHERE name = 'Professional';

-- Update Enterprise plan (UNLIMITED)
UPDATE subscription_plans
SET 
  max_pos_locations = -1,
  max_inventory_locations = -1,
  features = '{"features": ["Unlimited users", "Unlimited products", "Unlimited locations", "Dedicated support", "White label"]}'
WHERE name = 'Enterprise';

-- Show results
SELECT 
  '✅ UPDATED SUBSCRIPTION PLANS WITH LOCATION LIMITS' as status,
  name,
  'TZS ' || COALESCE(price_monthly::TEXT, '0') as monthly_price,
  max_users || ' users' as user_limit,
  CASE WHEN max_products = -1 THEN 'Unlimited' ELSE max_products::TEXT END as product_limit,
  CASE WHEN max_pos_locations = -1 THEN 'Unlimited' ELSE max_pos_locations::TEXT END as pos_limit,
  CASE WHEN max_inventory_locations = -1 THEN 'Unlimited' ELSE max_inventory_locations::TEXT END as warehouse_limit,
  CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM subscription_plans
ORDER BY price_monthly ASC;
