-- COPCCA CRM - Add Invoices Module (Safe Migration)
-- Migration to add comprehensive invoice system with base table checks

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create base tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
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

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'prospect' CHECK (status IN ('active', 'inactive', 'prospect')),
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS deals (
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

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  category TEXT,
  sku TEXT UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'partial', 'cancelled')),
  total_amount DECIMAL NOT NULL DEFAULT 0,
  paid_amount DECIMAL NOT NULL DEFAULT 0,
  balance DECIMAL GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  due_date DATE NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  payment_terms TEXT DEFAULT 'net_30',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice_items table for line items
CREATE TABLE IF NOT EXISTS invoice_items (
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

-- Create invoice_payments table for tracking payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'check', 'credit_card')),
  reference_number TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice_reminders table for automated follow-ups
CREATE TABLE IF NOT EXISTS invoice_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  reminder_type TEXT CHECK (reminder_type IN ('email', 'sms', 'whatsapp', 'call')),
  scheduled_date DATE NOT NULL,
  sent_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_assigned_to ON invoices(assigned_to);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_invoice_id ON invoice_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_scheduled_date ON invoice_reminders(scheduled_date);

-- Add RLS policies (drop first if exists to avoid conflicts)
DROP POLICY IF EXISTS "Users can view invoices from their companies" ON invoices;
DROP POLICY IF EXISTS "Users can create invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices they created or are assigned to" ON invoices;
DROP POLICY IF EXISTS "Users can view invoice items for accessible invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can manage invoice items for their invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can view payments for accessible invoices" ON invoice_payments;
DROP POLICY IF EXISTS "Users can record payments for their invoices" ON invoice_payments;
DROP POLICY IF EXISTS "Users can view reminders for accessible invoices" ON invoice_reminders;
DROP POLICY IF EXISTS "Users can manage reminders for their invoices" ON invoice_reminders;

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users can view invoices from their companies" ON invoices
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create invoices" ON invoices
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update invoices they created or are assigned to" ON invoices
  FOR UPDATE USING (
    created_by = auth.uid() OR assigned_to = auth.uid()
  );

-- Invoice items policies
CREATE POLICY "Users can view invoice items for accessible invoices" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE
        company_id IN (
          SELECT id FROM companies WHERE created_by = auth.uid()
        )
    )
  );

CREATE POLICY "Users can manage invoice items for their invoices" ON invoice_items
  FOR ALL USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE created_by = auth.uid() OR assigned_to = auth.uid()
    )
  );

-- Invoice payments policies
CREATE POLICY "Users can view payments for accessible invoices" ON invoice_payments
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE
        company_id IN (
          SELECT id FROM companies WHERE created_by = auth.uid()
        )
    )
  );

CREATE POLICY "Users can record payments for their invoices" ON invoice_payments
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE created_by = auth.uid() OR assigned_to = auth.uid()
    )
  );

-- Invoice reminders policies
CREATE POLICY "Users can view reminders for accessible invoices" ON invoice_reminders
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE
        company_id IN (
          SELECT id FROM companies WHERE created_by = auth.uid()
        )
    )
  );

CREATE POLICY "Users can manage reminders for their invoices" ON invoice_reminders
  FOR ALL USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE created_by = auth.uid() OR assigned_to = auth.uid()
    )
  );

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_invoice_total_trigger ON invoice_items;
DROP TRIGGER IF EXISTS update_invoice_paid_trigger ON invoice_payments;
DROP TRIGGER IF EXISTS update_invoice_status_trigger ON invoice_payments;

-- Create function to update invoice totals
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

-- Create function to update paid amount
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET paid_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM invoice_payments
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_invoice_total_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION update_invoice_total();

CREATE TRIGGER update_invoice_paid_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_paid_amount();

-- Create function to automatically update invoice status based on payments
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
  AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_status();

-- Insert sample data only if tables are empty
DO $$
BEGIN
  -- Insert sample products if none exist
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    INSERT INTO products (name, description, price, category, sku, stock_quantity) VALUES
    ('CRM Software License', 'Annual software license for CRM system', 1200.00, 'Software', 'CRM-LIC-001', 100),
    ('Consulting Services', 'Professional consulting services', 150.00, 'Services', 'CONSULT-001', 0),
    ('Training Package', 'User training and onboarding package', 500.00, 'Services', 'TRAIN-001', 50),
    ('Custom Integration', 'Custom API integration services', 800.00, 'Services', 'INTEGRATION-001', 10);
  END IF;

  -- Insert sample companies if none exist
  IF NOT EXISTS (SELECT 1 FROM companies LIMIT 1) THEN
    INSERT INTO companies (name, industry, size, website, phone, email, address, status, health_score) VALUES
    ('TechCorp Solutions', 'Technology', '51-200', 'https://techcorp.com', '+1-555-0101', 'contact@techcorp.com', '123 Tech Street, Silicon Valley, CA', 'active', 85),
    ('Global Industries', 'Manufacturing', '201-500', 'https://globalind.com', '+1-555-0102', 'sales@globalind.com', '456 Industrial Ave, Detroit, MI', 'active', 72),
    ('RetailPlus', 'Retail', '11-50', 'https://retailplus.com', '+1-555-0103', 'info@retailplus.com', '789 Commerce Blvd, New York, NY', 'prospect', 60);
  END IF;

  -- Insert sample invoices if none exist
  IF NOT EXISTS (SELECT 1 FROM invoices LIMIT 1) THEN
    INSERT INTO invoices (invoice_number, company_id, status, total_amount, paid_amount, due_date, issue_date, payment_terms, notes) VALUES
    ('INV-2024-001', (SELECT id FROM companies WHERE name = 'TechCorp Solutions' LIMIT 1), 'paid', 1200.00, 1200.00, '2024-02-15', '2024-01-15', 'net_30', 'Annual CRM license renewal'),
    ('INV-2024-002', (SELECT id FROM companies WHERE name = 'Global Industries' LIMIT 1), 'sent', 650.00, 0.00, '2024-02-28', '2024-01-20', 'net_30', 'Consulting and training package'),
    ('INV-2024-003', (SELECT id FROM companies WHERE name = 'RetailPlus' LIMIT 1), 'draft', 800.00, 0.00, '2024-03-15', '2024-01-25', 'net_45', 'Custom integration project');
  END IF;

  -- Insert sample invoice items if none exist
  IF NOT EXISTS (SELECT 1 FROM invoice_items LIMIT 1) THEN
    INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, discount, tax_rate) VALUES
    ((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-001' LIMIT 1), (SELECT id FROM products WHERE name = 'CRM Software License' LIMIT 1), 'CRM Software License - Annual', 1, 1200.00, 0, 0),
    ((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-002' LIMIT 1), (SELECT id FROM products WHERE name = 'Consulting Services' LIMIT 1), 'Consulting Services - 4 hours', 4, 150.00, 0, 0),
    ((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-002' LIMIT 1), (SELECT id FROM products WHERE name = 'Training Package' LIMIT 1), 'User Training Package', 1, 500.00, 0, 0),
    ((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-003' LIMIT 1), (SELECT id FROM products WHERE name = 'Custom Integration' LIMIT 1), 'Custom API Integration', 1, 800.00, 0, 0);
  END IF;

  -- Insert sample payments if none exist
  IF NOT EXISTS (SELECT 1 FROM invoice_payments LIMIT 1) THEN
    INSERT INTO invoice_payments (invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES
    ((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-001' LIMIT 1), 1200.00, '2024-01-20', 'bank_transfer', 'BT-001-2024', 'Full payment received');
  END IF;
END $$;