-- =====================================================
-- ADD DEALS TABLE POLICY
-- =====================================================

-- Drop existing deals policy if any
DROP POLICY IF EXISTS "deals_access" ON deals;

-- Create simple policy for deals
CREATE POLICY "deals_access" ON deals FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Verification
SELECT 
  '✅ DEALS POLICY ADDED' as status,
  policyname,
  cmd as operations
FROM pg_policies 
WHERE tablename = 'deals';

-- Show sample deals to verify access
SELECT 
  'Sample deals (first 5)' as info,
  id,
  title,
  value,
  stage,
  created_at
FROM deals
ORDER BY created_at DESC
LIMIT 5;
