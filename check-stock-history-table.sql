-- Check if stock_history table exists and view its structure
SELECT 'Checking stock_history table structure:' as info;

-- List all columns in stock_history table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stock_history'
ORDER BY ordinal_position;

-- Check if there are any records in stock_history
SELECT 'Total records in stock_history:' as info;
SELECT COUNT(*) as total_records FROM stock_history;

-- View recent stock history records (if any)
SELECT 'Recent stock history records:' as info;
SELECT 
  id,
  product_id,
  change_type,
  quantity_change,
  quantity_before,
  quantity_after,
  reference_type,
  reference_id,
  created_at,
  performed_by,
  notes
FROM stock_history
ORDER BY created_at DESC
LIMIT 10;

-- Check products to see their current stock levels
SELECT 'Current product stock levels:' as info;
SELECT 
  id,
  name,
  sku,
  stock_quantity,
  min_stock_level,
  updated_at
FROM products
ORDER BY updated_at DESC
LIMIT 10;
