-- =====================================================
-- CHECK DEBT AMOUNTS VS ACTUAL CREDIT ORDERS
-- Diagnostic query to find mismatches
-- =====================================================

-- View all debts with their amounts
SELECT 
  id,
  invoice_number,
  company_name,
  amount,
  due_date,
  status,
  created_at,
  created_by
FROM debts
ORDER BY created_at DESC;

-- View all credit orders with their amounts
SELECT 
  order_number,
  customer_id,
  total_amount,
  payment_method,
  status,
  created_at,
  created_by
FROM sales_hub_orders
WHERE payment_method = 'credit'
ORDER BY created_at DESC;

-- Compare debts with matching orders
SELECT 
  d.invoice_number,
  d.company_name,
  d.amount as debt_amount,
  o.total_amount as order_amount,
  CASE 
    WHEN d.amount = o.total_amount THEN '✓ Match'
    ELSE '✗ Mismatch: ' || (d.amount - o.total_amount)::text
  END as comparison,
  d.created_at as debt_created,
  o.created_at as order_created
FROM debts d
LEFT JOIN sales_hub_orders o ON d.invoice_number = o.order_number
ORDER BY d.created_at DESC;

-- Find duplicate debts for same invoice
SELECT 
  invoice_number,
  COUNT(*) as count,
  array_agg(amount) as amounts,
  array_agg(id) as debt_ids
FROM debts
GROUP BY invoice_number
HAVING COUNT(*) > 1;

-- =====================================================
-- CLEANUP QUERIES (Run after reviewing above)
-- =====================================================

-- Remove duplicate debts (keeps only the first one created)
-- UNCOMMENT TO RUN:
-- DELETE FROM debts
-- WHERE id IN (
--   SELECT id
--   FROM (
--     SELECT id,
--            ROW_NUMBER() OVER (PARTITION BY invoice_number ORDER BY created_at ASC) as rn
--     FROM debts
--   ) t
--   WHERE t.rn > 1
-- );

-- Remove debts that don't have matching orders
-- UNCOMMENT TO RUN:
-- DELETE FROM debts
-- WHERE invoice_number NOT IN (
--   SELECT order_number FROM sales_hub_orders
-- );

-- Reset all debt amounts to match actual order totals
-- UNCOMMENT TO RUN:
-- UPDATE debts d
-- SET amount = o.total_amount
-- FROM sales_hub_orders o
-- WHERE d.invoice_number = o.order_number
-- AND d.amount != o.total_amount;
