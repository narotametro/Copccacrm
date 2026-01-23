-- COPCCA CRM - Complete Production Database Schema
-- Comprehensive, well-designed schema for full CRM functionality
-- Run this to set up a complete, clean database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- CORE ENTITIES
-- ===========================================

-- Users table (simplified for demo - in production, link to auth.users)
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Companies/Customers
DROP TABLE IF EXISTS companies CASCADE;
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT CHECK (size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  status TEXT DEFAULT 'prospect' CHECK (status IN ('active', 'inactive', 'prospect', 'lead', 'customer')),
  health_score INTEGER DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
  annual_revenue DECIMAL,
  employee_count INTEGER,
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SALES MODULE
-- ===========================================

-- Deals/Pipeline
DROP TABLE IF EXISTS deals CASCADE;
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'cancelled')),
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  lost_reason TEXT,
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products/Services
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  category TEXT,
  sku TEXT UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal Products (junction table)
DROP TABLE IF EXISTS deal_products CASCADE;
CREATE TABLE deal_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL NOT NULL,
  discount DECIMAL DEFAULT 0,
  line_total DECIMAL GENERATED ALWAYS AS ((quantity * unit_price) - discount) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- MARKETING MODULE
-- ===========================================

-- Marketing Campaigns
DROP TABLE IF EXISTS marketing_campaigns CASCADE;
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('email', 'social', 'paid_ads', 'content', 'event', 'webinar')),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'paused', 'completed', 'cancelled')),
  budget DECIMAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  target_audience TEXT,
  start_date DATE,
  end_date DATE,
  expected_leads INTEGER DEFAULT 0,
  actual_leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  roi DECIMAL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Leads (links campaigns to companies)
DROP TABLE IF EXISTS campaign_leads CASCADE;
CREATE TABLE campaign_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- CUSTOMER SUCCESS / AFTER SALES
-- ===========================================

-- Support Tickets
DROP TABLE IF EXISTS support_tickets CASCADE;
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  type TEXT CHECK (type IN ('bug', 'feature_request', 'question', 'complaint', 'other')),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Feedback
DROP TABLE IF EXISTS customer_feedback CASCADE;
CREATE TABLE customer_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('survey', 'review', 'complaint', 'suggestion', 'testimonial')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  response_text TEXT,
  response_by UUID REFERENCES users(id),
  response_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INVOICING & PAYMENTS
-- ===========================================

-- Invoices
DROP TABLE IF EXISTS invoices CASCADE;
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'partial', 'cancelled')),
  total_amount DECIMAL NOT NULL DEFAULT 0,
  paid_amount DECIMAL NOT NULL DEFAULT 0,
  balance DECIMAL GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  currency TEXT DEFAULT 'USD',
  due_date DATE NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  payment_terms TEXT DEFAULT 'net_30',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items
DROP TABLE IF EXISTS invoice_items CASCADE;
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL NOT NULL DEFAULT 1,
  unit_price DECIMAL NOT NULL,
  discount DECIMAL DEFAULT 0,
  tax_rate DECIMAL DEFAULT 0,
  line_total DECIMAL GENERATED ALWAYS AS ((quantity * unit_price) - discount) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'check', 'credit_card', 'paypal', 'stripe')),
  reference_number TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ANALYTICS & KPIs
-- ===========================================

-- System Metrics (for operations KPIs)
DROP TABLE IF EXISTS system_metrics CASCADE;
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  uptime DECIMAL DEFAULT 99.9,
  efficiency DECIMAL DEFAULT 85.0,
  automation_coverage DECIMAL DEFAULT 75.0,
  response_time DECIMAL DEFAULT 2.5,
  error_rate DECIMAL DEFAULT 0.1,
  active_users INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debt Collection
DROP TABLE IF EXISTS debt_collection CASCADE;
CREATE TABLE debt_collection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reminded', 'overdue', 'paid', 'partial', 'written_off')),
  due_date DATE NOT NULL,
  last_reminder_date DATE,
  days_overdue INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- After Sales Tasks
DROP TABLE IF EXISTS after_sales_tasks CASCADE;
CREATE TABLE after_sales_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Strategies
DROP TABLE IF EXISTS sales_strategies CASCADE;
CREATE TABLE sales_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  strategy_type TEXT CHECK (strategy_type IN ('campaign', 'promotion', 'partnership', 'content', 'social', 'other')),
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  budget DECIMAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  roi DECIMAL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- COMMUNICATION & ACTIVITIES
-- ===========================================

-- Activities/Interactions
DROP TABLE IF EXISTS activities CASCADE;
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('call', 'email', 'meeting', 'note', 'task', 'demo', 'proposal')),
  subject TEXT NOT NULL,
  description TEXT,
  outcome TEXT,
  duration_minutes INTEGER,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Communications
DROP TABLE IF EXISTS email_communications CASCADE;
CREATE TABLE email_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'opened', 'clicked', 'bounced')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  sent_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SYSTEM & CONFIGURATION
-- ===========================================

-- System Settings
DROP TABLE IF EXISTS system_settings CASCADE;
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences
DROP TABLE IF EXISTS user_preferences CASCADE;
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_assigned_to ON companies(assigned_to);
CREATE INDEX idx_companies_created_by ON companies(created_by);
CREATE INDEX idx_companies_health_score ON companies(health_score);

CREATE INDEX idx_deals_company_id ON deals(company_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_expected_close_date ON deals(expected_close_date);

CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_assigned_to ON invoices(assigned_to);

CREATE INDEX idx_activities_company_id ON activities(company_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_created_at ON activities(created_at);

CREATE INDEX idx_support_tickets_company_id ON support_tickets(company_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (customize based on your auth system)
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can access companies" ON companies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access deals" ON deals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access products" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access invoices" ON invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access activities" ON activities FOR ALL USING (auth.role() = 'authenticated');

-- ===========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debt_collection_updated_at BEFORE UPDATE ON debt_collection FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_after_sales_tasks_updated_at BEFORE UPDATE ON after_sales_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_strategies_updated_at BEFORE UPDATE ON sales_strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update invoice totals
CREATE OR REPLACE FUNCTION update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET total_amount = (
    SELECT COALESCE(SUM(line_total), 0)
    FROM invoice_items
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_total_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION update_invoice_total();

-- Function to update invoice paid amount
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET paid_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM payments
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_paid_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_paid_amount();

-- Function to automatically update invoice status
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET status = CASE
    WHEN balance = 0 THEN 'paid'
    WHEN balance < total_amount AND balance > 0 THEN 'partial'
    WHEN due_date < CURRENT_DATE AND balance > 0 THEN 'overdue'
    ELSE status
  END,
  updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_status();

-- Function to update days_overdue in debt_collection
CREATE OR REPLACE FUNCTION update_debt_days_overdue()
RETURNS TRIGGER AS $$
BEGIN
  NEW.days_overdue = GREATEST(0, CURRENT_DATE - NEW.due_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_debt_days_overdue_trigger
  BEFORE INSERT OR UPDATE ON debt_collection
  FOR EACH ROW EXECUTE FUNCTION update_debt_days_overdue();

-- ===========================================
-- SAMPLE DATA INSERTION
-- ===========================================

-- Insert sample admin user
INSERT INTO users (email, full_name, role, department) VALUES
('admin@copcca.com', 'System Administrator', 'admin', 'IT'),
('manager@copcca.com', 'Sales Manager', 'manager', 'Sales'),
('agent@copcca.com', 'Sales Agent', 'user', 'Sales');

-- Insert sample companies
INSERT INTO companies (name, industry, size, website, email, status, health_score, assigned_to, created_by) VALUES
('TechCorp Solutions', 'Technology', '51-200', 'https://techcorp.com', 'contact@techcorp.com', 'customer', 85, (SELECT id FROM users WHERE email = 'agent@copcca.com'), (SELECT id FROM users WHERE email = 'admin@copcca.com')),
('Global Industries', 'Manufacturing', '201-500', 'https://globalind.com', 'sales@globalind.com', 'customer', 72, (SELECT id FROM users WHERE email = 'agent@copcca.com'), (SELECT id FROM users WHERE email = 'admin@copcca.com')),
('RetailPlus', 'Retail', '11-50', 'https://retailplus.com', 'info@retailplus.com', 'prospect', 60, (SELECT id FROM users WHERE email = 'manager@copcca.com'), (SELECT id FROM users WHERE email = 'admin@copcca.com')),
('StartupXYZ', 'SaaS', '1-10', 'https://startupxyz.com', 'hello@startupxyz.com', 'lead', 45, (SELECT id FROM users WHERE email = 'agent@copcca.com'), (SELECT id FROM users WHERE email = 'admin@copcca.com'));

-- Insert sample products
INSERT INTO products (name, description, price, category, sku, stock_quantity) VALUES
('CRM Software License', 'Annual software license for CRM system', 1200.00, 'Software', 'CRM-LIC-001', 100),
('Consulting Services', 'Professional consulting services', 150.00, 'Services', 'CONSULT-001', 0),
('Training Package', 'User training and onboarding package', 500.00, 'Services', 'TRAIN-001', 50),
('Custom Integration', 'Custom API integration services', 800.00, 'Services', 'INTEGRATION-001', 10),
('Premium Support', '24/7 premium support package', 300.00, 'Services', 'SUPPORT-001', 0);

-- Insert sample deals
INSERT INTO deals (company_id, title, value, stage, probability, expected_close_date, assigned_to, created_by) VALUES
((SELECT id FROM companies WHERE name = 'TechCorp Solutions'), 'Enterprise CRM Implementation', 25000.00, 'negotiation', 80, '2026-02-15', (SELECT id FROM users WHERE email = 'agent@copcca.com'), (SELECT id FROM users WHERE email = 'admin@copcca.com')),
((SELECT id FROM companies WHERE name = 'Global Industries'), 'Manufacturing Process Optimization', 45000.00, 'proposal', 60, '2026-03-01', (SELECT id FROM users WHERE email = 'agent@copcca.com'), (SELECT id FROM users WHERE email = 'admin@copcca.com')),
((SELECT id FROM companies WHERE name = 'RetailPlus'), 'E-commerce Platform Setup', 15000.00, 'qualified', 40, '2026-02-28', (SELECT id FROM users WHERE email = 'manager@copcca.com'), (SELECT id FROM users WHERE email = 'admin@copcca.com'));

-- Insert sample invoices
INSERT INTO invoices (invoice_number, company_id, status, total_amount, paid_amount, due_date, issue_date, payment_terms, created_by, assigned_to) VALUES
('INV-2026-001', (SELECT id FROM companies WHERE name = 'TechCorp Solutions'), 'paid', 1200.00, 1200.00, '2026-02-15', '2026-01-15', 'net_30', (SELECT id FROM users WHERE email = 'admin@copcca.com'), (SELECT id FROM users WHERE email = 'agent@copcca.com')),
('INV-2026-002', (SELECT id FROM companies WHERE name = 'Global Industries'), 'sent', 650.00, 0.00, '2026-02-28', '2026-01-20', 'net_30', (SELECT id FROM users WHERE email = 'admin@copcca.com'), (SELECT id FROM users WHERE email = 'agent@copcca.com')),
('INV-2026-003', (SELECT id FROM companies WHERE name = 'RetailPlus'), 'draft', 800.00, 0.00, '2026-03-15', '2026-01-25', 'net_45', (SELECT id FROM users WHERE email = 'admin@copcca.com'), (SELECT id FROM users WHERE email = 'manager@copcca.com'));

-- Insert sample invoice items
INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, discount, tax_rate) VALUES
((SELECT id FROM invoices WHERE invoice_number = 'INV-2026-001'), (SELECT id FROM products WHERE name = 'CRM Software License'), 'CRM Software License - Annual', 1, 1200.00, 0, 0),
((SELECT id FROM invoices WHERE invoice_number = 'INV-2026-002'), (SELECT id FROM products WHERE name = 'Consulting Services'), 'Consulting Services - 4 hours', 4, 150.00, 0, 0),
((SELECT id FROM invoices WHERE invoice_number = 'INV-2026-002'), (SELECT id FROM products WHERE name = 'Training Package'), 'User Training Package', 1, 500.00, 0, 0),
((SELECT id FROM invoices WHERE invoice_number = 'INV-2026-003'), (SELECT id FROM products WHERE name = 'Custom Integration'), 'Custom API Integration', 1, 800.00, 0, 0);

-- Insert sample payments
INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference_number, recorded_by) VALUES
((SELECT id FROM invoices WHERE invoice_number = 'INV-2026-001'), 1200.00, '2026-01-20', 'bank_transfer', 'BT-001-2026', (SELECT id FROM users WHERE email = 'admin@copcca.com'));

-- Insert sample system metrics
INSERT INTO system_metrics (company_id, uptime, efficiency, automation_coverage, response_time, error_rate, active_users) VALUES
((SELECT id FROM companies WHERE name = 'TechCorp Solutions'), 99.7, 87.0, 73.0, 2.3, 0.05, 150),
((SELECT id FROM companies WHERE name = 'Global Industries'), 98.5, 82.0, 68.0, 3.1, 0.08, 300);

-- Insert sample debt collection
INSERT INTO debt_collection (company_id, amount, status, due_date, assigned_to) VALUES
((SELECT id FROM companies WHERE name = 'TechCorp Solutions'), 50000, 'paid', '2026-01-15', (SELECT id FROM users WHERE email = 'agent@copcca.com')),
((SELECT id FROM companies WHERE name = 'Global Industries'), 25000, 'pending', '2026-02-01', (SELECT id FROM users WHERE email = 'agent@copcca.com'));

-- Insert sample after sales tasks
INSERT INTO after_sales_tasks (company_id, title, status, priority, assigned_to, due_date) VALUES
((SELECT id FROM companies WHERE name = 'TechCorp Solutions'), 'Customer feedback analysis', 'done', 'high', (SELECT id FROM users WHERE email = 'agent@copcca.com'), '2026-01-30'),
((SELECT id FROM companies WHERE name = 'Global Industries'), 'Support ticket resolution', 'in_progress', 'medium', (SELECT id FROM users WHERE email = 'agent@copcca.com'), '2026-02-05'),
((SELECT id FROM companies WHERE name = 'RetailPlus'), 'Product training session', 'pending', 'low', (SELECT id FROM users WHERE email = 'manager@copcca.com'), '2026-02-10');

-- Insert sample sales strategies
INSERT INTO sales_strategies (company_id, name, status, strategy_type, leads_generated, conversions, budget, roi, created_by) VALUES
((SELECT id FROM companies WHERE name = 'TechCorp Solutions'), 'Q1 Digital Campaign', 'active', 'campaign', 125, 15, 5000.00, 320, (SELECT id FROM users WHERE email = 'manager@copcca.com')),
((SELECT id FROM companies WHERE name = 'Global Industries'), 'Email Marketing Push', 'completed', 'campaign', 89, 12, 3000.00, 280, (SELECT id FROM users WHERE email = 'manager@copcca.com'));

-- Insert sample activities
INSERT INTO activities (company_id, type, subject, description, user_id) VALUES
((SELECT id FROM companies WHERE name = 'TechCorp Solutions'), 'call', 'Initial consultation', 'Discussed CRM requirements and timeline', (SELECT id FROM users WHERE email = 'agent@copcca.com')),
((SELECT id FROM companies WHERE name = 'Global Industries'), 'meeting', 'Product demo', 'Demonstrated CRM features and capabilities', (SELECT id FROM users WHERE email = 'agent@copcca.com')),
((SELECT id FROM companies WHERE name = 'RetailPlus'), 'email', 'Proposal sent', 'Sent detailed proposal for e-commerce platform', (SELECT id FROM users WHERE email = 'manager@copcca.com'));

-- Insert sample support tickets
INSERT INTO support_tickets (company_id, subject, description, priority, status, type, assigned_to, created_by) VALUES
((SELECT id FROM companies WHERE name = 'TechCorp Solutions'), 'Login issues', 'Users unable to access the system after recent update', 'high', 'resolved', 'bug', (SELECT id FROM users WHERE email = 'agent@copcca.com'), (SELECT id FROM users WHERE email = 'admin@copcca.com')),
((SELECT id FROM companies WHERE name = 'Global Industries'), 'Feature request', 'Request for custom reporting dashboard', 'medium', 'in_progress', 'feature_request', (SELECT id FROM users WHERE email = 'agent@copcca.com'), (SELECT id FROM users WHERE email = 'admin@copcca.com'));

-- Insert system settings
INSERT INTO system_settings (key, value, description, category) VALUES
('company_name', 'COPCCA CRM', 'Company name displayed in the application', 'general'),
('support_email', 'support@copcca.com', 'Support email address', 'contact'),
('default_currency', 'USD', 'Default currency for the system', 'financial'),
('timezone', 'UTC', 'Default timezone for the application', 'general');