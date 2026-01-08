-- ============================================
-- COPCCA CRM DATABASE UPGRADE MIGRATION
-- From: Basic Schema
-- To: Full Feature Set (2026 v2.0)
-- Date: January 8, 2026
-- ============================================
-- SAFE TO RUN: This script checks for existing columns/tables before adding
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. ADD NEW COLUMNS TO companies TABLE (Customer 360 Features)
DO $$
BEGIN
    -- Add customer_type if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='companies' AND column_name='customer_type') THEN
        ALTER TABLE companies ADD COLUMN customer_type TEXT DEFAULT 'prospect' 
        CHECK (customer_type IN ('prospect', 'customer', 'partner', 'competitor'));
    END IF;

    -- Add churn_risk if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='companies' AND column_name='churn_risk') THEN
        ALTER TABLE companies ADD COLUMN churn_risk TEXT DEFAULT 'low' 
        CHECK (churn_risk IN ('low', 'medium', 'high'));
    END IF;

    -- Add upsell_potential if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='companies' AND column_name='upsell_potential') THEN
        ALTER TABLE companies ADD COLUMN upsell_potential TEXT DEFAULT 'low' 
        CHECK (upsell_potential IN ('low', 'medium', 'high'));
    END IF;

    -- Add total_revenue if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='companies' AND column_name='total_revenue') THEN
        ALTER TABLE companies ADD COLUMN total_revenue DECIMAL DEFAULT 0;
    END IF;

    -- Add last_interaction if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='companies' AND column_name='last_interaction') THEN
        ALTER TABLE companies ADD COLUMN last_interaction TIMESTAMPTZ;
    END IF;

    -- Add pain_points if not exists (JSON array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='companies' AND column_name='pain_points') THEN
        ALTER TABLE companies ADD COLUMN pain_points JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add feedback_history if not exists (JSON array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='companies' AND column_name='feedback_history') THEN
        ALTER TABLE companies ADD COLUMN feedback_history JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add social_media if not exists (JSON object)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='companies' AND column_name='social_media') THEN
        ALTER TABLE companies ADD COLUMN social_media JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. ADD NEW COLUMNS TO competitors TABLE (Deep Intelligence)
DO $$
BEGIN
    -- Add usp if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='usp') THEN
        ALTER TABLE competitors ADD COLUMN usp TEXT;
    END IF;

    -- Add package_design if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='package_design') THEN
        ALTER TABLE competitors ADD COLUMN package_design TEXT;
    END IF;

    -- Add key_features if not exists (JSON array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='key_features') THEN
        ALTER TABLE competitors ADD COLUMN key_features JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add distribution_channels if not exists (JSON array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='distribution_channels') THEN
        ALTER TABLE competitors ADD COLUMN distribution_channels JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add marketing_channels if not exists (JSON array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='marketing_channels') THEN
        ALTER TABLE competitors ADD COLUMN marketing_channels JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add threat_level if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='threat_level') THEN
        ALTER TABLE competitors ADD COLUMN threat_level TEXT DEFAULT 'low' 
        CHECK (threat_level IN ('low', 'medium', 'high', 'critical'));
    END IF;

    -- Add market_position if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='market_position') THEN
        ALTER TABLE competitors ADD COLUMN market_position TEXT DEFAULT 'follower' 
        CHECK (market_position IN ('leader', 'challenger', 'follower', 'niche'));
    END IF;

    -- Add last_activity if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='last_activity') THEN
        ALTER TABLE competitors ADD COLUMN last_activity TEXT;
    END IF;

    -- Add product_quality_score if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='product_quality_score') THEN
        ALTER TABLE competitors ADD COLUMN product_quality_score INTEGER CHECK (product_quality_score >= 1 AND product_quality_score <= 10);
    END IF;

    -- Add pricing_strategy_score if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='pricing_strategy_score') THEN
        ALTER TABLE competitors ADD COLUMN pricing_strategy_score INTEGER CHECK (pricing_strategy_score >= 1 AND pricing_strategy_score <= 10);
    END IF;

    -- Add innovation_level if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='innovation_level') THEN
        ALTER TABLE competitors ADD COLUMN innovation_level INTEGER CHECK (innovation_level >= 1 AND innovation_level <= 10);
    END IF;

    -- Add customer_satisfaction_score if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='customer_satisfaction_score') THEN
        ALTER TABLE competitors ADD COLUMN customer_satisfaction_score INTEGER CHECK (customer_satisfaction_score >= 1 AND customer_satisfaction_score <= 10);
    END IF;

    -- Add target_audience if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='target_audience') THEN
        ALTER TABLE competitors ADD COLUMN target_audience TEXT;
    END IF;

    -- Add customer_pain_points if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitors' AND column_name='customer_pain_points') THEN
        ALTER TABLE competitors ADD COLUMN customer_pain_points TEXT;
    END IF;
END $$;

-- 3. ADD NEW COLUMNS TO after_sales TABLE (Task Management)
DO $$
BEGIN
    -- Add task_type if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='after_sales' AND column_name='task_type') THEN
        ALTER TABLE after_sales ADD COLUMN task_type TEXT DEFAULT 'support' 
        CHECK (task_type IN ('support', 'follow-up', 'issue', 'claim', 'research'));
    END IF;

    -- Add priority if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='after_sales' AND column_name='priority') THEN
        ALTER TABLE after_sales ADD COLUMN priority TEXT DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    END IF;

    -- Add is_overdue if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='after_sales' AND column_name='is_overdue') THEN
        ALTER TABLE after_sales ADD COLUMN is_overdue BOOLEAN DEFAULT false;
    END IF;

    -- Add days_overdue if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='after_sales' AND column_name='days_overdue') THEN
        ALTER TABLE after_sales ADD COLUMN days_overdue INTEGER DEFAULT 0;
    END IF;

    -- Add feedback if not exists (JSON array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='after_sales' AND column_name='feedback') THEN
        ALTER TABLE after_sales ADD COLUMN feedback JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add due_date if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='after_sales' AND column_name='due_date') THEN
        ALTER TABLE after_sales ADD COLUMN due_date DATE;
    END IF;

    -- Add assigned_by if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='after_sales' AND column_name='assigned_by') THEN
        ALTER TABLE after_sales ADD COLUMN assigned_by TEXT;
    END IF;
END $$;

-- 4. CREATE products TABLE (if not exists)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  units_sold INTEGER DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  profit_margin DECIMAL DEFAULT 0,
  market_position TEXT DEFAULT 'follower' CHECK (market_position IN ('leader', 'challenger', 'follower', 'niche')),
  growth_rate DECIMAL DEFAULT 0,
  customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE user_permissions TABLE (Admin Panel)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_name)
);

-- 6. CREATE invitation_links TABLE (Invitation System)
CREATE TABLE IF NOT EXISTS invitation_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
  created_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ADD RLS POLICIES FOR NEW TABLES
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_links ENABLE ROW LEVEL SECURITY;

-- Products policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Authenticated users can access products') THEN
        CREATE POLICY "Authenticated users can access products" ON products FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- User permissions policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_permissions' AND policyname = 'Users can view own permissions') THEN
        CREATE POLICY "Users can view own permissions" ON user_permissions FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_permissions' AND policyname = 'Admins can manage all permissions') THEN
        CREATE POLICY "Admins can manage all permissions" ON user_permissions FOR ALL USING (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;
END $$;

-- Invitation links policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invitation_links' AND policyname = 'Admins can manage invitations') THEN
        CREATE POLICY "Admins can manage invitations" ON invitation_links FOR ALL USING (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;
END $$;

-- 8. ADD TRIGGERS FOR NEW TABLES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
        CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_permissions_updated_at') THEN
        CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 9. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_companies_customer_type ON companies(customer_type);
CREATE INDEX IF NOT EXISTS idx_companies_churn_risk ON companies(churn_risk);
CREATE INDEX IF NOT EXISTS idx_competitors_threat_level ON competitors(threat_level);
CREATE INDEX IF NOT EXISTS idx_competitors_market_position ON competitors(market_position);
CREATE INDEX IF NOT EXISTS idx_after_sales_priority ON after_sales(priority);
CREATE INDEX IF NOT EXISTS idx_after_sales_is_overdue ON after_sales(is_overdue);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_market_position ON products(market_position);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_links_token ON invitation_links(token);
CREATE INDEX IF NOT EXISTS idx_invitation_links_email ON invitation_links(email);

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- Next steps:
-- 1. Update your .env file with Supabase credentials
-- 2. Remove demo mode from authStore.ts
-- 3. Test all features with real database
-- ============================================
