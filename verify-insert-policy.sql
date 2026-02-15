-- ================================================================
-- VERIFY INSERT POLICY (check with_check column)
-- ================================================================

SELECT 
  'INSERT POLICY CHECK' as section,
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'user_subscriptions'
  AND cmd = 'INSERT';

-- If with_check is null, recreate the policy properly
DO $$
BEGIN
  -- Drop and recreate INSERT policy
  DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
  
  EXECUTE format('
    CREATE POLICY "Users can insert own subscriptions" 
    ON user_subscriptions FOR INSERT 
    WITH CHECK (user_id = auth.uid())
  ');
  
  RAISE NOTICE '✓ INSERT policy recreated';
END $$;

-- Verify again
SELECT 
  'VERIFICATION' as section,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'user_subscriptions'
  AND cmd = 'INSERT';
