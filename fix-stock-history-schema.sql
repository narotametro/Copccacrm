-- Fix stock_history table schema to match the code expectations
-- This will add missing columns or rename existing ones

-- First, check if the table has 'action' column instead of 'change_type'
DO $$ 
BEGIN
  -- If 'action' column exists and 'change_type' doesn't, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'action'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'change_type'
  ) THEN
    ALTER TABLE stock_history RENAME COLUMN action TO change_type;
    RAISE NOTICE 'Renamed action column to change_type';
  END IF;

  -- If 'stock_before' exists and 'quantity_before' doesn't, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'stock_before'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'quantity_before'
  ) THEN
    ALTER TABLE stock_history RENAME COLUMN stock_before TO quantity_before;
    RAISE NOTICE 'Renamed stock_before column to quantity_before';
  END IF;

  -- If 'stock_after' exists and 'quantity_after' doesn't, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'stock_after'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'quantity_after'
  ) THEN
    ALTER TABLE stock_history RENAME COLUMN stock_after TO quantity_after;
    RAISE NOTICE 'Renamed stock_after column to quantity_after';
  END IF;

  -- Add change_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'change_type'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN change_type TEXT;
    RAISE NOTICE 'Added change_type column';
  END IF;

  -- Add quantity_before column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'quantity_before'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN quantity_before INTEGER DEFAULT 0;
    RAISE NOTICE 'Added quantity_before column';
  END IF;

  -- Add quantity_after column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'quantity_after'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN quantity_after INTEGER DEFAULT 0;
    RAISE NOTICE 'Added quantity_after column';
  END IF;

  -- Add reference_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'reference_type'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN reference_type TEXT;
    RAISE NOTICE 'Added reference_type column';
  END IF;

  -- Add reference_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN reference_id TEXT;
    RAISE NOTICE 'Added reference_id column';
  END IF;

  -- Add performed_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'performed_by'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN performed_by UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added performed_by column';
  END IF;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'notes'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column';
  END IF;
END $$;

-- Make sure change_type is NOT NULL (set default value first for existing rows)
UPDATE stock_history SET change_type = 'unknown' WHERE change_type IS NULL;
ALTER TABLE stock_history ALTER COLUMN change_type SET NOT NULL;

-- Make sure quantity_change is NOT NULL (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'quantity_change'
  ) THEN
    UPDATE stock_history SET quantity_change = 0 WHERE quantity_change IS NULL;
    ALTER TABLE stock_history ALTER COLUMN quantity_change SET NOT NULL;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_change_type ON stock_history(change_type);
CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_history_reference ON stock_history(reference_type, reference_id);

-- Verify the final structure
SELECT 'Fixed stock_history table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'stock_history'
ORDER BY ordinal_position;

-- Show sample data if any exists
SELECT 'Sample stock_history records:' as info;
SELECT 
  id,
  product_id,
  change_type,
  quantity_change,
  quantity_before,
  quantity_after,
  reference_type,
  reference_id,
  created_at
FROM stock_history
ORDER BY created_at DESC
LIMIT 5;
