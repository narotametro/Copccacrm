-- ================================================================
-- ADD PLAN LIMITS TO SUBSCRIPTION PLANS
-- ================================================================
-- Adds limit columns and updates plans with correct limits from pricing page
-- ================================================================

-- Add limit columns to subscription_plans table
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_invoices_monthly INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_pos_locations INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_inventory_locations INTEGER DEFAULT 1;

-- Update START plan limits
UPDATE subscription_plans
SET 
  max_users = 1,
  max_products = 100,
  max_invoices_monthly = 100,
  max_pos_locations = 1,
  max_inventory_locations = 1
WHERE name = 'start';

-- Update GROW plan limits
UPDATE subscription_plans
SET 
  max_users = 3,
  max_products = 500,
  max_invoices_monthly = 500,
  max_pos_locations = 2,
  max_inventory_locations = 2
WHERE name = 'grow';

-- Update PRO plan limits (unlimited = -1)
UPDATE subscription_plans
SET 
  max_users = 10,
  max_products = -1,  -- -1 means unlimited
  max_invoices_monthly = -1,
  max_pos_locations = -1,
  max_inventory_locations = -1
WHERE name = 'pro';

-- Update ENTERPRISE plan limits if exists
UPDATE subscription_plans
SET 
  max_users = -1,
  max_products = -1,
  max_invoices_monthly = -1,
  max_pos_locations = -1,
  max_inventory_locations = -1
WHERE name = 'enterprise';

-- Verify the limits
SELECT 
  name,
  display_name,
  max_users,
  max_products,
  max_invoices_monthly,
  max_pos_locations,
  max_inventory_locations,
  CASE 
    WHEN max_products = -1 THEN '♾️ Unlimited'
    ELSE max_products::text
  END as products_display,
  CASE 
    WHEN max_invoices_monthly = -1 THEN '♾️ Unlimited'
    ELSE max_invoices_monthly::text || '/month'
  END as invoices_display
FROM subscription_plans
ORDER BY 
  CASE name
    WHEN 'start' THEN 1
    WHEN 'grow' THEN 2
    WHEN 'pro' THEN 3
    WHEN 'enterprise' THEN 4
    ELSE 5
  END;

-- Show complete plan details
SELECT 
  name as plan,
  display_name,
  '👤 ' || max_users::text as users,
  '📦 ' || CASE WHEN max_products = -1 THEN 'Unlimited' ELSE max_products::text END as products,
  '📄 ' || CASE WHEN max_invoices_monthly = -1 THEN 'Unlimited' ELSE max_invoices_monthly::text || '/mo' END as invoices,
  '🏪 ' || CASE WHEN max_pos_locations = -1 THEN 'Unlimited' ELSE max_pos_locations::text END as pos_locations,
  '📊 ' || CASE WHEN max_inventory_locations = -1 THEN 'Unlimited' ELSE max_inventory_locations::text END as inventory_locations,
  jsonb_array_length(features) as feature_count
FROM subscription_plans
ORDER BY 
  CASE name
    WHEN 'start' THEN 1
    WHEN 'grow' THEN 2
    WHEN 'pro' THEN 3
    WHEN 'enterprise' THEN 4
    ELSE 5
  END;
