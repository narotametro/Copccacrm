-- =====================================================
-- ADD NOTES COLUMN TO DEALS TABLE
-- Fixes: Could not find the 'notes' column of 'deals'
-- =====================================================

-- Add notes column to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deals' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
