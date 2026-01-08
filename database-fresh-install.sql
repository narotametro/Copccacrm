-- ============================================
-- COPCCA CRM 2026 - COMPLETE DATABASE SCHEMA
-- Full Featured CRM with AI Intelligence
-- Date: January 8, 2026
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Enhanced with permissions)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. COMPANIES TABLE (Customer 360° View)
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  
  -- Status & Health
  status TEXT DEFAULT 'prospect' CHECK (status IN ('active', 'inactive', 'prospect')),
  customer_type TEXT DEFAULT 'prospect' CHECK (customer_type IN ('prospect', 'customer', 'partner', 'competitor')),
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  
  -- Business Insights
  churn_risk TEXT DEFAULT 'low' CHECK (churn_risk IN ('low', 'medium', 'high')),
  upsell_potential TEXT DEFAULT 'low' CHECK (upsell_potential IN ('low', 'medium', 'high')),
  total_revenue DECIMAL DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  
  -- Customer Performance Data (JSON)
  pain_points JSONB DEFAULT '[]'::jsonb,
  feedback_history JSONB DEFAULT '[]'::jsonb,
  social_media JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ============================================
-- 3. DEALS TABLE (Sales Pipeline)
-- ============================================
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value DECIMAL NOT NULL,
  stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PRODUCTS TABLE (Product Intelligence)
-- ============================================
CREATE TABLE products (
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

-- ============================================
-- 5. COMPETITORS TABLE (Competitive Intelligence)
-- ============================================
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  website TEXT,
  
  -- Strategic Analysis
  usp TEXT,
  package_design TEXT,
  strengths TEXT,
  weaknesses TEXT,
  target_audience TEXT,
  customer_pain_points TEXT,
  
  -- Market Intelligence
  market_share DECIMAL,
  pricing_strategy TEXT,
  threat_level TEXT DEFAULT 'low' CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  market_position TEXT DEFAULT 'follower' CHECK (market_position IN ('leader', 'challenger', 'follower', 'niche')),
  last_activity TEXT,
  
  -- Product & Strategy Scores
  product_quality_score INTEGER CHECK (product_quality_score >= 1 AND product_quality_score <= 10),
  pricing_strategy_score INTEGER CHECK (pricing_strategy_score >= 1 AND pricing_strategy_score <= 10),
  innovation_level INTEGER CHECK (innovation_level >= 1 AND innovation_level <= 10),
  customer_satisfaction_score INTEGER CHECK (customer_satisfaction_score >= 1 AND customer_satisfaction_score <= 10),
  
  -- Distribution & Marketing (JSON Arrays)
  key_features JSONB DEFAULT '[]'::jsonb,
  distribution_channels JSONB DEFAULT '[]'::jsonb,
  marketing_channels JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. AFTER_SALES TABLE (Task Management)
-- ============================================
CREATE TABLE after_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Task Details
  order_id TEXT NOT NULL,
  product TEXT NOT NULL,
  task_type TEXT DEFAULT 'support' CHECK (task_type IN ('support', 'follow-up', 'issue', 'claim', 'research')),
  
  -- Status & Priority
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'issue')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Dates & Overdue Tracking
  follow_up_date DATE,
  due_date DATE,
  is_overdue BOOLEAN DEFAULT false,
  days_overdue INTEGER DEFAULT 0,
  
  -- Performance & Feedback
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  feedback JSONB DEFAULT '[]'::jsonb,
  
  -- Assignment
  notes TEXT,
  assigned_to UUID REFERENCES users(id),
  assigned_by TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. DEBT_COLLECTION TABLE (Payment Tracking)
-- ============================================
CREATE TABLE debt_collection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reminded', 'overdue', 'paid', 'written_off')),
  days_overdue INTEGER DEFAULT 0,
  last_reminder_date DATE,
  notes TEXT,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. SALES_STRATEGIES TABLE (Marketing Campaigns)
-- ============================================
CREATE TABLE sales_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('campaign', 'promotion', 'outreach', 'event')),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  budget DECIMAL,
  target_audience TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  roi DECIMAL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. KPI_DATA TABLE (Analytics & Reporting)
-- ============================================
CREATE TABLE kpi_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  value DECIMAL NOT NULL,
  target DECIMAL,
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. INTERACTIONS TABLE (Activity Log)
-- ============================================
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('call', 'email', 'meeting', 'note')),
  subject TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. USER_PERMISSIONS TABLE (Access Control)
-- ============================================
CREATE TABLE user_permissions (
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

-- ============================================
-- 12. INVITATION_LINKS TABLE (User Invitations)
-- ============================================
CREATE TABLE invitation_links (
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

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Users Table Policies
CREATE POLICY "Users can read own data" ON users 
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own data" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- Companies Table Policies
CREATE POLICY "Authenticated users can read companies" ON companies 
  FOR SELECT USING (auth.role() = 'authenticated');
  
CREATE POLICY "Authenticated users can insert companies" ON companies 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
CREATE POLICY "Authenticated users can update companies" ON companies 
  FOR UPDATE USING (auth.role() = 'authenticated');
  
CREATE POLICY "Authenticated users can delete companies" ON companies 
  FOR DELETE USING (auth.role() = 'authenticated');

-- Deals Table Policies
CREATE POLICY "Authenticated users can access deals" ON deals 
  FOR ALL USING (auth.role() = 'authenticated');

-- Products Table Policies
CREATE POLICY "Authenticated users can access products" ON products 
  FOR ALL USING (auth.role() = 'authenticated');

-- Competitors Table Policies
CREATE POLICY "Authenticated users can access competitors" ON competitors 
  FOR ALL USING (auth.role() = 'authenticated');

-- After Sales Table Policies
CREATE POLICY "Authenticated users can access after_sales" ON after_sales 
  FOR ALL USING (auth.role() = 'authenticated');

-- Debt Collection Table Policies
CREATE POLICY "Authenticated users can access debt_collection" ON debt_collection 
  FOR ALL USING (auth.role() = 'authenticated');

-- Sales Strategies Table Policies
CREATE POLICY "Authenticated users can access sales_strategies" ON sales_strategies 
  FOR ALL USING (auth.role() = 'authenticated');

-- KPI Data Table Policies
CREATE POLICY "Authenticated users can access kpi_data" ON kpi_data 
  FOR ALL USING (auth.role() = 'authenticated');

-- Interactions Table Policies
CREATE POLICY "Authenticated users can access interactions" ON interactions 
  FOR ALL USING (auth.role() = 'authenticated');

-- User Permissions Policies
CREATE POLICY "Users can view own permissions" ON user_permissions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions" ON user_permissions 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Invitation Links Policies
CREATE POLICY "Admins can manage invitations" ON invitation_links 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Companies indexes
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_customer_type ON companies(customer_type);
CREATE INDEX idx_companies_churn_risk ON companies(churn_risk);
CREATE INDEX idx_companies_created_by ON companies(created_by);

-- Deals indexes
CREATE INDEX idx_deals_company_id ON deals(company_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);

-- Products indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_market_position ON products(market_position);

-- Competitors indexes
CREATE INDEX idx_competitors_threat_level ON competitors(threat_level);
CREATE INDEX idx_competitors_market_position ON competitors(market_position);

-- After Sales indexes
CREATE INDEX idx_after_sales_company_id ON after_sales(company_id);
CREATE INDEX idx_after_sales_status ON after_sales(status);
CREATE INDEX idx_after_sales_priority ON after_sales(priority);
CREATE INDEX idx_after_sales_is_overdue ON after_sales(is_overdue);

-- Debt Collection indexes
CREATE INDEX idx_debt_collection_company_id ON debt_collection(company_id);
CREATE INDEX idx_debt_collection_status ON debt_collection(status);
CREATE INDEX idx_debt_collection_due_date ON debt_collection(due_date);

-- Interactions indexes
CREATE INDEX idx_interactions_company_id ON interactions(company_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);

-- User Permissions indexes
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);

-- Invitation Links indexes
CREATE INDEX idx_invitation_links_token ON invitation_links(token);
CREATE INDEX idx_invitation_links_email ON invitation_links(email);

-- ============================================
-- CREATE TRIGGERS & FUNCTIONS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_after_sales_updated_at BEFORE UPDATE ON after_sales 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debt_collection_updated_at BEFORE UPDATE ON debt_collection 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_strategies_updated_at BEFORE UPDATE ON sales_strategies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_data_updated_at BEFORE UPDATE ON kpi_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATABASE SETUP COMPLETE!
-- ============================================
-- Your COPCCA CRM 2026 database is ready!
-- 
-- Next steps:
-- 1. Update .env file with your Supabase credentials
-- 2. Test authentication by creating a user
-- 3. Start adding your business data
-- ============================================
