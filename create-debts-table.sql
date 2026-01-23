-- Create debts table for debt collection management
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'reminded', 'written_off')),
  days_overdue INTEGER DEFAULT 0,
  payment_probability INTEGER DEFAULT 0 CHECK (payment_probability >= 0 AND payment_probability <= 100),
  risk_score TEXT DEFAULT 'low' CHECK (risk_score IN ('low', 'medium', 'high')),
  auto_reminder BOOLEAN DEFAULT false,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  company_contact_email TEXT,
  payment_plan TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can access debts from their company" ON debts FOR ALL USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ) OR created_by = auth.uid()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debts_company_id ON debts(company_id);
CREATE INDEX IF NOT EXISTS idx_debts_created_by ON debts(created_by);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();