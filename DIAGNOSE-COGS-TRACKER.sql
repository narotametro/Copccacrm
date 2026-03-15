-- =====================================================
-- 🔍 DIAGNOSE COGS CALCULATION - ALL DATES
-- =====================================================
-- Track COGS issues across any date range
-- =====================================================
-- 📝 CHANGE THESE DATES TO ANALYZE DIFFERENT PERIODS:
-- =====================================================

-- Set your date range here (change these values):
WITH date_params AS (
  SELECT 
    '2026-03-01'::date as start_date,
    '2026-03-31'::date as end_date
)

-- =====================================================
-- Step 1: Daily COGS Summary (Overview)
-- =====================================================
,
order_items_expanded AS (
  SELECT 
    o.id as order_id,
    o.created_at,
    o.total_amount,
    (item->>'product_id')::uuid as product_id,
    (item->>'quantity')::int as quantity
  FROM sales_hub_orders o
  CROSS JOIN date_params dp
  CROSS JOIN LATERAL jsonb_array_elements(o.items::jsonb) as item
  WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date
),
weighted_costs AS (
  SELECT 
    product_id,
    SUM(purchase_cost_per_unit * quantity) / NULLIF(SUM(quantity), 0) as avg_cost
  FROM stock_history
  WHERE action = 'restock'
  AND purchase_cost_per_unit IS NOT NULL
  GROUP BY product_id
)
SELECT 
  '📊 DAILY COGS SUMMARY' as section,
  DATE(oi.created_at) as sale_date,
  COUNT(DISTINCT oi.order_id) as orders_count,
  SUM(oi.total_amount) as daily_revenue,
  SUM(oi.quantity * COALESCE(wc.avg_cost, p.cost_price, 0)) as daily_cogs,
  ROUND(
    (SUM(oi.quantity * COALESCE(wc.avg_cost, p.cost_price, 0)) / 
     NULLIF(SUM(oi.total_amount), 0)) * 100, 2
  ) as cogs_percentage,
  CASE 
    WHEN SUM(oi.quantity * COALESCE(wc.avg_cost, p.cost_price, 0)) > SUM(oi.total_amount) THEN '🚨 LOSS'
    WHEN (SUM(oi.quantity * COALESCE(wc.avg_cost, p.cost_price, 0)) / 
          NULLIF(SUM(oi.total_amount), 0)) > 0.7 THEN '⚠️ High COGS'
    ELSE '✅ Healthy'
  END as status
FROM order_items_expanded oi
LEFT JOIN weighted_costs wc ON wc.product_id = oi.product_id
LEFT JOIN products p ON p.id = oi.product_id
GROUP BY DATE(oi.created_at)
ORDER BY DATE(oi.created_at) DESC;

-- =====================================================
-- Step 2: Sales by Date Range
-- =====================================================
SELECT 
  '📦 ORDERS IN DATE RANGE' as section,
  order_number,
  DATE(created_at) as sale_date,
  total_amount,
  items::jsonb as order_items,
  created_at
FROM sales_hub_orders o, date_params dp
WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date
ORDER BY created_at DESC;

-- =====================================================
-- Step 3: Products Sold in Date Range
-- =====================================================
,
products_sold AS (
  SELECT DISTINCT (item->>'product_id')::uuid as product_id
  FROM sales_hub_orders o
  CROSS JOIN date_params dp
  CROSS JOIN LATERAL jsonb_array_elements(o.items::jsonb) as item
  WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date
),
product_quantities AS (
  SELECT 
    (item->>'product_id')::uuid as product_id,
    COUNT(DISTINCT o.id) as times_sold,
    SUM((item->>'quantity')::int) as total_quantity_sold
  FROM sales_hub_orders o
  CROSS JOIN date_params dp
  CROSS JOIN LATERAL jsonb_array_elements(o.items::jsonb) as item
  WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date
  GROUP BY (item->>'product_id')::uuid
)
SELECT 
  '🏷️ PRODUCTS SOLD IN PERIOD' as section,
  p.id,
  p.name,
  p.cost_price as product_cost_price,
  p.price as selling_price,
  p.stock_quantity as current_stock,
  pq.times_sold,
  pq.total_quantity_sold
FROM products p
JOIN products_sold ps ON ps.product_id = p.id
JOIN product_quantities pq ON pq.product_id = p.id
ORDER BY pq.total_quantity_sold DESC;

-- =====================================================
-- Step 4: Purchase Cost History for Sold Products
-- =====================================================
,
sold_product_ids AS (
  SELECT DISTINCT (item->>'product_id')::uuid as product_id
  FROM sales_hub_orders o
  CROSS JOIN date_params dp
  CROSS JOIN LATERAL jsonb_array_elements(o.items::jsonb) as item
  WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date
)
SELECT 
  '💰 PURCHASE COST HISTORY' as section,
  sh.product_id,
  p.name as product_name,
  sh.action,
  sh.quantity,
  sh.purchase_cost_per_unit,
  sh.purchase_cost_total,
  DATE(sh.created_at) as restock_date
FROM stock_history sh
JOIN products p ON p.id = sh.product_id
JOIN sold_product_ids sp ON sp.product_id = sh.product_id
WHERE sh.action = 'restock'
AND sh.purchase_cost_per_unit IS NOT NULL
ORDER BY sh.product_id, sh.created_at DESC;

-- =====================================================
-- Step 5: Expected COGS by Product (Weighted Average)
-- =====================================================
,
period_sales AS (
  SELECT 
    (item->>'product_id')::uuid as product_id,
    (item->>'name')::text as product_name,
    (item->>'quantity')::int as quantity_sold,
    (item->>'price')::numeric as unit_price
  FROM sales_hub_orders o
  CROSS JOIN date_params dp
  CROSS JOIN LATERAL jsonb_array_elements(o.items::jsonb) as item
  WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date
),
purchase_costs AS (
  SELECT 
    product_id,
    SUM(purchase_cost_per_unit * quantity) / NULLIF(SUM(quantity), 0) as weighted_avg_cost
  FROM stock_history
  WHERE action = 'restock'
  AND purchase_cost_per_unit IS NOT NULL
  GROUP BY product_id
)
SELECT 
  '🧮 COGS BY PRODUCT' as section,
  s.product_name,
  SUM(s.quantity_sold) as total_sold,
  AVG(s.unit_price) as avg_selling_price,
  COALESCE(pc.weighted_avg_cost, p.cost_price, 0) as cost_per_unit,
  SUM(s.quantity_sold * s.unit_price) as total_revenue,
  SUM(s.quantity_sold) * COALESCE(pc.weighted_avg_cost, p.cost_price, 0) as total_cogs,
  SUM(s.quantity_sold * s.unit_price) - (SUM(s.quantity_sold) * COALESCE(pc.weighted_avg_cost, p.cost_price, 0)) as gross_profit,
  ROUND(
    ((SUM(s.quantity_sold) * COALESCE(pc.weighted_avg_cost, p.cost_price, 0)) / 
     NULLIF(SUM(s.quantity_sold * s.unit_price), 0)) * 100, 2
  ) as cogs_percentage,
  CASE 
    WHEN COALESCE(pc.weighted_avg_cost, p.cost_price, 0) > AVG(s.unit_price) THEN '🚨 Selling at Loss'
    WHEN ((SUM(s.quantity_sold) * COALESCE(pc.weighted_avg_cost, p.cost_price, 0)) / 
          NULLIF(SUM(s.quantity_sold * s.unit_price), 0)) > 0.7 THEN '⚠️ Low Margin'
    ELSE '✅ Healthy'
  END as profitability
FROM period_sales s
LEFT JOIN purchase_costs pc ON pc.product_id = s.product_id
LEFT JOIN products p ON p.id = s.product_id
GROUP BY s.product_name, pc.weighted_avg_cost, p.cost_price
ORDER BY total_cogs DESC;

-- =====================================================
-- Step 6: Period COGS Summary
-- =====================================================
,
period_sales_summary AS (
  SELECT 
    (item->>'product_id')::uuid as product_id,
    (item->>'quantity')::int as quantity_sold
  FROM sales_hub_orders o
  CROSS JOIN date_params dp
  CROSS JOIN LATERAL jsonb_array_elements(o.items::jsonb) as item
  WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date
),
purchase_costs_summary AS (
  SELECT 
    product_id,
    SUM(purchase_cost_per_unit * quantity) / NULLIF(SUM(quantity), 0) as weighted_avg_cost
  FROM stock_history
  WHERE action = 'restock'
  AND purchase_cost_per_unit IS NOT NULL
  GROUP BY product_id
)
SELECT 
  '💵 PERIOD SUMMARY' as section,
  (SELECT start_date FROM date_params) as period_start,
  (SELECT end_date FROM date_params) as period_end,
  (SELECT SUM(total_amount) FROM sales_hub_orders o CROSS JOIN date_params dp 
   WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date) as total_revenue,
  SUM(s.quantity_sold * COALESCE(pc.weighted_avg_cost, p.cost_price, 0)) as total_cogs,
  (SELECT SUM(total_amount) FROM sales_hub_orders o CROSS JOIN date_params dp 
   WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date) - 
   SUM(s.quantity_sold * COALESCE(pc.weighted_avg_cost, p.cost_price, 0)) as gross_profit,
  ROUND(
    (SUM(s.quantity_sold * COALESCE(pc.weighted_avg_cost, p.cost_price, 0)) / 
     NULLIF((SELECT SUM(total_amount) FROM sales_hub_orders o CROSS JOIN date_params dp 
             WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date), 0)) * 100, 2
  ) as cogs_percentage,
  CASE 
    WHEN SUM(s.quantity_sold * COALESCE(pc.weighted_avg_cost, p.cost_price, 0)) > 
         (SELECT SUM(total_amount) FROM sales_hub_orders o CROSS JOIN date_params dp 
          WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date) 
    THEN '🚨 OPERATING AT LOSS'
    WHEN (SUM(s.quantity_sold * COALESCE(pc.weighted_avg_cost, p.cost_price, 0)) / 
          NULLIF((SELECT SUM(total_amount) FROM sales_hub_orders o CROSS JOIN date_params dp 
                  WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date), 0)) > 0.7 
    THEN '⚠️ HIGH COGS - Check pricing'
    ELSE '✅ Healthy profitability'
  END as status
FROM period_sales_summary s
LEFT JOIN purchase_costs_summary pc ON pc.product_id = s.product_id
LEFT JOIN products p ON p.id = s.product_id;

-- =====================================================
-- Step 7: Products Missing Cost Data
-- =====================================================
,
sold_products_list AS (
  SELECT DISTINCT (item->>'product_id')::uuid as product_id
  FROM sales_hub_orders o
  CROSS JOIN date_params dp
  CROSS JOIN LATERAL jsonb_array_elements(o.items::jsonb) as item
  WHERE DATE(o.created_at) BETWEEN dp.start_date AND dp.end_date
)
SELECT 
  '⚠️ PRODUCTS WITHOUT PURCHASE COST DATA' as section,
  p.id,
  p.name,
  p.cost_price,
  CASE 
    WHEN p.cost_price IS NULL THEN '❌ No cost_price'
    WHEN p.cost_price = 0 THEN '⚠️ Zero cost_price'
    ELSE '✅ Has cost_price'
  END as cost_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM stock_history sh 
      WHERE sh.product_id = p.id 
      AND sh.action = 'restock' 
      AND sh.purchase_cost_per_unit IS NOT NULL
    ) THEN '✅ Has purchase history'
    ELSE '❌ No purchase history'
  END as history_status
FROM products p
JOIN sold_products_list sp ON sp.product_id = p.id;


SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  🔍 COGS DIAGNOSTIC COMPLETE - FLEXIBLE DATE TRACKING           ║
╚══════════════════════════════════════════════════════════════════╝

📋 ANALYSIS STEPS:

1️⃣ Daily COGS summary showing trends and problem days
2️⃣ All orders in the specified date range
3️⃣ Products sold during period with sales frequency
4️⃣ Purchase cost history from stock_history
5️⃣ COGS by product with profitability analysis
6️⃣ Period totals: Revenue, COGS, Gross Profit, Margin
7️⃣ Products missing cost data

🎯 HOW TO USE:

📅 CHANGE DATE RANGE:
  Edit lines 10-11 at the top:
    start_date: ''2026-03-01''::date
    end_date: ''2026-03-31''::date

📊 UNDERSTAND RESULTS:
  - Step 1 shows DAILY breakdown (spot problem days)
  - Step 5 shows BY PRODUCT (spot problem items)
  - Step 6 shows PERIOD TOTALS (overall health)
  - Step 7 shows MISSING DATA (what to fix)

🚨 RED FLAGS:
  - COGS > 70% = Low margins, check pricing
  - COGS > 100% = Operating at loss, DATA ERROR
  - "Selling at Loss" = cost_price higher than selling price

🔧 ACTION ITEMS:

If you see products "Selling at Loss":
  → cost_price is probably set to SELLING price by mistake
  → Update: UPDATE products SET cost_price = [actual purchase cost] WHERE name = ''Product Name'';

If COGS percentage seems wrong:
  → Check Step 7 for missing cost data
  → Enable COGS tracking toggle in the app
  → Enter purchase costs when restocking

If specific days show high COGS:
  → Check what products were sold that day (Step 1)
  → Cross-reference with Step 5 to find culprit products

💡 TIP: Run this monthly to spot pricing issues early!

' as diagnostic_complete;
