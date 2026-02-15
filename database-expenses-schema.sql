-- =====================================================
-- COPCCA CRM: Expenses Management Database Schema
-- =====================================================
-- This creates tables for tracking business expenses, categories, and financial insights

-- =====================================================
-- 1. EXPENSE CATEGORIES TABLE
-- =====================================================
-- Stores predefined and custom expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false, -- true for system categories, false for custom
  icon VARCHAR(50), -- emoji or icon identifier
  color VARCHAR(20), -- hex color for UI display
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(name, company_id) -- prevent duplicate categories per company
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expense_categories_company ON expense_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_default ON expense_categories(is_default);

-- =====================================================
-- 2. EXPENSES TABLE
-- =====================================================
-- Main expenses tracking table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) DEFAULT 'TZS',
  expense_date DATE NOT NULL,
  
  -- Categorization
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  category_name VARCHAR(100), -- denormalized for historical tracking
  
  -- Payment Information
  payment_method VARCHAR(50) NOT NULL, -- Cash, M-Pesa, Bank, Credit, etc.
  payment_reference VARCHAR(100), -- transaction ID or receipt number
  status VARCHAR(20) NOT NULL DEFAULT 'Paid', -- Paid, Pending, Overdue, Cancelled
  
  -- Vendor Information
  vendor_name VARCHAR(255),
  vendor_contact VARCHAR(100),
  vendor_tin VARCHAR(50), -- Tax Identification Number
  
  -- Business Linking
  linked_to_type VARCHAR(50), -- Product, Campaign, Customer, Order, etc.
  linked_to_id UUID, -- ID of linked entity
  linked_to_name VARCHAR(255), -- denormalized name for display
  
  -- Recurring Expenses
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency VARCHAR(20), -- Daily, Weekly, Monthly, Quarterly, Yearly
  recurrence_interval INTEGER DEFAULT 1, -- every X days/weeks/months
  next_due_date DATE,
  parent_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL, -- for recurring expense instances
  
  -- Tax & Compliance
  is_tax_deductible BOOLEAN DEFAULT true,
  tax_category VARCHAR(50), -- Operating, Capital, etc.
  vat_amount DECIMAL(15, 2) DEFAULT 0,
  vat_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Attachments & Receipts
  receipt_url TEXT,
  receipt_file_name VARCHAR(255),
  attachment_urls TEXT[], -- array of attachment URLs
  
  -- Approval Workflow
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  
  -- Metadata
  notes TEXT,
  tags TEXT[], -- array of tags for flexible categorization
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_company ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_name);
CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON expenses(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_expenses_linked ON expenses(linked_to_type, linked_to_id);

-- =====================================================
-- 3. EXPENSE BUDGETS TABLE
-- =====================================================
-- Set budgets for expense categories
CREATE TABLE IF NOT EXISTS expense_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Budget Details
  budget_amount DECIMAL(15, 2) NOT NULL CHECK (budget_amount >= 0),
  period_type VARCHAR(20) NOT NULL, -- Monthly, Quarterly, Yearly
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Alerts
  alert_threshold_percentage INTEGER DEFAULT 80, -- alert when 80% spent
  alert_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(category_id, company_id, start_date, end_date)
);

CREATE INDEX IF NOT EXISTS idx_expense_budgets_company ON expense_budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_budgets_category ON expense_budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_budgets_period ON expense_budgets(start_date, end_date);

-- =====================================================
-- 4. EXPENSE ANALYTICS TABLE
-- =====================================================
-- Pre-computed analytics for faster dashboard loading
CREATE TABLE IF NOT EXISTS expense_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Time Period
  period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly, yearly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Aggregated Metrics
  total_expenses DECIMAL(15, 2) DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  paid_expenses DECIMAL(15, 2) DEFAULT 0,
  pending_expenses DECIMAL(15, 2) DEFAULT 0,
  recurring_expenses DECIMAL(15, 2) DEFAULT 0,
  tax_deductible_expenses DECIMAL(15, 2) DEFAULT 0,
  
  -- Top Categories (JSON)
  top_categories JSONB, -- {category_name: amount}
  
  -- Vendor Analysis (JSON)
  top_vendors JSONB, -- {vendor_name: amount}
  
  -- Trends
  previous_period_total DECIMAL(15, 2),
  change_percentage DECIMAL(5, 2),
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(company_id, period_type, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_expense_analytics_company ON expense_analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_analytics_period ON expense_analytics(period_type, period_start);

-- =====================================================
-- 5. EXPENSE APPROVALS TABLE
-- =====================================================
-- Track approval workflow for expenses
CREATE TABLE IF NOT EXISTS expense_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  
  -- Approval Details
  status VARCHAR(20) NOT NULL, -- Pending, Approved, Rejected
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Comments
  request_notes TEXT,
  review_notes TEXT,
  
  -- Metadata
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expense_approvals_expense ON expense_approvals(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_status ON expense_approvals(status);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_company ON expense_approvals(company_id);

-- =====================================================
-- 6. EXPENSE ATTACHMENTS TABLE
-- =====================================================
-- Store multiple attachments per expense
CREATE TABLE IF NOT EXISTS expense_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  
  -- File Information
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- image/jpeg, application/pdf, etc.
  file_size BIGINT, -- in bytes
  
  -- Attachment Type
  attachment_type VARCHAR(50) DEFAULT 'receipt', -- receipt, invoice, contract, other
  
  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense ON expense_attachments(expense_id);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_attachments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: EXPENSE CATEGORIES
-- =====================================================

-- View: Users can see default categories + their company's custom categories
CREATE POLICY "Users can view expense categories"
ON expense_categories FOR SELECT
USING (
  is_default = true 
  OR 
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Insert: Users can create custom categories for their company
CREATE POLICY "Users can create expense categories"
ON expense_categories FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Update: Users can update their company's custom categories
CREATE POLICY "Users can update expense categories"
ON expense_categories FOR UPDATE
USING (
  is_default = false AND
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Delete: Users can delete their company's custom categories
CREATE POLICY "Users can delete expense categories"
ON expense_categories FOR DELETE
USING (
  is_default = false AND
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES: EXPENSES
-- =====================================================

-- View: Users can see their company's expenses
CREATE POLICY "Users can view company expenses"
ON expenses FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Insert: Users can create expenses for their company
CREATE POLICY "Users can create expenses"
ON expenses FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Update: Users can update their company's expenses
CREATE POLICY "Users can update expenses"
ON expenses FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Delete: Users can delete their company's expenses
CREATE POLICY "Users can delete expenses"
ON expenses FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES: EXPENSE BUDGETS
-- =====================================================

CREATE POLICY "Users can view company budgets"
ON expense_budgets FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can manage company budgets"
ON expense_budgets FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES: EXPENSE ANALYTICS
-- =====================================================

CREATE POLICY "Users can view company analytics"
ON expense_analytics FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "System can manage analytics"
ON expense_analytics FOR ALL
USING (true);

-- =====================================================
-- RLS POLICIES: EXPENSE APPROVALS
-- =====================================================

CREATE POLICY "Users can view company approvals"
ON expense_approvals FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can manage company approvals"
ON expense_approvals FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES: EXPENSE ATTACHMENTS
-- =====================================================

CREATE POLICY "Users can view expense attachments"
ON expense_attachments FOR SELECT
USING (
  expense_id IN (
    SELECT id FROM expenses WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can manage expense attachments"
ON expense_attachments FOR ALL
USING (
  expense_id IN (
    SELECT id FROM expenses WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  )
);

-- =====================================================
-- 8. SEED DEFAULT EXPENSE CATEGORIES
-- =====================================================

INSERT INTO expense_categories (name, description, is_default, icon, color) VALUES
('Rent', 'Office and facility rental costs', true, '🏢', '#EF4444'),
('Salaries', 'Employee wages and salaries', true, '💰', '#3B82F6'),
('Transport/Fuel', 'Vehicle fuel and transportation costs', true, '🚗', '#F59E0B'),
('Inventory Purchase', 'Stock and inventory procurement', true, '📦', '#8B5CF6'),
('Packaging', 'Product packaging materials', true, '📦', '#10B981'),
('Marketing/Ads', 'Marketing campaigns and advertising', true, '📢', '#EC4899'),
('Utilities', 'Electricity, water, and utilities', true, '💡', '#6366F1'),
('Internet & Airtime', 'Internet and phone expenses', true, '📱', '#14B8A6'),
('Equipment Repair', 'Maintenance and repair costs', true, '🔧', '#F97316'),
('Taxes & Licenses', 'Government taxes and licensing fees', true, '📋', '#84CC16'),
('Loan Repayment', 'Business loan repayments', true, '💳', '#EF4444'),
('Miscellaneous', 'Other uncategorized expenses', true, '📝', '#6B7280')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_budgets_updated_at BEFORE UPDATE ON expense_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. FUNCTION: Calculate Expense Totals by Period
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_expense_totals(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  total_expenses DECIMAL,
  total_count BIGINT,
  paid_expenses DECIMAL,
  pending_expenses DECIMAL,
  recurring_expenses DECIMAL,
  top_category VARCHAR,
  top_vendor VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  WITH totals AS (
    SELECT
      COALESCE(SUM(amount), 0) as total_exp,
      COUNT(*) as count_exp,
      COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0) as paid_exp,
      COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) as pending_exp,
      COALESCE(SUM(CASE WHEN is_recurring = true THEN amount ELSE 0 END), 0) as recurring_exp
    FROM expenses
    WHERE company_id = p_company_id
      AND expense_date >= p_start_date
      AND expense_date <= p_end_date
  ),
  top_cat AS (
    SELECT category_name
    FROM expenses
    WHERE company_id = p_company_id
      AND expense_date >= p_start_date
      AND expense_date <= p_end_date
      AND category_name IS NOT NULL
    GROUP BY category_name
    ORDER BY SUM(amount) DESC
    LIMIT 1
  ),
  top_vend AS (
    SELECT vendor_name
    FROM expenses
    WHERE company_id = p_company_id
      AND expense_date >= p_start_date
      AND expense_date <= p_end_date
      AND vendor_name IS NOT NULL
    GROUP BY vendor_name
    ORDER BY SUM(amount) DESC
    LIMIT 1
  )
  SELECT
    t.total_exp,
    t.count_exp,
    t.paid_exp,
    t.pending_exp,
    t.recurring_exp,
    COALESCE(tc.category_name, 'N/A'),
    COALESCE(tv.vendor_name, 'N/A')
  FROM totals t
  LEFT JOIN top_cat tc ON true
  LEFT JOIN top_vend tv ON true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. FUNCTION: Generate Recurring Expenses
-- =====================================================

CREATE OR REPLACE FUNCTION generate_recurring_expenses()
RETURNS void AS $$
BEGIN
  -- Create new expense records for recurring expenses that are due
  INSERT INTO expenses (
    title,
    description,
    amount,
    currency,
    expense_date,
    category_id,
    category_name,
    payment_method,
    status,
    vendor_name,
    vendor_contact,
    vendor_tin,
    is_recurring,
    recurrence_frequency,
    recurrence_interval,
    next_due_date,
    parent_expense_id,
    is_tax_deductible,
    tax_category,
    notes,
    created_by,
    company_id
  )
  SELECT
    title || ' (Auto-generated)',
    description,
    amount,
    currency,
    next_due_date,
    category_id,
    category_name,
    payment_method,
    'Pending', -- newly generated expenses start as Pending
    vendor_name,
    vendor_contact,
    vendor_tin,
    is_recurring,
    recurrence_frequency,
    recurrence_interval,
    CASE recurrence_frequency
      WHEN 'Daily' THEN next_due_date + (recurrence_interval || ' days')::interval
      WHEN 'Weekly' THEN next_due_date + (recurrence_interval || ' weeks')::interval
      WHEN 'Monthly' THEN next_due_date + (recurrence_interval || ' months')::interval
      WHEN 'Quarterly' THEN next_due_date + (recurrence_interval * 3 || ' months')::interval
      WHEN 'Yearly' THEN next_due_date + (recurrence_interval || ' years')::interval
    END,
    id, -- parent expense reference
    is_tax_deductible,
    tax_category,
    'Auto-generated from recurring expense',
    created_by,
    company_id
  FROM expenses
  WHERE is_recurring = true
    AND next_due_date <= CURRENT_DATE
    AND next_due_date IS NOT NULL;

  -- Update the next due date on parent recurring expenses
  UPDATE expenses
  SET next_due_date = CASE recurrence_frequency
    WHEN 'Daily' THEN next_due_date + (recurrence_interval || ' days')::interval
    WHEN 'Weekly' THEN next_due_date + (recurrence_interval || ' weeks')::interval
    WHEN 'Monthly' THEN next_due_date + (recurrence_interval || ' months')::interval
    WHEN 'Quarterly' THEN next_due_date + (recurrence_interval * 3 || ' months')::interval
    WHEN 'Yearly' THEN next_due_date + (recurrence_interval || ' years')::interval
  END
  WHERE is_recurring = true
    AND next_due_date <= CURRENT_DATE
    AND parent_expense_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Expense Summary by Category
CREATE OR REPLACE VIEW v_expense_summary_by_category AS
SELECT
  e.company_id,
  e.category_id,
  ec.name as category_name,
  COUNT(*) as expense_count,
  SUM(e.amount) as total_amount,
  AVG(e.amount) as average_amount,
  SUM(CASE WHEN e.status = 'Paid' THEN e.amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN e.status = 'Pending' THEN e.amount ELSE 0 END) as pending_amount
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
GROUP BY e.company_id, e.category_id, ec.name;

-- View: Monthly Expense Trends
CREATE OR REPLACE VIEW v_monthly_expense_trends AS
SELECT
  company_id,
  DATE_TRUNC('month', expense_date) as month,
  COUNT(*) as expense_count,
  SUM(amount) as total_amount,
  SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN is_recurring THEN amount ELSE 0 END) as recurring_amount
FROM expenses
GROUP BY company_id, DATE_TRUNC('month', expense_date)
ORDER BY month DESC;

-- View: Vendor Spending Analysis
CREATE OR REPLACE VIEW v_vendor_spending AS
SELECT
  company_id,
  vendor_name,
  COUNT(*) as transaction_count,
  SUM(amount) as total_spent,
  AVG(amount) as average_transaction,
  MAX(expense_date) as last_transaction_date
FROM expenses
WHERE vendor_name IS NOT NULL
GROUP BY company_id, vendor_name;

-- =====================================================
-- 13. GRANTS (adjust based on your roles)
-- =====================================================

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Expenses database schema created successfully!';
  RAISE NOTICE '📊 Tables created: expense_categories, expenses, expense_budgets, expense_analytics, expense_approvals, expense_attachments';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '📋 Default expense categories seeded';
  RAISE NOTICE '⚙️  Helper functions and views created';
END $$;
