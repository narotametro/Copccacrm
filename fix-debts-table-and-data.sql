-- =====================================================
-- FIX DEBT COLLECTION - Create debts table and show data
-- =====================================================
-- ISSUE 1: SalesHub inserts into 'debts' table but it doesn't exist
-- ISSUE 2: Customer Buying Patterns shows Walk-in because user didn't select customers
-- SOLUTION: Create debts table with proper schema and RLS
-- =====================================================

-- =====================================================
-- STEP 1: CREATE DEBTS TABLE (if not exists)
-- =====================================================

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
  company_contact_phone TEXT,
  payment_plan TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 2: ENABLE RLS
-- =====================================================

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: DROP OLD POLICIES (if they exist)
-- =====================================================

DROP POLICY IF EXISTS "Users can view debts they created" ON debts;
DROP POLICY IF EXISTS "Users can insert debts" ON debts;
DROP POLICY IF EXISTS "Users can update debts they created" ON debts;
DROP POLICY IF EXISTS "Users can delete debts they created" ON debts;

-- =====================================================
-- STEP 4: CREATE NEW RLS POLICIES
-- =====================================================

-- Users can view debts they created
CREATE POLICY "Users can view debts they created" ON debts
  FOR SELECT
  USING (created_by = auth.uid());

-- Users can insert debts
CREATE POLICY "Users can insert debts" ON debts
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can update debts they created
CREATE POLICY "Users can update debts they created" ON debts
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can delete debts they created
CREATE POLICY "Users can delete debts they created" ON debts
  FOR DELETE
  USING (created_by = auth.uid());

-- =====================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debts_company_id ON debts(company_id);
CREATE INDEX IF NOT EXISTS idx_debts_created_by ON debts(created_by);
CREATE INDEX IF NOT EXISTS idx_debts_invoice_number ON debts(invoice_number);

-- =====================================================
-- STEP 6: CREATE UPDATE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_debts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_debts_updated_at ON debts;
CREATE TRIGGER update_debts_updated_at 
  BEFORE UPDATE ON debts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_debts_updated_at();

-- =====================================================
-- STEP 7: VERIFY TABLE STRUCTURE
-- =====================================================

SELECT 
  '✅ DEBTS TABLE CREATED' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'debts'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 8: CHECK FOR EXISTING DEBTS
-- =====================================================

SELECT 
  '📊 EXISTING DEBTS' as info,
  COUNT(*) as total_debts,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'overdue') as overdue,
  COUNT(*) FILTER (WHERE status = 'paid') as paid,
  SUM(amount) FILTER (WHERE status IN ('pending', 'overdue')) as outstanding_amount
FROM debts;

-- =====================================================
-- ✅ MIGRATION COMPLETE
-- =====================================================
-- 
-- WHAT THIS DOES:
-- 1. Creates 'debts' table that SalesHub uses for credit sales
-- 2. Sets up RLS policies so users only see their own debts
-- 3. Creates indexes for fast queries
-- 4. If you have credit sales, they'll now appear in Debt Collection tab
-- 
-- NEXT STEPS:
-- 1. Make a credit sale in Sales Hub
-- 2. Go to Debt Collection tab - you'll see the debt record
-- 3. For Customer Buying Patterns: Select a customer BEFORE checkout
--    (Don't use Walk-in mode if you want to track specific customers)
-- 
-- =====================================================
