-- =====================================================
-- ENABLE CASH PAYMENT SYSTEM - COMPLETE SETUP
-- =====================================================
-- Sets up all required data for cash payment recording
-- =====================================================

-- STEP 1: Create subscription plans if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Free') THEN
    INSERT INTO subscription_plans (
      name, display_name, description, 
      price_monthly, price_yearly, 
      features, 
      max_users, max_products, 
      max_pos_locations, max_inventory_locations,
      is_active
    )
    VALUES (
      'Free', 'Free Plan', 'Perfect for trying out COPCCA', 
      0, 0,
      '{"features": ["Up to 3 users", "100 products", "1 location", "Basic reports", "Email support"]}',
      3, 100,
      1, 1,
      true
    );
    RAISE NOTICE '✓ Created Free plan (1 POS + 1 Warehouse)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Starter') THEN
    INSERT INTO subscription_plans (
      name, display_name, description, 
      price_monthly, price_yearly, 
      features, 
      max_users, max_products, 
      max_pos_locations, max_inventory_locations,
      is_active
    )
    VALUES (
      'Starter', 'Starter Plan', 'For small businesses', 
      50000, 500000,
      name, display_name, description, 
      price_monthly, price_yearly, 
      features, 
      max_users, max_products, 
      max_pos_locations, max_inventory_locations,
      is_active
    )
    VALUES (
      'Professional', 'Professional Plan', 'For growing businesses', 
      150000, 1500000,
      '{"features": ["Up to 50 users", "Unlimited products", "Unlimited locations", "Custom reports", "24/7 support"]}',
      50, -1,
      -1, -1,
      true
    );
    RAISE NOTICE '✓ Created Professional plan (TZS 150,000/month, UNLIMITED locationsS + 3 Warehouses)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Professional') THEN
    INSERT INTO subscription_plans (
      name, display_name, description, 
      price_monthly, price_yearly, 
      features, 
      max_users, max_products, 
      max_pos_locations, max_inventory_locations,
      is_active
    )
    VALUES (
      'Enterprise', 'Enterprise Plan', 'For large organizations', 
      500000, 5000000,
      '{"features": ["Unlimited users", "Unlimited products", "Unlimited locations", "Dedicated support", "White label"]}',
      -1, -1,
      -1, -1,
      true
    );
    RAISE NOTICE '✓ Created Enterprise plan (TZS 500,000/month, UNLIMITED everythingth)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Enterprise') THEN
    INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, max_users, max_products, is_active)
    VALUES (
      'Enterprise', 'Enterprise Plan', 'For large organizations', 500000, 5000000,
      '{"features": ["Unlimited users", "Unlimited products", "Dedicated support", "White label"]}',
      -1, -1, true
    );
    RAISE NOTICE '✓ Created Enterprise plan (TZS 500,000/month)';
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
  '📋 AVAILABLE PLANS FOR CASH PAYMENT' as info,
  name,
  'TZS ' || COALESCE(price_monthly::TEXT, '0') as monthly_price,
  'TZS ' || COALESCE(price_yearly::TEXT, '0') as yearly_price,
  max_users || ' users' as user_limit,
  CASE WHEN max_products = -1 THEN 'Unlimited' ELSE max_products::TEXT END as product_limit,
  CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM subscription_plans
ORDER BY price_monthly ASC;

-- Verify cash payments table
SELECT 
  '✅ CASH PAYMENTS TABLE READY' as status,
  COUNT(*) as total_recorded_payments
FROM cash_payments;
