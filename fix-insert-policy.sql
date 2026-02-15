-- ================================================================
-- FIX: INSERT POLICIES ON USER_SUBSCRIPTIONS
-- ================================================================

-- Drop both INSERT policies (they both have null qual - no restrictions!)
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;

-- Create proper INSERT policy with restrictions
CREATE POLICY "Users can insert own subscriptions" 
ON user_subscriptions FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Verify
SELECT 
  'FIXED POLICIES' as section,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_subscriptions'
ORDER BY cmd, policyname;
