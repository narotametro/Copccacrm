-- =====================================================
-- CHECK AND POPULATE SUBSCRIPTION PLANS
-- =====================================================
-- Verify subscription plans exist for cash payment system
-- =====================================================

-- Check existing subscription plans
SELECT 
  '📊 CURRENT SUBSCRIPTION PLANS' as status,
  id,
  name,
  price_monthly,
  price_yearly,
  features,
  is_active,
  created_at
FROM subscription_plans
ORDER BY price_monthly ASC;

-- Count plans
SELECT 
  COUNT(*) as total_plans,
  COUNT(*) FILTER (WHERE is_active = true) as active_plans
FROM subscription_plans;

-- If no plans exist, create default plans
DO $$
BEGIN
  -- Check if plans exist
  IF NOT EXISTS (SELECT 1 FROM subscription_plans LIMIT 1) THEN
    RAISE NOTICE '⚠️ No subscription plans found. Creating default plans...';
    
    -- Free Plan
    INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_users, max_products, is_active)
    VALUES (
      'Free',
      'Perfect for trying out COPCCA',
      0,
      0,
      '{"features": ["Up to 3 users", "100 products", "Basic reports", "Email support"]}',
      3,
      100,
      true
    );
    
    -- Starter Plan
    INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_users, max_products, is_active)
    VALUES (
      'Starter',
      'For small businesses getting started',
      50000,
      500000,
      '{"features": ["Up to 10 users", "1000 products", "Advanced reports", "Priority support", "Multi-location"]}',
      10,
      1000,
      true
    );
    
    -- Professional Plan
    INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_users, max_products, is_active)
    VALUES (
      'Professional',
      'For growing businesses',
      150000,
      1500000,
      '{"features": ["Up to 50 users", "Unlimited products", "Custom reports", "24/7 support", "API access", "Advanced analytics"]}',
      50,
      -1,
      true
    );
    
    -- Enterprise Plan
    INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_users, max_products, is_active)
    VALUES (
      'Enterprise',
      'For large organizations',
      500000,
      5000000,
      '{"features": ["Unlimited users", "Unlimited products", "Custom integrations", "Dedicated support", "White label", "SLA guarantee"]}',
      -1,
      -1,
      true
    );
    
    RAISE NOTICE '✅ Created 4 default subscription plans';
  ELSE
    RAISE NOTICE '✅ Subscription plans already exist';
  END IF;
END $$;

-- Show all plans after creation
SELECT 
  '✅ ALL SUBSCRIPTION PLANS' as status,
  id,
  name,
  price_monthly as monthly_tzs,
  price_yearly as yearly_tzs,
  max_users,
  max_products,
  is_active
FROM subscription_plans
ORDER BY price_monthly ASC;
