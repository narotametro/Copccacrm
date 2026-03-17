-- =====================================================
-- 🚨 FLEXIBLE COGS FIX - Find Problem Products (ANY DATE)
-- =====================================================
-- This version checks ALL dates or specific date ranges
-- =====================================================

-- ⚙️ CONFIGURATION: Change these dates to match your needs
-- Option 1: Check all time (comment out the WHERE DATE filter below)
-- Option 2: Check specific date (uncomment and set date)
-- Option 3: Check date range (uncomment and set range)

-- Step 1: Find ALL products sold (ever) with their cost data
SELECT 
  '🔍 ALL PRODUCTS SOLD WITH COST ISSUES' as analysis,
  p.id,
  p.name as product_name,
  p.cost_price as current_cost_price,
  p.price as selling_price,
  CASE 
    WHEN p.cost_price > p.price THEN '🚨 COST > PRICE (SELLING AT LOSS!)'
    WHEN p.cost_price = p.price THEN '⚠️ COST = PRICE (0% MARGIN!)'
    WHEN p.cost_price IS NULL THEN '❌ NO COST_PRICE'
    WHEN p.cost_price = 0 THEN '⚠️ ZERO COST_PRICE'
    ELSE '✅ Looks OK'
  END as status,
  ROUND((p.cost_price / NULLIF(p.price, 0)) * 100, 2) as cost_percentage,
  COUNT(DISTINCT o.id) as times_sold
FROM products p
INNER JOIN (
  SELECT DISTINCT 
    (jsonb_array_elements(items)->>'product_id')::uuid as product_id,
    id
  FROM sales_hub_orders
  -- 🔧 UNCOMMENT ONE OF THESE TO FILTER BY DATE:
  -- WHERE DATE(created_at) = '2026-03-18'  -- Specific date
  -- WHERE DATE(created_at) >= '2026-03-01' AND DATE(created_at) <= '2026-03-31'  -- Date range
  -- WHERE created_at >= NOW() - INTERVAL '7 days'  -- Last 7 days
  -- WHERE created_at >= NOW() - INTERVAL '30 days'  -- Last 30 days
) o ON p.id = o.product_id
GROUP BY p.id, p.name, p.cost_price, p.price
ORDER BY 
  CASE 
    WHEN p.cost_price > p.price THEN 1
    WHEN p.cost_price = p.price THEN 2
    WHEN p.cost_price IS NULL THEN 3
    WHEN p.cost_price = 0 THEN 4
    ELSE 5
  END,
  p.cost_price DESC;


-- =====================================================
-- Step 2: Calculate what SHOULD be the cost
-- =====================================================
SELECT 
  '💡 SUGGESTED COST_PRICE FIX' as suggestion,
  p.name as product_name,
  p.cost_price as current_WRONG_cost,
  p.price as selling_price,
  ROUND(p.price * 0.4, 2) as suggested_cost_40_percent,
  ROUND(p.price * 0.5, 2) as suggested_cost_50_percent,
  ROUND(p.price * 0.6, 2) as suggested_cost_60_percent,
  '-- Copy the UPDATE below and adjust the cost to your ACTUAL purchase cost --' as note
FROM products p
WHERE p.id IN (
  SELECT DISTINCT (jsonb_array_elements(items)->>'product_id')::uuid
  FROM sales_hub_orders
  -- 🔧 Match the same date filter as above if needed
)
AND (p.cost_price > p.price OR p.cost_price IS NULL OR p.cost_price = 0)
ORDER BY p.name;


-- =====================================================
-- Step 3: Generate UPDATE statements
-- =====================================================
SELECT 
  '-- ' || p.name || ': Selling at TSh ' || p.price || ', currently costing ' || 
  COALESCE('TSh ' || p.cost_price::text, 'NULL') || ' (' || 
  COALESCE(ROUND((p.cost_price / NULLIF(p.price, 0)) * 100, 0)::text, '0') || '%)' || E'\n' ||
  'UPDATE products SET cost_price = ' || ROUND(p.price * 0.5, 2) || ' WHERE id = ''' || p.id || ''';  -- ' || p.name || E'\n'
  as suggested_update_statement
FROM products p
WHERE p.id IN (
  SELECT DISTINCT (jsonb_array_elements(items)->>'product_id')::uuid
  FROM sales_hub_orders
  -- 🔧 Match the same date filter as above if needed
)
AND (p.cost_price > p.price OR p.cost_price IS NULL OR p.cost_price = 0)
ORDER BY p.name;


SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  🚨 FLEXIBLE COGS FIX COMPLETE                                  ║
╚══════════════════════════════════════════════════════════════════╝

📊 WHAT YOU JUST SAW:

Step 1: Products with cost issues
  → Shows all products ever sold with cost problems
  → 🚨 COST > PRICE means selling at a loss
  → ❌ NO COST_PRICE means not tracking costs at all

Step 2: Suggested cost_price values
  → 40%, 50%, and 60% margin suggestions
  → These are ESTIMATES - use your ACTUAL purchase costs!

Step 3: UPDATE statements ready to copy
  → Copy each UPDATE statement
  → CHANGE the cost_price to your ACTUAL cost
  → Run the UPDATE statements one by one

🔧 HOW TO FIX:

1. Look at Step 1 - find products with issues
2. For each product, find your ACTUAL purchase invoice
3. Copy the UPDATE from Step 3
4. Change the cost_price to match your invoice
5. Run the UPDATE

EXAMPLE:
  Product: SOUNDBAR
  Selling price: TSh 100,000
  Your purchase cost: TSh 50,000
  
  UPDATE products SET cost_price = 50000 WHERE id = ''abc-123-def'';

⚠️ IMPORTANT:
  - cost_price = What YOU PAID to buy the product
  - price = What YOU SELL the product for
  - Margin = (price - cost_price) / price * 100%
  - Healthy margin: 40-60% for retail

📅 DATE FILTERING:
  - By default, this checks ALL products ever sold
  - To filter by date, uncomment one of the WHERE clauses
  - Examples provided for: specific date, date range, last 7/30 days

💡 After fixing, enable COGS tracking in Sales Hub settings!

' as instructions;
