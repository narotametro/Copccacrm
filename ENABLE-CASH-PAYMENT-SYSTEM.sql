-- =====================================================
-- ENABLE CASH PAYMENT SYSTEM - COMPLETE SETUP
-- =====================================================
-- Sets up all required data for cash payment recording
-- Based on actual COPCCA pricing: START, GROW, PRO
-- =====================================================

-- STEP 1: Create subscription plans if they don't exist
DO $$
BEGIN
  -- START Plan (TZS 25,000/month)
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'START') THEN
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
    RAISE NOTICE '✓ Created START plan (TZS 25,000/month)';
  END IF;
  
  -- GROW Plan (TZS 80,000/month)
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'GROW') THEN
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
    RAISE NOTICE '✓ Created GROW plan (TZS 80,000/month)';
  END IF;
  
  -- PRO Plan (TZS 120,000/month)
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'PRO') THEN
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
    RAISE NOTICE '✓ Created PRO plan (TZS 120,000/month, UNLIMITED)';
  END IF;
END $$;

-- STEP 2: Verify cash payments table exists
CREATE TABLE IF NOT EXISTS cash_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TZS',
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  collected_by UUID REFERENCES users(id),
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  payment_location TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  receipt_number TEXT UNIQUE,
  notes TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Enable RLS and policies
ALTER TABLE cash_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage cash payments" ON cash_payments;
CREATE POLICY "Admins can manage cash payments" ON cash_payments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- STEP 4: Grant permissions
GRANT ALL ON cash_payments TO authenticated;

-- STEP 5: Show summary
SELECT 
  '✅ SETUP COMPLETE - SUBSCRIPTION PLANS' as status,
  COUNT(*) as total_plans,
  COUNT(*) FILTER (WHERE is_active = true) as active_plans,
  MIN(price_monthly) as min_price_tzs,
  MAX(price_monthly) as max_price_tzs
FROM subscription_plans;

-- Show all available plans
SELECT 
  '📋 COPCCA SUBSCRIPTION PLANS' as info,
  name,
  'TZS ' || COALESCE(price_monthly::TEXT, '0') as monthly_price,
  'TZS ' || COALESCE(price_yearly::TEXT, '0') as yearly_price,
  max_users || ' users' as user_limit,
  CASE WHEN max_products = -1 THEN 'Unlimited' ELSE max_products::TEXT END as product_limit,
  CASE WHEN max_pos_locations = -1 THEN 'Unlimited' ELSE max_pos_locations::TEXT END || ' POS' as pos_limit,
  CASE WHEN max_inventory_locations = -1 THEN 'Unlimited' ELSE max_inventory_locations::TEXT END || ' Warehouse' as warehouse_limit,
  CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM subscription_plans
ORDER BY price_monthly ASC;

-- Verify cash payments table
SELECT 
  '✅ CASH PAYMENTS TABLE READY' as status,
  COUNT(*) as total_recorded_payments
FROM cash_payments;
