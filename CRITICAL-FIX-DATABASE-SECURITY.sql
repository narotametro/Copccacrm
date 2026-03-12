-- =====================================================
-- ⚠️  CRITICAL: FIX DATABASE SECURITY - RUN IMMEDIATELY
-- =====================================================
-- ISSUE: Current RLS policies allow ANY authenticated user to see ALL data
-- FIX: Enforce created_by filtering at DATABASE level, not just frontend
-- =====================================================
-- Date: March 11, 2026
-- Severity: CRITICAL - Data leak vulnerability
-- =====================================================

-- =====================================================
-- STEP 1: DROP INSECURE POLICIES
-- =====================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can read companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON companies;

DROP POLICY IF EXISTS "Authenticated users can access deals" ON deals;
DROP POLICY IF EXISTS "Authenticated users can access products" ON products;
DROP POLICY IF EXISTS "Authenticated users can access invoices" ON invoices;

-- Drop other permissive policies
DROP POLICY IF EXISTS "products_access" ON products;
DROP POLICY IF EXISTS "products_all_authenticated" ON products;
DROP POLICY IF EXISTS "products_company_scope" ON products;

-- =====================================================
-- STEP 2: CREATE SECURE POLICIES WITH created_by FILTER
-- =====================================================

-- COMPANIES: Users can only see companies THEY created
CREATE POLICY "companies_select_secure" ON companies
  FOR SELECT USING (
    auth.uid() = created_by OR
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "companies_insert_secure" ON companies
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "companies_update_secure" ON companies
  FOR UPDATE USING (
    auth.uid() = created_by OR
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "companies_delete_secure" ON companies
  FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- PRODUCTS: Users can only see products THEY created
CREATE POLICY "products_select_secure" ON products
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  );

CREATE POLICY "products_insert_secure" ON products
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  );

CREATE POLICY "products_update_secure" ON products
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  );

CREATE POLICY "products_delete_secure" ON products
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    (created_by = auth.uid() OR 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  );

-- INVOICES: Users can only see invoices THEY created
CREATE POLICY "invoices_select_secure" ON invoices
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "invoices_insert_secure" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "invoices_update_secure" ON invoices
  FOR UPDATE USING (
    auth.uid() = created_by OR
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "invoices_delete_secure" ON invoices
  FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- DEALS: Users can only see deals for companies THEY have access to
DROP POLICY IF EXISTS "Authenticated users can access deals" ON deals;

CREATE POLICY "deals_select_secure" ON deals
  FOR SELECT USING (
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = deals.company_id AND (
        c.created_by = auth.uid() OR c.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "deals_insert_secure" ON deals
  FOR INSERT WITH CHECK (
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "deals_update_secure" ON deals
  FOR UPDATE USING (
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- STEP 3: VERIFY PRODUCTS TABLE HAS created_by COLUMN
-- =====================================================

DO $$ 
BEGIN
  -- Check if products.created_by exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
      AND column_name = 'created_by'
      AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION '❌ ERROR: products table missing created_by column. Run add-created-by-to-products.sql first!';
  ELSE
    RAISE NOTICE '✅ products.created_by column exists';
  END IF;

  -- Check if invoices.created_by exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'invoices' 
      AND column_name = 'created_by'
      AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '⚠️  WARNING: invoices table missing created_by column';
  ELSE
    RAISE NOTICE '✅ invoices.created_by column exists';
  END IF;

  -- Check if companies.created_by exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'companies' 
      AND column_name = 'created_by'
      AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '⚠️  WARNING: companies table missing created_by column';
  ELSE
    RAISE NOTICE '✅ companies.created_by column exists';
  END IF;
END $$;

-- =====================================================
-- STEP 4: VERIFY POLICIES ARE APPLIED
-- =====================================================

SELECT 
  '✅ SECURITY VERIFICATION' as status,
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'd' THEN 'DELETE'
    WHEN cmd = '*' THEN 'ALL'
  END as command,
  qual as policy_definition
FROM pg_policies 
WHERE tablename IN ('products', 'companies', 'invoices', 'deals')
  AND policyname LIKE '%_secure'
ORDER BY tablename, policyname;

-- =====================================================
-- ✅ SCRIPT COMPLETE
-- =====================================================
-- 
-- WHAT CHANGED:
-- 1. Companies: Now filtered by created_by at DATABASE level
-- 2. Products: Now filtered by created_by at DATABASE level
-- 3. Invoices: Now filtered by created_by at DATABASE level
-- 4. Deals: Now filtered through company relationship
-- 
-- RESULT:
-- - New users signing up will ONLY see their own data
-- - Cannot bypass frontend filters via console/API calls
-- - Brian (AIRBNB) CANNOT see Teddy's (BRAD PITT) data
-- - Complete data isolation enforced at PostgreSQL level
-- 
-- TESTING:
-- 1. Login as Brian (AIRBNB)
-- 2. Open browser console
-- 3. Run: supabase.from('products').select('*')
-- 4. Should see ONLY Brian's products, not Teddy's
-- 
-- =====================================================
