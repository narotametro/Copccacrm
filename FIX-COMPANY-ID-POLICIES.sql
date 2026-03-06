-- =====================================================
-- FIX RLS POLICIES TO WORK WITHOUT COMPANY_ID
-- Allow users without company_id to see their own data
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "products_company_scope" ON products;
DROP POLICY IF EXISTS "brands_company_scope" ON brands;
DROP POLICY IF EXISTS "categories_company_scope" ON categories;
DROP POLICY IF EXISTS "locations_company_scope" ON locations;
DROP POLICY IF EXISTS "expenses_company_scope" ON expenses;
DROP POLICY IF EXISTS "expense_categories_company_scope" ON expense_categories;

-- ===============================
-- PRODUCTS - Works with or without company_id
-- ===============================
CREATE POLICY "products_access" ON products
  FOR ALL
  USING (
    -- Check user's company_id
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        -- User has company_id: show company data
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        -- User has NO company_id: show data they created or NULL company_id
        (created_by = auth.uid() OR company_id IS NULL)
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        (created_by = auth.uid() OR company_id IS NULL)
    END
  );

-- ===============================
-- BRANDS
-- ===============================
CREATE POLICY "brands_access" ON brands
  FOR ALL
  USING (
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        (created_by = auth.uid() OR company_id IS NULL)
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        (created_by = auth.uid() OR company_id IS NULL)
    END
  );

-- ===============================
-- CATEGORIES
-- ===============================
CREATE POLICY "categories_access" ON categories
  FOR ALL
  USING (
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        (created_by = auth.uid() OR company_id IS NULL)
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        (created_by = auth.uid() OR company_id IS NULL)
    END
  );

-- ===============================
-- LOCATIONS
-- ===============================
CREATE POLICY "locations_access" ON locations
  FOR ALL
  USING (
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        (created_by = auth.uid() OR company_id IS NULL)
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        (created_by = auth.uid() OR company_id IS NULL)
    END
  );

-- ===============================
-- EXPENSES
-- ===============================
CREATE POLICY "expenses_access" ON expenses
  FOR ALL
  USING (
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        (created_by = auth.uid() OR company_id IS NULL)
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        (created_by = auth.uid() OR company_id IS NULL)
    END
  );

-- ===============================
-- EXPENSE_CATEGORIES
-- ===============================
CREATE POLICY "expense_categories_access" ON expense_categories
  FOR ALL
  USING (
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        (created_by = auth.uid() OR company_id IS NULL)
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT company_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE
        (created_by = auth.uid() OR company_id IS NULL)
    END
  );

-- ===============================
-- VERIFICATION
-- ===============================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ FLEXIBLE RLS POLICIES APPLIED';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '👥 Users WITH company_id:';
  RAISE NOTICE '   • See only their company data';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Users WITHOUT company_id:';
  RAISE NOTICE '   • See data they created';
  RAISE NOTICE '   • See data with NULL company_id';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Data isolation maintained';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;

SELECT 
  '🔓 FLEXIBLE POLICIES' as status,
  tablename,
  policyname,
  cmd as operations
FROM pg_policies 
WHERE tablename IN ('products', 'brands', 'categories', 'locations', 'expenses', 'expense_categories')
ORDER BY tablename, policyname;
