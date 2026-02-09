-- Apply Sales Hub Tables Migration
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/bpydcrdvytnnjzytkptd/sql

-- ===========================================
-- SALES HUB CUSTOMERS TABLE
-- ===========================================

-- Note: Using gen_random_uuid() which is available in Supabase without extension

-- Create customers table for Sales Hub operations
CREATE TABLE IF NOT EXISTS sales_hub_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT UNIQUE NOT NULL,
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
  customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business', 'enterprise')),
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  segment TEXT,
  lifetime_value DECIMAL DEFAULT 0,
  outstanding_balance DECIMAL DEFAULT 0,
  credit_limit DECIMAL DEFAULT 0,
  payment_terms TEXT DEFAULT 'net_30',
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL DEFAULT 0,
  avg_order_value DECIMAL DEFAULT 0,
  last_order_date DATE,
  preferred_payment_method TEXT,
  health_score INTEGER DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
  churn_risk TEXT DEFAULT 'low' CHECK (churn_risk IN ('low', 'medium', 'high', 'critical')),
  upsell_potential TEXT DEFAULT 'low' CHECK (upsell_potential IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'blacklisted')),
  assigned_sales_rep UUID REFERENCES users(id),
  lead_source TEXT,
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  external_system TEXT DEFAULT 'customers_360',
  external_last_sync TIMESTAMPTZ,
  is_synced BOOLEAN DEFAULT false
);

-- ===========================================
-- SALES HUB ORDERS TABLE
-- ===========================================

-- Create sales_hub_orders table
CREATE TABLE IF NOT EXISTS sales_hub_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES sales_hub_customers(id) ON DELETE CASCADE,
  subtotal DECIMAL NOT NULL DEFAULT 0,
  tax_amount DECIMAL NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'monetary')),
  discount_value DECIMAL DEFAULT 0,
  discount_amount DECIMAL DEFAULT 0,
  total_amount DECIMAL NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit')),
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================

-- Indexes for sales_hub_customers
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_customer_id ON sales_hub_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_assigned_sales_rep ON sales_hub_customers(assigned_sales_rep);
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_status ON sales_hub_customers(status);
CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_tier ON sales_hub_customers(tier);

-- Indexes for sales_hub_orders
CREATE INDEX IF NOT EXISTS idx_sales_hub_orders_customer_id ON sales_hub_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_hub_orders_created_at ON sales_hub_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_hub_orders_status ON sales_hub_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_hub_orders_order_number ON sales_hub_orders(order_number);

-- ===========================================
-- RLS POLICIES (FIXED)
-- ===========================================

-- Enable RLS
ALTER TABLE sales_hub_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_hub_orders ENABLE ROW LEVEL SECURITY;

-- FIXED: Sales Hub Customers policies
DROP POLICY IF EXISTS "Users can view customers" ON sales_hub_customers;
CREATE POLICY "Users can view customers" ON sales_hub_customers
  FOR SELECT USING (auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager', 'user'));

DROP POLICY IF EXISTS "Users can insert customers" ON sales_hub_customers;
CREATE POLICY "Users can insert customers" ON sales_hub_customers
  FOR INSERT WITH CHECK (auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager', 'user'));

DROP POLICY IF EXISTS "Users can update customers" ON sales_hub_customers;
CREATE POLICY "Users can update customers" ON sales_hub_customers
  FOR UPDATE USING (auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager', 'user'));

-- FIXED: Sales Hub Orders policies
DROP POLICY IF EXISTS "Users can view orders" ON sales_hub_orders;
CREATE POLICY "Users can view orders" ON sales_hub_orders
  FOR SELECT USING (auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager', 'user'));

DROP POLICY IF EXISTS "Users can create orders" ON sales_hub_orders;
CREATE POLICY "Users can create orders" ON sales_hub_orders
  FOR INSERT WITH CHECK (auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager', 'user'));

DROP POLICY IF EXISTS "Users can update orders" ON sales_hub_orders;
CREATE POLICY "Users can update orders" ON sales_hub_orders
  FOR UPDATE USING (auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager', 'user'));

-- ===========================================
-- GRANT PERMISSIONS
-- ===========================================

GRANT SELECT, INSERT, UPDATE ON sales_hub_customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sales_hub_orders TO authenticated;

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Update trigger for customers
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_timestamp ON sales_hub_customers;
CREATE TRIGGER trigger_update_customer_timestamp
  BEFORE UPDATE ON sales_hub_customers
  FOR EACH ROW EXECUTE FUNCTION update_customer_updated_at();

-- Update trigger for orders
CREATE OR REPLACE FUNCTION update_sales_hub_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sales_hub_order_timestamp ON sales_hub_orders;
CREATE TRIGGER trigger_update_sales_hub_order_timestamp
  BEFORE UPDATE ON sales_hub_orders
  FOR EACH ROW EXECUTE FUNCTION update_sales_hub_order_updated_at();

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

-- Migration completed successfully!
-- The Sales Hub tables are now ready for use.