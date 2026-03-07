-- =====================================================
-- FIX SUBSCRIPTION PLANS - MATCH COPCCA PRICING PAGE
-- =====================================================
-- Updates/creates the correct 3 plans: START, GROW, PRO
-- Removes any incorrect plans (Free, Starter, Professional, Enterprise)
-- =====================================================

-- Delete incorrect old plans (if they exist)
DELETE FROM subscription_plans WHERE name IN ('Free', 'Starter', 'Professional', 'Enterprise');

-- Create or update START plan (TZS 25,000/month)
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
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  max_users = EXCLUDED.max_users,
  max_products = EXCLUDED.max_products,
  max_invoices_monthly = EXCLUDED.max_invoices_monthly,
  max_pos_locations = EXCLUDED.max_pos_locations,
  max_inventory_locations = EXCLUDED.max_inventory_locations,
  is_active = EXCLUDED.is_active;

-- Create or update GROW plan (TZS 80,000/month)
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
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  max_users = EXCLUDED.max_users,
  max_products = EXCLUDED.max_products,
  max_invoices_monthly = EXCLUDED.max_invoices_monthly,
  max_pos_locations = EXCLUDED.max_pos_locations,
  max_inventory_locations = EXCLUDED.max_inventory_locations,
  is_active = EXCLUDED.is_active;

-- Create or update PRO plan (TZS 120,000/month)
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
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  max_users = EXCLUDED.max_users,
  max_products = EXCLUDED.max_products,
  max_invoices_monthly = EXCLUDED.max_invoices_monthly,
  max_pos_locations = EXCLUDED.max_pos_locations,
  max_inventory_locations = EXCLUDED.max_inventory_locations,
  is_active = EXCLUDED.is_active;

-- Show results
SELECT 
  '✅ COPCCA SUBSCRIPTION PLANS (FROM PRICING PAGE)' as status,
  name,
  'TZS ' || COALESCE(price_monthly::TEXT, '0') as monthly_price,
  'TZS ' || COALESCE(price_yearly::TEXT, '0') as yearly_price,
  max_users || ' users' as users,
  CASE WHEN max_products = -1 THEN 'Unlimited' ELSE max_products::TEXT END as products,
  CASE WHEN max_invoices_monthly = -1 THEN 'Unlimited' ELSE max_invoices_monthly::TEXT || '/mo' END as invoices,
  CASE WHEN max_pos_locations = -1 THEN 'Unlimited' ELSE max_pos_locations::TEXT END as pos_locations,
  CASE WHEN max_inventory_locations = -1 THEN 'Unlimited' ELSE max_inventory_locations::TEXT END as warehouses,
  CASE WHEN is_active THEN '✅' ELSE '❌' END as active
FROM subscription_plans
ORDER BY price_monthly ASC;
