-- =====================================================
-- ADD MISSING created_by COLUMN TO DEALS TABLE
-- =====================================================
-- This fixes the issue where deals are created successfully
-- but don't appear in the pipeline because the UI filters
-- by created_by column which doesn't exist in the table.
-- =====================================================

-- STEP 1: Add created_by column to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- STEP 2: Backfill existing deals with teddy's user ID
UPDATE deals 
SET created_by = (SELECT id FROM users WHERE email = 'teddy@gmail.com' LIMIT 1)
WHERE created_by IS NULL;

-- STEP 3: Create function to automatically set created_by on insert
CREATE OR REPLACE FUNCTION set_deals_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Create trigger to auto-set created_by
DROP TRIGGER IF EXISTS trigger_set_deals_created_by ON deals;
CREATE TRIGGER trigger_set_deals_created_by
  BEFORE INSERT ON deals
  FOR EACH ROW
  EXECUTE FUNCTION set_deals_created_by();

-- STEP 5: Verify the fix
SELECT 
  '✅ DEALS TABLE FIXED' as status,
  COUNT(*) as total_deals,
  COUNT(created_by) as deals_with_created_by,
  COUNT(*) - COUNT(created_by) as deals_missing_created_by
FROM deals;

-- STEP 6: Show sample deals with created_by
SELECT 
  d.id,
  d.title,
  d.stage,
  d.value,
  d.created_by,
  u.email as created_by_email,
  d.created_at
FROM deals d
LEFT JOIN users u ON u.id = d.created_by
ORDER BY d.created_at DESC
LIMIT 5;

-- STEP 7: Verify trigger is active
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'deals'
AND trigger_name = 'trigger_set_deals_created_by';
