-- =====================================================
-- UPDATE ALL DEALS TO SET created_by
-- =====================================================
-- Backfill all existing deals with teddy's user ID
-- =====================================================

-- Get teddy's user ID and update all deals
UPDATE deals 
SET created_by = (
  SELECT id FROM users WHERE email = 'teddy@gmail.com' LIMIT 1
)
WHERE created_by IS NULL;

-- Verify the update
SELECT 
  '✅ DEALS UPDATED' as status,
  COUNT(*) as total_deals,
  COUNT(created_by) as deals_with_created_by,
  COUNT(*) - COUNT(created_by) as still_missing
FROM deals;

-- Show updated deals
SELECT 
  id,
  title,
  stage,
  value,
  created_by,
  (SELECT email FROM users WHERE id = deals.created_by) as created_by_email,
  created_at
FROM deals
ORDER BY created_at DESC;
