-- COPCCA CRM - Complete Database Migration
-- Creates all missing tables and columns for full functionality
-- Run this in your Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- MISSING TABLES FROM BASE SCHEMA
-- ===========================================

-- After Sales Tasks
CREATE TABLE IF NOT EXISTS after_sales_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('follow_up', 'support', 'upsell', 'renewal', 'feedback')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- After Sales Feedback
CREATE TABLE IF NOT EXISTS after_sales_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES after_sales_tasks(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_type TEXT CHECK (feedback_type IN ('satisfaction', 'complaint', 'suggestion', 'review')),
  feedback_text TEXT,
  response_text TEXT,
  response_by UUID REFERENCES users(id),
  response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing KPIs
CREATE TABLE IF NOT EXISTS marketing_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL,
  target_value DECIMAL,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPI Data
CREATE TABLE IF NOT EXISTS kpi_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_value DECIMAL,
  target_value DECIMAL,
  unit TEXT,
  period TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactions
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'note', 'task')),
  title TEXT NOT NULL,
  description TEXT,
  outcome TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Invitation Links
CREATE TABLE IF NOT EXISTS invitation_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL NOT NULL DEFAULT 0,
  tax_rate DECIMAL DEFAULT 0,
  tax_amount DECIMAL DEFAULT 0,
  discount_amount DECIMAL DEFAULT 0,
  total_amount DECIMAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  payment_terms TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL NOT NULL DEFAULT 1,
  unit_price DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  tax_rate DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'credit_card', 'check', 'cash', 'other')),
  reference_number TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Reminders
CREATE TABLE IF NOT EXISTS invoice_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  reminder_type TEXT CHECK (reminder_type IN ('email', 'call', 'letter')),
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES users(id),
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- MISSING COLUMNS ON EXISTING TABLES
-- ===========================================

-- Add missing columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS jtbd TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS feedback_count INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pain_points TEXT[];
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS annual_revenue DECIMAL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_count INTEGER;

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_company_owner BOOLEAN DEFAULT false;

-- Add missing columns to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS products TEXT[];
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- Add missing columns to after_sales_feedback table
ALTER TABLE after_sales_feedback ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES after_sales_tasks(id) ON DELETE CASCADE;

-- Temporarily drop NOT NULL constraint if it exists to allow cleanup
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'after_sales_feedback' 
        AND column_name = 'task_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE after_sales_feedback ALTER COLUMN task_id DROP NOT NULL;
    END IF;
END $$;

-- Clean up invalid task_id references before adding constraint
DELETE FROM after_sales_feedback WHERE task_id IS NULL OR task_id NOT IN (SELECT id FROM after_sales_tasks);

-- Ensure foreign key constraint exists for task_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_after_sales_feedback_task_id') THEN
        ALTER TABLE after_sales_feedback ADD CONSTRAINT fk_after_sales_feedback_task_id FOREIGN KEY (task_id) REFERENCES after_sales_tasks(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE after_sales_feedback ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Temporarily drop NOT NULL constraint if it exists for company_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'after_sales_feedback' 
        AND column_name = 'company_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE after_sales_feedback ALTER COLUMN company_id DROP NOT NULL;
    END IF;
END $$;

-- Clean up invalid company_id references before adding constraint
DELETE FROM after_sales_feedback WHERE company_id IS NULL OR company_id NOT IN (SELECT id FROM companies);

-- Ensure foreign key constraint exists for company_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_after_sales_feedback_company_id') THEN
        ALTER TABLE after_sales_feedback ADD CONSTRAINT fk_after_sales_feedback_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE after_sales_feedback ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE after_sales_feedback ADD COLUMN IF NOT EXISTS feedback_type TEXT;
ALTER TABLE after_sales_feedback ADD COLUMN IF NOT EXISTS feedback_text TEXT;
ALTER TABLE after_sales_feedback ADD COLUMN IF NOT EXISTS response_text TEXT;
ALTER TABLE after_sales_feedback ADD COLUMN IF NOT EXISTS response_by UUID REFERENCES users(id);

-- Clean up invalid response_by references before adding constraint
UPDATE after_sales_feedback SET response_by = NULL WHERE response_by IS NOT NULL AND response_by NOT IN (SELECT id FROM users);

-- Ensure foreign key constraint exists for response_by
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_after_sales_feedback_response_by') THEN
        ALTER TABLE after_sales_feedback ADD CONSTRAINT fk_after_sales_feedback_response_by FOREIGN KEY (response_by) REFERENCES users(id);
    END IF;
END $$;

ALTER TABLE after_sales_feedback ADD COLUMN IF NOT EXISTS response_at TIMESTAMPTZ;
ALTER TABLE after_sales_feedback ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE after_sales_feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update NULL values to defaults before adding constraints
UPDATE after_sales_feedback SET feedback_type = 'satisfaction' WHERE feedback_type IS NULL OR feedback_type NOT IN ('satisfaction', 'complaint', 'suggestion', 'review');

-- Add CHECK constraints after updating invalid values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_feedback_type') THEN
        ALTER TABLE after_sales_feedback ADD CONSTRAINT chk_feedback_type CHECK (feedback_type IN ('satisfaction', 'complaint', 'suggestion', 'review'));
    END IF;
END $$;

-- Add missing columns to after_sales_tasks table
ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Temporarily drop NOT NULL constraint if it exists for company_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'after_sales_tasks' 
        AND column_name = 'company_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE after_sales_tasks ALTER COLUMN company_id DROP NOT NULL;
    END IF;
END $$;

-- Clean up invalid company_id references before adding constraint
DELETE FROM after_sales_tasks WHERE company_id IS NULL OR company_id NOT IN (SELECT id FROM companies);

-- Ensure foreign key constraint exists for company_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_after_sales_tasks_company_id') THEN
        ALTER TABLE after_sales_tasks ADD CONSTRAINT fk_after_sales_tasks_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS task_type TEXT;
ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);

-- Clean up invalid assigned_to references before adding constraint
UPDATE after_sales_tasks SET assigned_to = NULL WHERE assigned_to IS NOT NULL AND assigned_to NOT IN (SELECT id FROM users);

-- Ensure foreign key constraint exists for assigned_to
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_after_sales_tasks_assigned_to') THEN
        ALTER TABLE after_sales_tasks ADD CONSTRAINT fk_after_sales_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id);
    END IF;
END $$;

ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE after_sales_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update NULL values to defaults before adding constraints
UPDATE after_sales_tasks SET task_type = 'follow_up' WHERE task_type IS NULL;
UPDATE after_sales_tasks SET title = 'Untitled Task' WHERE title IS NULL;
UPDATE after_sales_tasks SET status = 'pending' WHERE status IS NULL OR status NOT IN ('pending', 'in_progress', 'completed', 'cancelled');
UPDATE after_sales_tasks SET priority = 'medium' WHERE priority IS NULL OR priority NOT IN ('low', 'medium', 'high', 'urgent');

-- Add constraints after updating NULL values
ALTER TABLE after_sales_tasks ALTER COLUMN task_type SET NOT NULL;
ALTER TABLE after_sales_tasks ALTER COLUMN title SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_task_type') THEN
        ALTER TABLE after_sales_tasks ADD CONSTRAINT chk_task_type CHECK (task_type IN ('follow_up', 'support', 'upsell', 'renewal', 'feedback'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_status') THEN
        ALTER TABLE after_sales_tasks ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_priority') THEN
        ALTER TABLE after_sales_tasks ADD CONSTRAINT chk_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    END IF;
END $$;

-- Add missing columns to marketing_kpis table
ALTER TABLE marketing_kpis ADD COLUMN IF NOT EXISTS campaign_id UUID;
ALTER TABLE marketing_kpis ADD COLUMN IF NOT EXISTS metric_name TEXT NOT NULL;
ALTER TABLE marketing_kpis ADD COLUMN IF NOT EXISTS metric_value DECIMAL;
ALTER TABLE marketing_kpis ADD COLUMN IF NOT EXISTS target_value DECIMAL;
ALTER TABLE marketing_kpis ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE marketing_kpis ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE marketing_kpis ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to kpi_data table
ALTER TABLE kpi_data ADD COLUMN IF NOT EXISTS kpi_name TEXT NOT NULL;
ALTER TABLE kpi_data ADD COLUMN IF NOT EXISTS category TEXT NOT NULL;
ALTER TABLE kpi_data ADD COLUMN IF NOT EXISTS current_value DECIMAL;
ALTER TABLE kpi_data ADD COLUMN IF NOT EXISTS target_value DECIMAL;
ALTER TABLE kpi_data ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE kpi_data ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE kpi_data ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE kpi_data ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to interactions table
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS interaction_type TEXT;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update NULL values to defaults before adding constraints
UPDATE interactions SET interaction_type = 'note' WHERE interaction_type IS NULL OR interaction_type NOT IN ('call', 'email', 'meeting', 'note', 'task');
UPDATE interactions SET title = 'Untitled Interaction' WHERE title IS NULL;

-- Add constraints after updating NULL values
ALTER TABLE interactions ALTER COLUMN interaction_type SET NOT NULL;
ALTER TABLE interactions ALTER COLUMN title SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_interaction_type') THEN
        ALTER TABLE interactions ADD CONSTRAINT chk_interaction_type CHECK (interaction_type IN ('call', 'email', 'meeting', 'note', 'task'));
    END IF;
END $$;

-- Add missing columns to user_permissions table
ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS permission_type TEXT;
ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS resource_type TEXT;
ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS resource_id UUID;
ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES users(id);
ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Update NULL values to defaults before adding constraints
UPDATE user_permissions SET permission_type = 'read' WHERE permission_type IS NULL;
UPDATE user_permissions SET resource_type = 'company' WHERE resource_type IS NULL;

-- Add constraints after updating NULL values
ALTER TABLE user_permissions ALTER COLUMN permission_type SET NOT NULL;
ALTER TABLE user_permissions ALTER COLUMN resource_type SET NOT NULL;

-- Add missing columns to invitation_links table
ALTER TABLE invitation_links ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE invitation_links ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE invitation_links ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);
ALTER TABLE invitation_links ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
ALTER TABLE invitation_links ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;
ALTER TABLE invitation_links ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update NULL values to defaults before adding constraints
UPDATE invitation_links SET email = 'unknown@example.com' WHERE email IS NULL;
UPDATE invitation_links SET role = 'user' WHERE role IS NULL OR role NOT IN ('admin', 'manager', 'user');

-- Add constraints after updating NULL values
ALTER TABLE invitation_links ALTER COLUMN email SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_role') THEN
        ALTER TABLE invitation_links ADD CONSTRAINT chk_role CHECK (role IN ('admin', 'manager', 'user'));
    END IF;
END $$;

-- Add missing columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issue_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate DECIMAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount DECIMAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_amount DECIMAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update NULL values to defaults before adding constraints
UPDATE invoices SET invoice_number = 'INV-' || id::text WHERE invoice_number IS NULL;
UPDATE invoices SET issue_date = CURRENT_DATE WHERE issue_date IS NULL;
UPDATE invoices SET due_date = CURRENT_DATE + INTERVAL '30 days' WHERE due_date IS NULL;
UPDATE invoices SET subtotal = 0 WHERE subtotal IS NULL;
UPDATE invoices SET total_amount = 0 WHERE total_amount IS NULL;
UPDATE invoices SET status = 'draft' WHERE status IS NULL OR status NOT IN ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- Add constraints after updating NULL values
ALTER TABLE invoices ALTER COLUMN invoice_number SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN issue_date SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN due_date SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN subtotal SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN total_amount SET NOT NULL;

-- Add unique constraint safely (PostgreSQL doesn't support IF NOT EXISTS for ADD CONSTRAINT)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_invoice_number_key') THEN
        ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_invoice_status') THEN
        ALTER TABLE invoices ADD CONSTRAINT chk_invoice_status CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'));
    END IF;
END $$;

-- Add missing columns to invoice_items table
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS quantity DECIMAL DEFAULT 1;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS total_price DECIMAL;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tax_rate DECIMAL DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update NULL values to defaults before adding constraints
UPDATE invoice_items SET description = 'Item description' WHERE description IS NULL;
UPDATE invoice_items SET quantity = 1 WHERE quantity IS NULL;
UPDATE invoice_items SET unit_price = 0 WHERE unit_price IS NULL;
UPDATE invoice_items SET total_price = 0 WHERE total_price IS NULL;

-- Add constraints after updating NULL values
ALTER TABLE invoice_items ALTER COLUMN description SET NOT NULL;
ALTER TABLE invoice_items ALTER COLUMN quantity SET NOT NULL;
ALTER TABLE invoice_items ALTER COLUMN unit_price SET NOT NULL;
ALTER TABLE invoice_items ALTER COLUMN total_price SET NOT NULL;

-- Add missing columns to invoice_payments table
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS amount DECIMAL;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES users(id);
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update NULL values to defaults before adding constraints
UPDATE invoice_payments SET amount = 0 WHERE amount IS NULL;
UPDATE invoice_payments SET payment_date = CURRENT_DATE WHERE payment_date IS NULL;
UPDATE invoice_payments SET payment_method = 'bank_transfer' WHERE payment_method IS NULL OR payment_method NOT IN ('bank_transfer', 'credit_card', 'check', 'cash', 'other');

-- Add constraints after updating NULL values
ALTER TABLE invoice_payments ALTER COLUMN amount SET NOT NULL;
ALTER TABLE invoice_payments ALTER COLUMN payment_date SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payment_method') THEN
        ALTER TABLE invoice_payments ADD CONSTRAINT chk_payment_method CHECK (payment_method IN ('bank_transfer', 'credit_card', 'check', 'cash', 'other'));
    END IF;
END $$;

-- Add missing columns to invoice_reminders table
ALTER TABLE invoice_reminders ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE invoice_reminders ADD COLUMN IF NOT EXISTS reminder_type TEXT;
ALTER TABLE invoice_reminders ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE invoice_reminders ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES users(id);
ALTER TABLE invoice_reminders ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE invoice_reminders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add constraints after updating NULL values (no NULL updates needed for this table)
UPDATE invoice_reminders SET reminder_type = 'email' WHERE reminder_type IS NULL OR reminder_type NOT IN ('email', 'call', 'letter');

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_reminder_type') THEN
        ALTER TABLE invoice_reminders ADD CONSTRAINT chk_reminder_type CHECK (reminder_type IN ('email', 'call', 'letter'));
    END IF;
END $$;

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_assigned_to ON companies(assigned_to);

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);

-- After sales indexes
CREATE INDEX IF NOT EXISTS idx_after_sales_company_id ON after_sales(company_id);
CREATE INDEX IF NOT EXISTS idx_after_sales_status ON after_sales(status);

-- Debt collection indexes
CREATE INDEX IF NOT EXISTS idx_debt_collection_company_id ON debt_collection(company_id);
CREATE INDEX IF NOT EXISTS idx_debt_collection_status ON debt_collection(status);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- ===========================================
-- BASIC RLS POLICIES (FIXED - NO INFINITE RECURSION)
-- ===========================================

-- Drop all existing policies on all tables to avoid conflicts
DO $$
DECLARE
    pol record;
    table_name text;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY[
        'companies', 'users', 'deals', 'after_sales', 'after_sales_tasks', 'after_sales_feedback',
        'debt_collection', 'marketing_kpis', 'competitors', 'sales_strategies', 'kpi_data',
        'interactions', 'user_permissions', 'invitation_links', 'invoices', 'invoice_items',
        'invoice_payments', 'invoice_reminders'
    ])
    LOOP
        FOR pol IN SELECT polname FROM pg_policy WHERE polrelid = table_name::regclass
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.polname) || ' ON ' || quote_ident(table_name);
        END LOOP;
    END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

-- FIXED: Users policies (avoid infinite recursion)
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- FIXED: Admin policy using user_metadata from JWT instead of top-level role
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Companies policies
CREATE POLICY "Users can view companies they created or are assigned to" ON companies
  FOR SELECT USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

CREATE POLICY "Users can create companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update companies they created or are assigned to" ON companies
  FOR UPDATE USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Deals policies
CREATE POLICY "Users can view deals for their companies" ON deals
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = deals.company_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can create deals" ON deals
  FOR INSERT WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Users can update their deals" ON deals
  FOR UPDATE USING (assigned_to = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

-- After sales policies
CREATE POLICY "Users can view after sales for their companies" ON after_sales
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = after_sales.company_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())
    )
  );

-- After sales tasks policies
CREATE POLICY "Users can view after sales tasks for their companies" ON after_sales_tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = after_sales_tasks.company_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())
    )
  );

-- After sales feedback policies
CREATE POLICY "Users can view after sales feedback for their companies" ON after_sales_feedback
  FOR SELECT USING (
    response_by = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = after_sales_feedback.company_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())
    )
  );

-- Debt collection policies
CREATE POLICY "Users can view debt collection for their companies" ON debt_collection
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = debt_collection.company_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())
    )
  );

-- Invoices policies
CREATE POLICY "Users can view invoices for their companies" ON invoices
  FOR SELECT USING (
    created_by = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = invoices.company_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can create invoices" ON invoices
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their invoices" ON invoices
  FOR UPDATE USING (created_by = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

-- Invoice items policies (inherit from invoices)
CREATE POLICY "Users can view invoice items for their invoices" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id AND (
        i.created_by = auth.uid() OR
        (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
        EXISTS (
          SELECT 1 FROM companies c
          WHERE c.id = i.company_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())
        )
      )
    )
  );

-- Invoice payments policies (inherit from invoices)
CREATE POLICY "Users can view invoice payments for their invoices" ON invoice_payments
  FOR SELECT USING (
    recorded_by = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_payments.invoice_id AND (
        i.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM companies c
          WHERE c.id = i.company_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())
        )
      )
    )
  );

-- Invoice reminders policies (inherit from invoices)
CREATE POLICY "Users can view invoice reminders for their invoices" ON invoice_reminders
  FOR SELECT USING (
    sent_by = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_reminders.invoice_id AND (
        i.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM companies c
          WHERE c.id = i.company_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())
        )
      )
    )
  );

-- Competitors policies (public read for now)
CREATE POLICY "Users can view competitors" ON competitors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage competitors" ON competitors
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

-- Sales strategies policies
CREATE POLICY "Users can view sales strategies for their companies" ON sales_strategies
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = sales_strategies.company_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())
    )
  );

-- Marketing KPIs policies
CREATE POLICY "Users can view marketing KPIs" ON marketing_kpis
  FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

-- KPI data policies
CREATE POLICY "Users can view KPI data" ON kpi_data
  FOR SELECT USING (true);

-- Interactions policies
CREATE POLICY "Users can view interactions for their companies" ON interactions
  FOR SELECT USING (
    user_id = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = interactions.company_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())
    )
  );

-- User permissions policies
CREATE POLICY "Users can view their own permissions" ON user_permissions
  FOR SELECT USING (user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

-- Invitation links policies
CREATE POLICY "Users can view invitation links they created" ON invitation_links
  FOR SELECT USING (invited_by = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

-- Migration completed successfully!
-- All tables and columns have been created or updated.
-- FIXED: RLS policies applied without infinite recursion.
-- FIXED: Foreign key relationships established.
-- FIXED: Existing policies dropped and recreated to avoid conflicts.
-- FIXED: Missing columns added to existing tables.
-- FIXED: NULL values updated before adding NOT NULL constraints.
-- FIXED: Invalid CHECK constraint values updated to valid defaults.
-- FIXED: Existing constraints handled appropriately.
-- Next steps:
-- 1. Run your application and test functionality
-- 2. The infinite recursion errors should be resolved
-- 3. All data access should work properly
-- 4. Consider adding more sophisticated RLS policies for production