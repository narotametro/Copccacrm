-- =====================================================
-- 🚨 QUICK COGS FIX - Find Problem Products
-- =====================================================
-- This finds products where cost_price is wrong and provides fixes
-- =====================================================

-- Step 1: Find products sold on March 15 with their cost data
SELECT 
  '🔍 PRODUCTS SOLD ON MARCH 15' as analysis,
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
  ROUND((p.cost_price / NULLIF(p.price, 0)) * 100, 2) as cost_percentage
FROM products p
WHERE p.id IN (
  SELECT DISTINCT (jsonb_array_elements(items::jsonb)->>'product_id')::uuid
  FROM sales_hub_orders
  WHERE DATE(created_at) = '2026-03-15'
)
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
-- This assumes cost should be 40-60% of selling price (typical retail margin)
SELECT 
  '💡 SUGGESTED COST_PRICE FIX' as suggestion,
  p.name as product_name,
  p.cost_price as current_WRONG_cost,
  p.price as selling_price,
  ROUND(p.price * 0.5, 2) as suggested_cost_50_percent,
  ROUND(p.price * 0.6, 2) as suggested_cost_60_percent,
  '-- Copy the UPDATE below and adjust the cost to your ACTUAL purchase cost --' as note
FROM products p
WHERE p.id IN (
  SELECT DISTINCT (jsonb_array_elements(items::jsonb)->>'product_id')::uuid
  FROM sales_hub_orders
  WHERE DATE(created_at) = '2026-03-15'
)
AND (p.cost_price > p.price OR p.cost_price IS NULL OR p.cost_price = 0)
ORDER BY p.name;


-- =====================================================
-- Step 3: Generate UPDATE statements
-- =====================================================
-- ⚠️ DO NOT RUN THIS DIRECTLY! 
-- Copy each UPDATE and change the cost_price to your ACTUAL purchase cost
-- =====================================================

SELECT 
  '-- ' || p.name || ': Selling at ' || p.price || ', currently costing ' || 
  COALESCE(p.cost_price::text, 'NULL') || ' (' || 
  COALESCE(ROUND((p.cost_price / NULLIF(p.price, 0)) * 100, 0)::text, '0') || '%' || E')\n' ||
  'UPDATE products SET cost_price = ' || ROUND(p.price * 0.5, 2) || ' WHERE name = ' || quote_literal(p.name) || ';' || E'\n'
  as suggested_update_statement
FROM products p
WHERE p.id IN (
  SELECT DISTINCT (jsonb_array_elements(items::jsonb)->>'product_id')::uuid
  FROM sales_hub_orders
  WHERE DATE(created_at) = '2026-03-15'
)
AND (p.cost_price > p.price OR p.cost_price IS NULL OR p.cost_price = 0)
ORDER BY p.name;


SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  🚨 QUICK COGS FIX COMPLETE                                     ║
╚══════════════════════════════════════════════════════════════════╝

📊 WHAT YOU JUST SAW:

Step 1: Products sold on March 15 with their cost data
  → Look for "🚨 COST > PRICE (SELLING AT LOSS!)"
  → These products have cost_price set HIGHER than selling price

Step 2: Suggested cost_price values
  → Based on 50% and 60% margin assumptions
  → These are SUGGESTIONS only - use your ACTUAL purchase costs!

Step 3: UPDATE statements ready to copy
  → Copy each UPDATE statement
  → CHANGE the cost_price to your ACTUAL purchase cost
  → Run the UPDATE statements

🔧 HOW TO FIX:

1. Look at Step 1 results - identify problem products
2. For each product, determine what you ACTUALLY paid (purchase cost)
3. Copy the UPDATE from Step 3
4. Change the cost_price value to your actual cost
5. Run the UPDATE

EXAMPLE:
  If you sell SOUNDBAR for TSh100,000
  And you bought it for TSh50,000
  Then:
    UPDATE products SET cost_price = 50000 WHERE name = ''SOUNDBAR'';

⚠️ IMPORTANT:
  - cost_price = What you PAID for the product
  - price = What you SELL the product for
  - cost_price should ALWAYS be LESS than price!
  - Typical retail: cost_price is 40-60% of selling price

💡 After fixing, enable the COGS tracking toggle in the app to prevent this!

' as instructions;
