-- =====================================================
-- DEBUG: Check actual amounts in database
-- Compare what's stored vs what should be stored
-- =====================================================

-- Check the Beko Group debt and order
SELECT 
  'Debt Record' as source,
  d.invoice_number,
  d.company_name,
  d.amount,
  d.created_at
FROM debts d
WHERE d.invoice_number = 'INV-1772226704691HUVU'
UNION ALL
SELECT 
  'Order Record' as source,
  o.order_number as invoice_number,
  'Beko Group' as company_name,
  o.total_amount as amount,
  o.created_at
FROM sales_hub_orders o
WHERE o.order_number = 'INV-1772226704691HUVU';

-- Check ALL recent debts with their actual amounts
SELECT 
  d.invoice_number,
  d.company_name,
  d.amount as debt_amount,
  o.total_amount as order_amount,
  CASE 
    WHEN d.amount = o.total_amount THEN '✓ Match'
    WHEN d.amount > o.total_amount * 2000 THEN '❌ 2000x+ too high'
    WHEN d.amount > o.total_amount * 100 THEN '❌ 100x+ too high'
    WHEN d.amount > o.total_amount * 10 THEN '❌ 10x+ too high'
    WHEN d.amount != o.total_amount THEN '⚠️ Mismatch'
    ELSE '? Unknown'
  END as status,
  ROUND(d.amount / NULLIF(o.total_amount, 0), 2) as multiplier,
  d.created_at
FROM debts d
LEFT JOIN sales_hub_orders o ON d.invoice_number = o.order_number
ORDER BY d.created_at DESC
LIMIT 10;

-- If amounts are consistently 2500x too high, it suggests:
-- 1. Currency conversion is being applied incorrectly
-- 2. Amount might be stored in smallest unit (cents) when it should be in main unit
-- 3. Or there's a bug in how total is calculated

-- Check if there's a pattern in the multiplier
SELECT 
  ROUND(AVG(d.amount / NULLIF(o.total_amount, 0)), 2) as avg_multiplier,
  MIN(d.amount / NULLIF(o.total_amount, 0)) as min_multiplier,
  MAX(d.amount / NULLIF(o.total_amount, 0)) as max_multiplier,
  COUNT(*) as total_mismatched_debts
FROM debts d
INNER JOIN sales_hub_orders o ON d.invoice_number = o.order_number
WHERE d.amount != o.total_amount;
