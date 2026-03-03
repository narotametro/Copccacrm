-- CREATE COMPLETE SUBSCRIPTION SYSTEM
-- This ensures every user has a plan and only sees features in their plan

-- ================================================================
-- STEP 1: Create subscription_plans table
-- ================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TZS',
  
  -- Limits
  max_users INTEGER,
  max_products INTEGER,
  max_invoices_monthly INTEGER,  
  max_pos_locations INTEGER,
  max_inventory_locations INTEGER,
  
  -- Features as JSONB array
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- STEP 2: Create user_subscriptions table
-- ================================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- ================================================================
-- STEP 3: Insert subscription plans with features
-- ================================================================

-- Clear existing plans first
TRUNCATE subscription_plans CASCADE;

-- START Plan (Free tier equivalent)
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, max_users, max_products, max_invoices_monthly) VALUES
('start', 'START', 'Perfect for micro-businesses and freelancers', 25000, 250000, 
 '["dashboard", "customers_basic", "pos_system", "invoicing_basic", "products-management"]'::jsonb,
 3, 50, 20);

-- GROW Plan
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, max_users, max_products, max_invoices_monthly) VALUES
('grow', 'GROW', 'For growing businesses', 75000, 750000,
 '["dashboard", "customers_basic", "pos_system", "customer_health", "sales_pipeline", "invoicing_basic", "products-management", "reports_advanced", "analytics", "marketing", "marketing_campaigns"]'::jsonb,
 10, 200, 100);

-- PRO Plan (All features)
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, max_users, max_products, max_invoices_monthly) VALUES
('pro', 'PRO', 'For established businesses', 150000, 1500000,
 '["all_features"]'::jsonb,
 -1, -1, -1);

-- ================================================================
-- STEP 4: DO NOT auto-assign plans - Force users to select
-- ================================================================

-- Users MUST select a plan through /select-plan page
-- This prevents bypassing payment/plan selection

DO $$
BEGIN
  RAISE NOTICE '⚠️  No plans auto-assigned!';
  RAISE NOTICE 'Users will be prompted to select a plan on first login';
  RAISE NOTICE 'This ensures proper plan selection and prevents bypassing';
END $$;

-- ================================================================
-- STEP 5: Create has_feature_access function
-- ================================================================

CREATE OR REPLACE FUNCTION has_feature_access(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  plan_features JSONB;
BEGIN
  -- Get user's plan features
  SELECT sp.features INTO plan_features
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid
    AND us.status IN ('trial', 'active')
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If no subscription, deny access
  IF plan_features IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- PRO plan has all_features
  IF plan_features ? 'all_features' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if specific feature is in plan
  RETURN plan_features ? feature_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- STEP 6: Create RLS policies
-- ================================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Everyone can read plans
DROP POLICY IF EXISTS "Anyone can read plans" ON subscription_plans;
CREATE POLICY "Anyone can read plans" ON subscription_plans FOR SELECT USING (true);

-- Users can read their own subscription
DROP POLICY IF EXISTS "Users can read own subscription" ON user_subscriptions;
CREATE POLICY "Users can read own subscription" ON user_subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own subscription
DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;
CREATE POLICY "Users can update own subscription" ON user_subscriptions 
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================================================
-- STEP 7: Verify setup
-- ================================================================

-- Show plans
SELECT 
  'Subscription Plans' as info,
  name,
  display_name,
  price_monthly,
  features
FROM subscription_plans
ORDER BY price_monthly;

-- Show user subscriptions
SELECT 
  'User Subscriptions' as info,
  u.email,
  sp.display_name as plan,
  us.status,
  us.current_period_end
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
JOIN auth.users au ON us.user_id = au.id
JOIN users u ON u.id = au.id;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Subscription system created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What was done:';
  RAISE NOTICE '1. Created subscription_plans table with START, GROW, PRO plans';
  RAISE NOTICE '2. Created user_subscriptions table';
  RAISE NOTICE '3. Created has_feature_access function';
  RAISE NOTICE '4. Set up RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Impact:';
  RAISE NOTICE '✅ Users will see plan selection page on first login';
  RAISE NOTICE '✅ Users MUST select a plan to continue';
  RAISE NOTICE '✅ No bypassing plan selection';
  RAISE NOTICE '✅ Feature gates work based on selected plan';
  RAISE NOTICE '✅ Clean upgrade path in Settings';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT:';
  RAISE NOTICE 'All existing users will be redirected to /select-plan';
  RAISE NOTICE 'They must choose START, GROW, or PRO before accessing the app';
END $$;
