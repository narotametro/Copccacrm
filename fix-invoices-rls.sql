-- ================================================================
-- FIX INVOICES RLS POLICIES TO MATCH COMPANY-SCOPED PATTERN
-- ================================================================
-- The current invoices RLS uses a different pattern (checking if user created company)
-- This updates it to match our consistent company-scoped pattern (checking users.company_id)
-- ================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view invoices from their companies" ON invoices;
DROP POLICY IF EXISTS "Users can view invoices for their companies" ON invoices;
DROP POLICY IF EXISTS "Users can create invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices they created or are assigned to" ON invoices;
DROP POLICY IF EXISTS "Users can update their invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can access invoices" ON invoices;
DROP POLICY IF EXISTS "invoices_select_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_update_policy" ON invoices;

-- Create new company-scoped policies for invoices
CREATE POLICY "Users can view own company invoices" ON invoices
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own company invoices" ON invoices
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company invoices" ON invoices
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin/Managers can delete invoices" ON invoices
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Fix invoice_items policies
DROP POLICY IF EXISTS "Users can view invoice items for accessible invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can view invoice items for their invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can manage invoice items for their invoices" ON invoice_items;

CREATE POLICY "Users can view own company invoice items" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own company invoice items" ON invoice_items
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own company invoice items" ON invoice_items
  FOR UPDATE USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin/Managers can delete invoice items" ON invoice_items
  FOR DELETE USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id IN (
        SELECT company_id FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'manager')
      )
    )
  );

-- Fix invoice_payments policies
DROP POLICY IF EXISTS "Users can view payments for accessible invoices" ON invoice_payments;
DROP POLICY IF EXISTS "Users can view invoice payments for their invoices" ON invoice_payments;
DROP POLICY IF EXISTS "Users can record payments for their invoices" ON invoice_payments;

CREATE POLICY "Users can view own company invoice payments" ON invoice_payments
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own company invoice payments" ON invoice_payments
  FOR ALL WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Fix invoice_reminders policies  
DROP POLICY IF EXISTS "Users can view reminders for accessible invoices" ON invoice_reminders;
DROP POLICY IF EXISTS "Users can view invoice reminders for their invoices" ON invoice_reminders;
DROP POLICY IF EXISTS "Users can manage reminders for their invoices" ON invoice_reminders;

CREATE POLICY "Users can view own company invoice reminders" ON invoice_reminders
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own company invoice reminders" ON invoice_reminders
  FOR ALL WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Verification
DO $$
DECLARE
  invoice_policies INTEGER;
  invoice_items_policies INTEGER;
  invoice_payments_policies INTEGER;
  invoice_reminders_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO invoice_policies FROM pg_policies WHERE tablename = 'invoices';
  SELECT COUNT(*) INTO invoice_items_policies FROM pg_policies WHERE tablename = 'invoice_items';
  SELECT COUNT(*) INTO invoice_payments_policies FROM pg_policies WHERE tablename = 'invoice_payments';
  SELECT COUNT(*) INTO invoice_reminders_policies FROM pg_policies WHERE tablename = 'invoice_reminders';
  
  RAISE NOTICE 'Invoices policies: %', invoice_policies;
  RAISE NOTICE 'Invoice items policies: %', invoice_items_policies;
  RAISE NOTICE 'Invoice payments policies: %', invoice_payments_policies;
  RAISE NOTICE 'Invoice reminders policies: %', invoice_reminders_policies;
  
  IF invoice_policies >= 4 AND invoice_items_policies >= 4 THEN
    RAISE NOTICE '✅ Invoice RLS policies updated successfully!';
  ELSE
    RAISE WARNING '⚠ Check policy counts - expected at least 4 for invoices and invoice_items';
  END IF;
END $$;
