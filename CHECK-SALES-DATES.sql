-- =====================================================
-- 🔍 CHECK SALES DATA - Find Available Dates
-- =====================================================
-- This helps you find which dates have sales data
-- =====================================================

-- Step 1: Check if sales_hub_orders table has any data
SELECT 
  '📊 TOTAL ORDERS IN DATABASE' as info,
  COUNT(*) as total_orders
FROM sales_hub_orders;

-- Step 2: Find the date range of all orders
SELECT 
  '📅 DATE RANGE OF ORDERS' as info,
  MIN(DATE(created_at)) as earliest_order,
  MAX(DATE(created_at)) as latest_order,
  COUNT(DISTINCT DATE(created_at)) as days_with_orders
FROM sales_hub_orders;

-- Step 3: Show orders grouped by date (last 30 days)
SELECT 
  '📈 ORDERS BY DATE (LAST 30 DAYS)' as info,
  DATE(created_at) as order_date,
  COUNT(*) as num_orders,
  SUM(total_amount) as total_sales,
  COUNT(DISTINCT customer_id) as unique_customers
FROM sales_hub_orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Step 4: Check today's date (for reference)
SELECT 
  '🗓️ TODAY IS' as info,
  CURRENT_DATE as today,
  CURRENT_TIMESTAMP as now;

-- Step 5: If you have orders, show the most recent ones
SELECT 
  '🔍 MOST RECENT 10 ORDERS' as info,
  DATE(created_at) as order_date,
  order_number,
  total_amount,
  jsonb_array_length(items) as num_items
FROM sales_hub_orders
ORDER BY created_at DESC
LIMIT 10;

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  📊 SALES DATA CHECK COMPLETE                                   ║
╚══════════════════════════════════════════════════════════════════╝

🔍 WHAT TO DO NEXT:

1. Look at the results above to see:
   ✓ How many total orders you have
   ✓ What date range has orders
   ✓ Which specific dates have sales

2. Once you find dates with sales, update FIX-COGS-QUICK.sql:
   - Change the date ''2026-03-15'' to a date that has orders
   - Example: WHERE DATE(created_at) = ''2026-03-18''
   
3. If you see NO ORDERS (count = 0):
   - The database is empty or orders are in a different table
   - You need to make some test sales first
   - Or check if you''re connected to the correct database

💡 TIP: Run this query anytime you need to check what dates have sales data!

' as instructions;
