-- ================================================================
-- FIX: EXPENSES RLS POLICIES + REMOVE COMPANY AS CUSTOMER
-- ================================================================

-- ================================================================
-- PART 1: ADD MISSING RLS POLICIES FOR EXPENSES TABLE
-- ================================================================

-- Check if expenses has company_id column first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'company_id'
  ) THEN
    -- Add company_id if missing
    ALTER TABLE expenses ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    CREATE INDEX idx_expenses_company_id ON expenses(company_id);
    
    -- Update existing expenses to first company
    UPDATE expenses SET company_id = (SELECT id FROM companies ORDER BY created_at ASC LIMIT 1) WHERE company_id IS NULL;
    
    RAISE NOTICE '✓ Added company_id to expenses table';
  ELSE
    RAISE NOTICE '✓ Expenses table already has company_id';
  END IF;
END $$;

-- Drop old expense policies if they exist
DROP POLICY IF EXISTS "Users can view own company expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own company expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own company expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can delete own company expenses" ON expenses;

-- Create company-scoped RLS policies for expenses
CREATE POLICY "Users can view own company expenses" 
ON expenses FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert own company expenses" 
ON expenses FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update own company expenses" 
ON expenses FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can delete own company expenses" 
ON expenses FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- ================================================================
-- PART 2: REMOVE COMPANY RECORDS FROM CUSTOMERS TABLE
-- ================================================================

-- Delete any customer records that match existing company names
DELETE FROM sales_hub_customers 
WHERE name IN (SELECT name FROM companies);

-- Verify no company names exist as customers
DO $$
DECLARE
  company_as_customer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO company_as_customer_count
  FROM sales_hub_customers sc
  INNER JOIN companies c ON sc.name = c.name;
  
  IF company_as_customer_count = 0 THEN
    RAISE NOTICE '✓ No company names found in customers table';
  ELSE
    RAISE NOTICE '⚠️ Still found % company names as customers', company_as_customer_count;
  END IF;
END $$;

-- ================================================================
-- VERIFICATION
-- ================================================================

DO $$
DECLARE
  expenses_policies INTEGER;
  expenses_without_company INTEGER;
BEGIN
  -- Check expenses policies
  SELECT COUNT(*) INTO expenses_policies FROM pg_policies WHERE tablename = 'expenses';
  
  -- Check expenses without company_id
  SELECT COUNT(*) INTO expenses_without_company FROM expenses WHERE company_id IS NULL;
  
  RAISE NOTICE '=== VERIFICATION ===';
  RAISE NOTICE 'Expenses RLS policies: %', expenses_policies;
  RAISE NOTICE 'Expenses without company_id: %', expenses_without_company;
  
  IF expenses_policies >= 4 AND expenses_without_company = 0 THEN
    RAISE NOTICE '✓ Expenses table properly configured';
  ELSE
    RAISE NOTICE '⚠️ Some issues remain';
  END IF;
  
  RAISE NOTICE '✓ Fixes applied successfully';
  RAISE NOTICE 'Refresh browser - expenses should load and company should not appear as customer';
END $$;
