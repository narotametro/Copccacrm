-- =====================================================
-- EMERGENCY ROLLBACK - RESTORE ACCESS TEMPORARILY
-- =====================================================
-- This restores the old permissive policies so users can see their data
-- We'll fix the created_by values properly, THEN re-apply strict policies
-- =====================================================

-- Drop the overly strict policies
DROP POLICY IF EXISTS "products_select_secure" ON products;
DROP POLICY IF EXISTS "products_insert_secure" ON products;
DROP POLICY IF EXISTS "products_update_secure" ON products;
DROP POLICY IF EXISTS "products_delete_secure" ON products;

DROP POLICY IF EXISTS "companies_select_secure" ON companies;
DROP POLICY IF EXISTS "companies_insert_secure" ON companies;
DROP POLICY IF EXISTS "companies_update_secure" ON companies;
DROP POLICY IF EXISTS "companies_delete_secure" ON companies;

DROP POLICY IF EXISTS "invoices_select_secure" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_secure" ON invoices;
DROP POLICY IF EXISTS "invoices_update_secure" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_secure" ON invoices;

DROP POLICY IF EXISTS "deals_select_secure" ON deals;
DROP POLICY IF EXISTS "deals_insert_secure" ON deals;
DROP POLICY IF EXISTS "deals_update_secure" ON deals;

-- =====================================================
-- RESTORE OLD POLICIES (TEMPORARILY)
-- =====================================================

-- Products: Allow all authenticated users (temporary)
CREATE POLICY "products_temp_access" ON products
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Companies: Allow all authenticated users (temporary)  
CREATE POLICY "companies_temp_access" ON companies
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Invoices: Allow all authenticated users (temporary)
CREATE POLICY "invoices_temp_access" ON invoices
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Deals: Allow all authenticated users (temporary)
CREATE POLICY "deals_temp_access" ON deals
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- ✅ ROLLBACK COMPLETE
-- =====================================================
-- Users can now see their data again
-- The frontend filters (in React) still provide SOME isolation
-- Next step: Fix created_by values properly, then re-apply secure policies
-- =====================================================

SELECT '✅ EMERGENCY ROLLBACK COMPLETE - Users can access data again' as status;
