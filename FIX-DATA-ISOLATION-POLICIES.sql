-- =====================================================
-- FIX DATA ISOLATION - COMPANY-SCOPED POLICIES
-- Users should only see their own company's data
-- =====================================================

-- Helper: Get user's company_id
-- This will be used in all policies below

-- ===============================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ===============================
DROP POLICY IF EXISTS "products_all_authenticated" ON products;
DROP POLICY IF EXISTS "products_company_scope" ON products;
DROP POLICY IF EXISTS "brands_all_authenticated" ON brands;
DROP POLICY IF EXISTS "brands_company_scope" ON brands;
DROP POLICY IF EXISTS "categories_all_authenticated" ON categories;
DROP POLICY IF EXISTS "categories_company_scope" ON categories;
DROP POLICY IF EXISTS "locations_all_authenticated" ON locations;
DROP POLICY IF EXISTS "locations_company_scope" ON locations;
DROP POLICY IF EXISTS "expenses_all_authenticated" ON expenses;
DROP POLICY IF EXISTS "expenses_company_scope" ON expenses;
DROP POLICY IF EXISTS "expense_categories_all_authenticated" ON expense_categories;
DROP POLICY IF EXISTS "expense_categories_company_scope" ON expense_categories;

-- ===============================
-- STEP 2: PRODUCTS - COMPANY SCOPED
-- ===============================
CREATE POLICY "products_company_scope" ON products
  FOR ALL
  USING (
    -- User can see products from their company OR products they created (if no company)
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  )
  WITH CHECK (
    -- User can only insert/update with their company_id
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  );

-- ===============================
-- STEP 3: BRANDS - COMPANY SCOPED
-- ===============================
CREATE POLICY "brands_company_scope" ON brands
  FOR ALL
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  );

-- ===============================
-- STEP 4: CATEGORIES - COMPANY SCOPED
-- ===============================
CREATE POLICY "categories_company_scope" ON categories
  FOR ALL
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  );

-- ===============================
-- STEP 5: LOCATIONS - COMPANY SCOPED
-- ===============================
CREATE POLICY "locations_company_scope" ON locations
  FOR ALL
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  );

-- ===============================
-- STEP 6: EXPENSES - COMPANY SCOPED
-- ===============================
CREATE POLICY "expenses_company_scope" ON expenses
  FOR ALL
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  );

-- ===============================
-- STEP 7: EXPENSE_CATEGORIES - COMPANY SCOPED
-- ===============================
CREATE POLICY "expense_categories_company_scope" ON expense_categories
  FOR ALL
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (company_id IS NULL AND created_by = auth.uid())
    OR created_by = auth.uid()
  );

-- ===============================
-- VERIFICATION
-- ===============================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ DATA ISOLATION POLICIES APPLIED';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Users can now only see/edit data from:';
  RAISE NOTICE '   • Their own company (company_id match)';
  RAISE NOTICE '   • Data they created (created_by match)';
  RAISE NOTICE '';
  RAISE NOTICE '🚫 Cross-company data visibility: BLOCKED';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;

-- Show final policies
SELECT 
  '🔒 COMPANY-SCOPED POLICIES' as status,
  tablename,
  policyname,
  cmd as operations
FROM pg_policies 
WHERE tablename IN ('products', 'brands', 'categories', 'locations', 'expenses', 'expense_categories')
ORDER BY tablename, policyname;
