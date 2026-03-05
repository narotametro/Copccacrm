-- =====================================================
-- SET is_company_owner FLAG FOR USERS WITH SUBSCRIPTIONS
-- Ensures existing users with subscriptions are properly flagged
-- =====================================================

-- Update users who have subscriptions to mark them as company owners
UPDATE users
SET is_company_owner = true
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM user_subscriptions
  WHERE status IN ('trial', 'active')
)
AND is_company_owner IS NOT TRUE;

-- Show results
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Updated % users to company_owner status', v_updated_count;
  RAISE NOTICE '   These users now have proper access flags';
END $$;
