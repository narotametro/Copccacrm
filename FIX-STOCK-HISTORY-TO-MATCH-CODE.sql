-- =====================================================
-- 🔧 FIX STOCK HISTORY TABLE TO MATCH CODE
-- =====================================================
-- This aligns your database with what SalesHub.tsx expects
-- =====================================================

-- STEP 1: Rename columns to match code expectations
DO $$ 
BEGIN
  -- Rename change_type to action (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'change_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'action'
  ) THEN
    ALTER TABLE stock_history RENAME COLUMN change_type TO action;
    RAISE NOTICE '✅ Renamed change_type → action';
  ELSE
    RAISE NOTICE '✓ action column already correct';
  END IF;

  -- Rename quantity_before to stock_before (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'quantity_before'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'stock_before'
  ) THEN
    ALTER TABLE stock_history RENAME COLUMN quantity_before TO stock_before;
    RAISE NOTICE '✅ Renamed quantity_before → stock_before';
  ELSE
    RAISE NOTICE '✓ stock_before column already correct';
  END IF;

  -- Rename quantity_after to stock_after (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'quantity_after'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'stock_after'
  ) THEN
    ALTER TABLE stock_history RENAME COLUMN quantity_after TO stock_after;
    RAISE NOTICE '✅ Renamed quantity_after → stock_after';
  ELSE
    RAISE NOTICE '✓ stock_after column already correct';
  END IF;

  -- Rename performed_by to created_by (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'performed_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE stock_history RENAME COLUMN performed_by TO created_by;
    RAISE NOTICE '✅ Renamed performed_by → created_by';
  ELSE
    RAISE NOTICE '✓ created_by column already correct';
  END IF;

  -- Rename quantity_change to quantity (if needed)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'quantity_change'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE stock_history RENAME COLUMN quantity_change TO quantity;
    RAISE NOTICE '✅ Renamed quantity_change → quantity';
  ELSE
    RAISE NOTICE '✓ quantity column already correct';
  END IF;
END $$;

-- STEP 2: Add missing columns that code expects
DO $$ 
BEGIN
  -- Add action if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'action'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN action TEXT;
    RAISE NOTICE '✅ Added action column';
  END IF;

  -- Add stock_before if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'stock_before'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN stock_before INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added stock_before column';
  END IF;

  -- Add stock_after if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'stock_after'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN stock_after INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added stock_after column';
  END IF;

  -- Add quantity if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN quantity INTEGER;
    RAISE NOTICE '✅ Added quantity column';
  END IF;

  -- Add location_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN location_id UUID;
    RAISE NOTICE '✅ Added location_id column';
  END IF;

  -- Add created_by if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN created_by UUID REFERENCES auth.users(id);
    RAISE NOTICE '✅ Added created_by column';
  END IF;

  -- Add notes if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'notes'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN notes TEXT;
    RAISE NOTICE '✅ Added notes column';
  END IF;

  -- Add product_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_history' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN product_id UUID REFERENCES products(id);
    RAISE NOTICE '✅ Added product_id column';
  END IF;
END $$;

-- STEP 3: Add purchase cost columns
ALTER TABLE stock_history
ADD COLUMN IF NOT EXISTS purchase_cost_per_unit DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS purchase_cost_total DECIMAL(10, 2);

-- STEP 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_action ON stock_history(action);
CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_history_purchase_cost ON stock_history(purchase_cost_per_unit) WHERE purchase_cost_per_unit IS NOT NULL;

-- STEP 5: Verify final schema
SELECT 
  '✅ UPDATED SCHEMA:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stock_history'
ORDER BY ordinal_position;

-- =====================================================
-- ✅ SUCCESS MESSAGE
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  ✅ STOCK HISTORY SCHEMA FIXED                                  ║
╚══════════════════════════════════════════════════════════════════╝

📋 COLUMNS NOW MATCH CODE EXPECTATIONS:

✅ action - Type of stock change (restock, sale, etc.)
✅ stock_before - Quantity before change
✅ stock_after - Quantity after change
✅ quantity - Amount changed
✅ location_id - Storage location (UUID)
✅ created_by - User who made the change (UUID)
✅ notes - Additional information
✅ product_id - Reference to products table
✅ purchase_cost_per_unit - Cost per unit for COGS
✅ purchase_cost_total - Total purchase cost

🔍 NEXT STEPS:

1. ✅ Schema aligned with code
2. ⏭️  Run fix-stock-history-rls-policies.sql (RLS policies)
3. ⏭️  Run ENABLE-STOCK-HISTORY-TRACKING.sql verification query
4. ⏭️  Uncomment code in SalesHub.tsx
5. ⏭️  Test restock with purchase cost

' as success_message;
