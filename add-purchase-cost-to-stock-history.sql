-- =====================================================
-- 🔧 ADD PURCHASE COST TO STOCK HISTORY
-- =====================================================
-- Purpose: Track purchase cost per restock for accurate COGS
-- This enables COGS calculation based on actual purchase costs
-- =====================================================

-- Add purchase_cost column to stock_history table
ALTER TABLE stock_history
ADD COLUMN IF NOT EXISTS purchase_cost_per_unit DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS purchase_cost_total DECIMAL(10, 2);

-- Add comment to explain the columns
COMMENT ON COLUMN stock_history.purchase_cost_per_unit IS 'Cost per unit when restocking (for COGS calculation)';
COMMENT ON COLUMN stock_history.purchase_cost_total IS 'Total purchase cost (quantity × cost per unit)';

-- Create index for performance when querying by purchase costs
CREATE INDEX IF NOT EXISTS idx_stock_history_purchase_cost ON stock_history(purchase_cost_per_unit) WHERE purchase_cost_per_unit IS NOT NULL;

-- =====================================================
-- 📊 VERIFICATION
-- =====================================================

-- Check the updated schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stock_history'
  AND column_name IN ('purchase_cost_per_unit', 'purchase_cost_total')
ORDER BY column_name;

-- =====================================================
-- ✅ SUCCESS MESSAGE
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  ✅ PURCHASE COST TRACKING ENABLED                              ║
╚══════════════════════════════════════════════════════════════════╝

🎯 WHAT CHANGED:

✅ Added purchase_cost_per_unit column to stock_history
✅ Added purchase_cost_total column to stock_history
✅ Created performance index for cost queries

📊 HOW IT WORKS:

When restocking products:
1. Enter the Purchase Cost per unit
2. System calculates: Total = Quantity × Cost Per Unit
3. Both values saved to stock_history table
4. Used for accurate COGS calculations

💡 NEXT STEPS:

1. Restock products with purchase costs
2. COGS will calculate based on actual purchase costs
3. View detailed cost tracking in Product Stocking History
4. Analyze profit margins with accurate cost data

🔍 EXAMPLE:

Restock: 100 units @ TSh 50,000 each
- purchase_cost_per_unit: 50000
- purchase_cost_total: 5000000
- When sold, COGS uses the purchase cost per unit

' as success_message;
