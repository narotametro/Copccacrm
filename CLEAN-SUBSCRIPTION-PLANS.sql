-- =====================================================
-- CLEAN UP SUBSCRIPTION PLANS - REMOVE ALL DUPLICATES
-- =====================================================
-- Deletes ALL existing plans and creates only the 3 correct ones
-- =====================================================

-- Delete ALL existing subscription plans (case-insensitive)
DELETE FROM subscription_plans 
WHERE UPPER(name) IN ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'START', 'GROW', 'PRO');

-- Create START plan (TZS 25,000/month)
INSERT INTO subscription_plans (
  name, display_name, description, 
  price_monthly, price_yearly, 
  features, 
  max_users, max_products, max_invoices_monthly,
  max_pos_locations, max_inventory_locations,
  is_active
)
VALUES (
  'START', 'START', 'Perfect for micro-businesses', 
  25000, 250000,
  '{"features": ["1 user", "100 products", "100 invoices/month", "1 POS location", "Dashboard", "Customer Management", "Advanced POS", "My Workplace"]}',
  1, 100, 100,
  1, 1,
  true
);

-- Create GROW plan (TZS 80,000/month)
INSERT INTO subscription_plans (
  name, display_name, description, 
  price_monthly, price_yearly, 
  features, 
  max_users, max_products, max_invoices_monthly,
  max_pos_locations, max_inventory_locations,
  is_active
)
VALUES (
  'GROW', 'GROW', 'Grow your business with POS', 
  80000, 800000,
  '{"features": ["Up to 3 users", "500 products", "500 invoices/month", "2 POS locations", "2 Inventory locations", "After Sales", "KPI Tracking", "Debt Collection", "Admin Panel"]}',
  3, 500, 500,
  2, 2,
  true
);

-- Create PRO plan (TZS 120,000/month)
INSERT INTO subscription_plans (
  name, display_name, description, 
  price_monthly, price_yearly, 
  features, 
  max_users, max_products, max_invoices_monthly,
  max_pos_locations, max_inventory_locations,
  is_active
)
VALUES (
  'PRO', 'PRO', 'Complete business platform', 
  120000, 1200000,
  '{"features": ["Up to 10 users", "Unlimited products", "Unlimited invoices", "Unlimited POS locations", "Unlimited Inventory locations", "ALL FEATURES INCLUDED", "Sales Pipeline", "Marketing Campaigns", "Product Intelligence", "Advanced Analytics"]}',
  10, -1, -1,
  -1, -1,
  true
);

-- Show final result
SELECT 
  '✅ CLEAN SUBSCRIPTION PLANS' as status,
  name,
  'TZS ' || price_monthly::TEXT as monthly,
  'TZS ' || price_yearly::TEXT as yearly,
  max_users || ' users' as users,
  CASE WHEN max_products = -1 THEN 'Unlimited' ELSE max_products::TEXT END as products,
  CASE WHEN max_invoices_monthly = -1 THEN 'Unlimited' ELSE max_invoices_monthly::TEXT || '/mo' END as invoices,
  CASE WHEN max_pos_locations = -1 THEN 'Unlimited' ELSE max_pos_locations::TEXT END as pos,
  CASE WHEN max_inventory_locations = -1 THEN 'Unlimited' ELSE max_inventory_locations::TEXT END as warehouses
FROM subscription_plans
ORDER BY price_monthly ASC;

-- Count to verify only 3 plans
SELECT 
  '📊 TOTAL PLANS' as check,
  COUNT(*) as should_be_3
FROM subscription_plans;
