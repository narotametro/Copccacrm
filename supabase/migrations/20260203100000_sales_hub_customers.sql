-- Sales Hub Customer Management Database Schema
-- Creates tables for customer selection and management in Sales Hub

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- SALES HUB CUSTOMERS TABLE
-- ===========================================

-- Create customers table for Sales Hub operations
CREATE TABLE IF NOT EXISTS sales_hub_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id TEXT UNIQUE NOT NULL, -- External customer ID from CUSTOMERS 360
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,

  -- Customer classification
  customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business', 'enterprise')),
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  segment TEXT, -- Customer segment/category

  -- Financial metrics
  lifetime_value DECIMAL DEFAULT 0,
  outstanding_balance DECIMAL DEFAULT 0,
  credit_limit DECIMAL DEFAULT 0,
  payment_terms TEXT DEFAULT 'net_30',

  -- Sales metrics
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL DEFAULT 0,
  avg_order_value DECIMAL DEFAULT 0,
  last_order_date DATE,
  preferred_payment_method TEXT,

  -- Customer health and risk
  health_score INTEGER DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
  churn_risk TEXT DEFAULT 'low' CHECK (churn_risk IN ('low', 'medium', 'high', 'critical')),
  upsell_potential TEXT DEFAULT 'low' CHECK (upsell_potential IN ('low', 'medium', 'high')),

  -- Status and assignment
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'blacklisted')),
  assigned_sales_rep UUID REFERENCES users(id),
  lead_source TEXT,
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),

  -- Additional metadata
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',

  -- Audit fields
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- External system sync
  external_system TEXT DEFAULT 'customers_360',
  external_last_sync TIMESTAMPTZ,
  is_synced BOOLEAN DEFAULT false
);

-- ===========================================
-- CUSTOMER INTERACTIONS LOG
-- ===========================================

-- Track all customer interactions in Sales Hub
CREATE TABLE IF NOT EXISTS customer_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES sales_hub_customers(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'quote', 'order', 'complaint', 'feedback')),
  subject TEXT NOT NULL,
  description TEXT,
  outcome TEXT,
  duration_minutes INTEGER,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- CUSTOMER PREFERENCES
-- ===========================================

-- Store customer preferences and buying patterns
CREATE TABLE IF NOT EXISTS customer_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES sales_hub_customers(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL CHECK (preference_type IN ('product', 'category', 'brand', 'price_range', 'payment_method')),
  preference_value TEXT NOT NULL,
  preference_score DECIMAL DEFAULT 1.0, -- Confidence score 0-1
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, preference_type, preference_value)
);

-- ===========================================
-- SALES HUB SESSIONS
-- ===========================================

-- Track sales hub sessions for analytics
CREATE TABLE IF NOT EXISTS sales_hub_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  customer_id UUID REFERENCES sales_hub_customers(id),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  actions_taken JSONB DEFAULT '[]', -- Array of actions performed
  products_viewed TEXT[] DEFAULT '{}',
  cart_value DECIMAL DEFAULT 0,
  conversion_status TEXT DEFAULT 'browsing' CHECK (conversion_status IN ('browsing', 'added_to_cart', 'checkout_started', 'completed', 'abandoned')),
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Indexes for customer lookup
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_customer_id ON sales_hub_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_email ON sales_hub_customers(email);
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_phone ON sales_hub_customers(phone);
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_status ON sales_hub_customers(status);
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_tier ON sales_hub_customers(tier);
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_assigned_rep ON sales_hub_customers(assigned_sales_rep);
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_health_score ON sales_hub_customers(health_score);
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_churn_risk ON sales_hub_customers(churn_risk);

-- Indexes for interactions
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_id ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_type ON customer_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_created_at ON customer_interactions(created_at);

-- Indexes for preferences
CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer_id ON customer_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_type ON customer_preferences(preference_type);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sales_hub_sessions_user_id ON sales_hub_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_hub_sessions_customer_id ON sales_hub_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_hub_sessions_start_time ON sales_hub_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sales_hub_sessions_conversion ON sales_hub_sessions(conversion_status);

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS
ALTER TABLE sales_hub_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_hub_sessions ENABLE ROW LEVEL SECURITY;

-- Sales Hub Customers policies (RELAXED FOR DEVELOPMENT)
DROP POLICY IF EXISTS "Users can view assigned customers" ON sales_hub_customers;
CREATE POLICY "Users can view assigned customers" ON sales_hub_customers
  FOR SELECT USING (
    auth.uid() = assigned_sales_rep OR
    auth.jwt()->>'role' IN ('admin', 'manager', 'user') OR
    status = 'active'
  );

DROP POLICY IF EXISTS "Users can update assigned customers" ON sales_hub_customers;
CREATE POLICY "Users can update assigned customers" ON sales_hub_customers
  FOR UPDATE USING (
    auth.uid() = assigned_sales_rep OR
    auth.jwt()->>'role' IN ('admin', 'manager', 'user')
  );

DROP POLICY IF EXISTS "Users can insert customers" ON sales_hub_customers;
CREATE POLICY "Users can insert customers" ON sales_hub_customers
  FOR INSERT WITH CHECK (auth.jwt()->>'role' IN ('admin', 'manager', 'user'));

-- Customer Interactions policies
DROP POLICY IF EXISTS "Users can view customer interactions" ON customer_interactions;
CREATE POLICY "Users can view customer interactions" ON customer_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales_hub_customers
      WHERE id = customer_interactions.customer_id
      AND (assigned_sales_rep = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'manager'))
    )
  );

DROP POLICY IF EXISTS "Users can manage customer interactions" ON customer_interactions;
CREATE POLICY "Users can manage customer interactions" ON customer_interactions
  FOR ALL USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    auth.jwt()->>'role' IN ('admin', 'manager')
  );

-- Customer Preferences policies
DROP POLICY IF EXISTS "Users can view customer preferences" ON customer_preferences;
CREATE POLICY "Users can view customer preferences" ON customer_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales_hub_customers
      WHERE id = customer_preferences.customer_id
      AND (assigned_sales_rep = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'manager'))
    )
  );

-- Sales Hub Sessions policies
DROP POLICY IF EXISTS "Users can view their sessions" ON sales_hub_sessions;
CREATE POLICY "Users can view their sessions" ON sales_hub_sessions
  FOR SELECT USING (user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'manager'));

DROP POLICY IF EXISTS "Users can create sessions" ON sales_hub_sessions;
CREATE POLICY "Users can create sessions" ON sales_hub_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ===========================================
-- FUNCTIONS AND TRIGGERS
-- ===========================================

-- Function to update customer updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for customer updates
DROP TRIGGER IF EXISTS trigger_update_customer_timestamp ON sales_hub_customers;
CREATE TRIGGER trigger_update_customer_timestamp
  BEFORE UPDATE ON sales_hub_customers
  FOR EACH ROW EXECUTE FUNCTION update_customer_updated_at();

-- Function to calculate customer health score
CREATE OR REPLACE FUNCTION calculate_customer_health_score(
  customer_id UUID
) RETURNS INTEGER AS $$
DECLARE
  health_score INTEGER := 50;
  customer_record RECORD;
BEGIN
  SELECT * INTO customer_record FROM sales_hub_customers WHERE id = customer_id;

  IF NOT FOUND THEN
    RETURN 50;
  END IF;

  -- Base score from explicit health_score
  health_score := customer_record.health_score;

  -- Adjust based on churn risk
  CASE customer_record.churn_risk
    WHEN 'low' THEN health_score := health_score + 10;
    WHEN 'medium' THEN health_score := health_score - 10;
    WHEN 'high' THEN health_score := health_score - 20;
    WHEN 'critical' THEN health_score := health_score - 30;
  END CASE;

  -- Adjust based on recent activity
  IF customer_record.last_order_date > NOW() - INTERVAL '30 days' THEN
    health_score := health_score + 15;
  ELSIF customer_record.last_order_date > NOW() - INTERVAL '90 days' THEN
    health_score := health_score + 5;
  ELSE
    health_score := health_score - 10;
  END IF;

  -- Ensure score stays within bounds
  RETURN GREATEST(0, LEAST(100, health_score));
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- SAMPLE DATA INSERTION
-- ===========================================

-- Insert sample customers for testing
INSERT INTO sales_hub_customers (
  customer_id, name, company_name, email, phone, customer_type, tier,
  lifetime_value, outstanding_balance, health_score, churn_risk, upsell_potential,
  status, lead_source, tags, notes
) VALUES
  ('CUST001', 'John Smith', 'Smith Enterprises', 'john.smith@email.com', '+1-555-0101',
   'business', 'gold', 50000.00, 2500.00, 85, 'low', 'high', 'active', 'referral',
   ARRAY['loyal', 'bulk_buyer'], 'Long-term customer, prefers quarterly billing'),

  ('CUST002', 'Sarah Johnson', NULL, 'sarah.j@email.com', '+1-555-0102',
   'individual', 'silver', 12500.00, 0.00, 75, 'medium', 'medium', 'active', 'website',
   ARRAY['online_shopper'], 'Frequent online purchaser'),

  ('CUST003', 'Mike Wilson', 'Wilson Corp', 'mike.wilson@wilsoncorp.com', '+1-555-0103',
   'enterprise', 'platinum', 150000.00, 15000.00, 90, 'low', 'high', 'active', 'trade_show',
   ARRAY['enterprise', 'high_value'], 'Key enterprise account'),

  ('CUST004', 'Emma Davis', NULL, 'emma.davis@email.com', '+1-555-0104',
   'individual', 'bronze', 2500.00, 150.00, 60, 'high', 'low', 'active', 'social_media',
   ARRAY['new_customer'], 'Recent acquisition, monitor closely'),

  ('CUST005', 'Robert Brown', 'Brown Industries', 'robert@brownindustries.com', '+1-555-0105',
   'business', 'gold', 75000.00, 5000.00, 80, 'medium', 'medium', 'active', 'direct',
   ARRAY['manufacturing', 'bulk_orders'], 'Consistent bulk orders, good payment history')
ON CONFLICT (customer_id) DO NOTHING;

-- Insert sample customer preferences
INSERT INTO customer_preferences (customer_id, preference_type, preference_value, preference_score) VALUES
  ((SELECT id FROM sales_hub_customers WHERE customer_id = 'CUST001'), 'category', 'electronics', 0.9),
  ((SELECT id FROM sales_hub_customers WHERE customer_id = 'CUST001'), 'payment_method', 'bank_transfer', 0.8),
  ((SELECT id FROM sales_hub_customers WHERE customer_id = 'CUST002'), 'category', 'books', 0.7),
  ((SELECT id FROM sales_hub_customers WHERE customer_id = 'CUST002'), 'price_range', 'budget', 0.6),
  ((SELECT id FROM sales_hub_customers WHERE customer_id = 'CUST003'), 'category', 'software', 0.95),
  ((SELECT id FROM sales_hub_customers WHERE customer_id = 'CUST003'), 'brand', 'premium', 0.9);

-- ===========================================
-- VIEWS FOR EASY QUERYING
-- ===========================================

-- View for active customers with key metrics
CREATE OR REPLACE VIEW active_customers_view AS
SELECT
  id,
  customer_id,
  name,
  company_name,
  email,
  phone,
  tier,
  lifetime_value,
  outstanding_balance,
  health_score,
  churn_risk,
  upsell_potential,
  total_orders,
  last_order_date,
  assigned_sales_rep,
  tags,
  created_at
FROM sales_hub_customers
WHERE status = 'active'
ORDER BY lifetime_value DESC;

-- View for customer summary with interaction counts
CREATE OR REPLACE VIEW customer_summary_view AS
SELECT
  c.id,
  c.customer_id,
  c.name,
  c.company_name,
  c.tier,
  c.lifetime_value,
  c.health_score,
  c.churn_risk,
  COUNT(i.id) as total_interactions,
  MAX(i.created_at) as last_interaction_date,
  COUNT(CASE WHEN i.interaction_type = 'order' THEN 1 END) as order_count
FROM sales_hub_customers c
LEFT JOIN customer_interactions i ON c.id = i.customer_id
WHERE c.status = 'active'
GROUP BY c.id, c.customer_id, c.name, c.company_name, c.tier, c.lifetime_value, c.health_score, c.churn_risk
ORDER BY c.lifetime_value DESC;

-- ===========================================
-- GRANTS FOR APPLICATION ACCESS
-- ===========================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON sales_hub_customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_preferences TO authenticated;
GRANT SELECT, INSERT ON sales_hub_sessions TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON SCHEMA public TO authenticated;

-- ===========================================
-- COMMENTS FOR DOCUMENTATION
-- ===========================================

COMMENT ON TABLE sales_hub_customers IS 'Main customer table for Sales Hub operations, integrated with CUSTOMERS 360 system';
COMMENT ON TABLE customer_interactions IS 'Tracks all customer interactions and communications in Sales Hub';
COMMENT ON TABLE customer_preferences IS 'Stores customer buying preferences and patterns for personalized sales';
COMMENT ON TABLE sales_hub_sessions IS 'Tracks user sessions in Sales Hub for analytics and conversion tracking';
COMMENT ON VIEW active_customers_view IS 'View of active customers with key business metrics';
COMMENT ON VIEW customer_summary_view IS 'Summary view with interaction counts and key metrics';

-- Migration completed successfully
-- Ready for Sales Hub customer selection and management functionality