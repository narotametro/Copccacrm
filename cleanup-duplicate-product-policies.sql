-- =====================================================
-- CLEANUP DUPLICATE PRODUCT POLICIES
-- Remove old policies and keep only location-aware ones
-- =====================================================

-- Remove duplicate/old INSERT policies (keep "Users can create products" with location check)
DROP POLICY IF EXISTS "Users can insert own company products" ON products;

-- Remove duplicate UPDATE policies (keep "Users can update products")
DROP POLICY IF EXISTS "Users can update own company products" ON products;

-- Remove duplicate SELECT policies (keep "Users can view company products")
DROP POLICY IF EXISTS "Users can view own company products" ON products;

-- Keep these policies:
-- ✅ "Users can view company products" - SELECT
-- ✅ "Users can create products" - INSERT (with location validation)
-- ✅ "Users can update products" - UPDATE
-- ✅ "Admins can delete own company products" - DELETE
-- ✅ "Users can manage own products" - ALL

-- Verify final policies
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'products'
ORDER BY cmd, policyname;
