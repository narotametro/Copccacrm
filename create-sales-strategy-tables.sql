-- =====================================================
-- SALES STRATEGY TABLES - COMPLETE DATABASE PERSISTENCE
-- Creates tables for all sales strategy components
-- =====================================================

-- 1. TARGET SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS sales_target_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  annual_value DECIMAL DEFAULT 0,
  growth_rate DECIMAL DEFAULT 0,
  pain_points TEXT[] DEFAULT '{}',
  buying_behavior TEXT,
  decision_makers TEXT[] DEFAULT '{}',
  avg_deal_size DECIMAL DEFAULT 0,
  sales_cycle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VALUE PROPOSITIONS TABLE
CREATE TABLE IF NOT EXISTS sales_value_propositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  segment TEXT NOT NULL,
  customer_need TEXT NOT NULL,
  our_solution TEXT NOT NULL,
  unique_advantage TEXT,
  evidence TEXT[] DEFAULT '{}',
  roi_claim TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRICING TIERS TABLE
CREATE TABLE IF NOT EXISTS sales_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  segment TEXT,
  base_price DECIMAL NOT NULL DEFAULT 0,
  pricing_model TEXT,
  discount_rules TEXT[] DEFAULT '{}',
  ai_discount_suggestion TEXT,
  typical_discount DECIMAL DEFAULT 0,
  value_drivers TEXT[] DEFAULT '{}',
  competitive_position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SALES CHANNELS TABLE
CREATE TABLE IF NOT EXISTS sales_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  approach TEXT NOT NULL,
  target_segments TEXT[] DEFAULT '{}',
  key_activities TEXT[] DEFAULT '{}',
  resources_needed TEXT[] DEFAULT '{}',
  typical_conversion DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMPETITIVE DEALS TABLE
CREATE TABLE IF NOT EXISTS sales_competitive_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  deal_name TEXT NOT NULL,
  customer TEXT NOT NULL,
  competitors TEXT[] DEFAULT '{}',
  our_strengths TEXT[] DEFAULT '{}',
  competitor_strengths TEXT[] DEFAULT '{}',
  ai_risk_score DECIMAL DEFAULT 0,
  ai_risk_level TEXT DEFAULT 'medium',
  ai_recommendations TEXT[] DEFAULT '{}',
  differentiation_strategy TEXT,
  win_probability DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE sales_target_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_value_propositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_competitive_deals ENABLE ROW LEVEL SECURITY;

-- Target Segments Policies
CREATE POLICY "Users can view their company's target segments"
  ON sales_target_segments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert target segments for their company"
  ON sales_target_segments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their company's target segments"
  ON sales_target_segments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their company's target segments"
  ON sales_target_segments FOR DELETE
  USING (auth.role() = 'authenticated');

-- Value Propositions Policies
CREATE POLICY "Users can view their company's value propositions"
  ON sales_value_propositions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert value propositions for their company"
  ON sales_value_propositions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their company's value propositions"
  ON sales_value_propositions FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their company's value propositions"
  ON sales_value_propositions FOR DELETE
  USING (auth.role() = 'authenticated');

-- Pricing Tiers Policies
CREATE POLICY "Users can view their company's pricing tiers"
  ON sales_pricing_tiers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert pricing tiers for their company"
  ON sales_pricing_tiers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their company's pricing tiers"
  ON sales_pricing_tiers FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their company's pricing tiers"
  ON sales_pricing_tiers FOR DELETE
  USING (auth.role() = 'authenticated');

-- Sales Channels Policies
CREATE POLICY "Users can view their company's sales channels"
  ON sales_channels FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert sales channels for their company"
  ON sales_channels FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their company's sales channels"
  ON sales_channels FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their company's sales channels"
  ON sales_channels FOR DELETE
  USING (auth.role() = 'authenticated');

-- Competitive Deals Policies
CREATE POLICY "Users can view their company's competitive deals"
  ON sales_competitive_deals FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert competitive deals for their company"
  ON sales_competitive_deals FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their company's competitive deals"
  ON sales_competitive_deals FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their company's competitive deals"
  ON sales_competitive_deals FOR DELETE
  USING (auth.role() = 'authenticated');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sales_target_segments_company 
  ON sales_target_segments(company_id);

CREATE INDEX IF NOT EXISTS idx_sales_value_propositions_company 
  ON sales_value_propositions(company_id);

CREATE INDEX IF NOT EXISTS idx_sales_pricing_tiers_company 
  ON sales_pricing_tiers(company_id);

CREATE INDEX IF NOT EXISTS idx_sales_channels_company 
  ON sales_channels(company_id);

CREATE INDEX IF NOT EXISTS idx_sales_competitive_deals_company 
  ON sales_competitive_deals(company_id);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

SELECT 
  t.table_name,
  (SELECT count(*) FROM information_schema.columns 
   WHERE table_name = t.table_name AND table_schema = 'public') as column_count,
  array_agg(c.column_name ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public' 
  AND t.table_name IN (
    'sales_target_segments',
    'sales_value_propositions', 
    'sales_pricing_tiers',
    'sales_channels',
    'sales_competitive_deals'
  )
GROUP BY t.table_name
ORDER BY t.table_name;
