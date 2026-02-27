-- =====================================================
-- FIX INCORRECT DEBT AMOUNTS
-- Update debts to match actual order amounts
-- =====================================================

-- Step 1: Find debts with mismatched amounts
SELECT 
  d.invoice_number,
  d.company_name,
  d.amount as debt_amount,
  o.total_amount as actual_order_amount,
  (d.amount - o.total_amount) as difference,
  CASE 
    WHEN d.amount = o.total_amount THEN '✓ Correct'
    WHEN d.amount > o.total_amount * 1000 THEN '❌ Way too high (1000x+)'
    WHEN d.amount != o.total_amount THEN '⚠️ Mismatch'
    ELSE '? Unknown'
  END as status
FROM debts d
INNER JOIN sales_hub_orders o ON d.invoice_number = o.order_number
WHERE d.amount != o.total_amount
ORDER BY (d.amount - o.total_amount) DESC;

-- Step 2: Show summary of incorrect debts
SELECT 
  COUNT(*) as total_debts_with_errors,
  SUM(d.amount) as current_wrong_total,
  SUM(o.total_amount) as correct_total,
  SUM(d.amount - o.total_amount) as total_overstatement
FROM debts d
INNER JOIN sales_hub_orders o ON d.invoice_number = o.order_number
WHERE d.amount != o.total_amount;

-- Step 3: FIX ALL INCORRECT AMOUNTS
-- This will update all debt amounts to match their corresponding order totals
UPDATE debts d
SET amount = o.total_amount
FROM sales_hub_orders o
WHERE d.invoice_number = o.order_number
  AND d.amount != o.total_amount;

-- Step 4: Verify all debts now match orders
SELECT 
  COUNT(*) as total_debts,
  SUM(CASE WHEN d.amount = o.total_amount THEN 1 ELSE 0 END) as correct_amounts,
  SUM(CASE WHEN d.amount != o.total_amount THEN 1 ELSE 0 END) as incorrect_amounts
FROM debts d
INNER JOIN sales_hub_orders o ON d.invoice_number = o.order_number;

-- Step 5: Show all corrected debts
SELECT 
  d.invoice_number,
  d.company_name,
  d.amount as debt_amount,
  o.total_amount as order_amount,
  CASE WHEN d.amount = o.total_amount THEN '✓ Match' ELSE '✗ Still wrong' END as status
FROM debts d
INNER JOIN sales_hub_orders o ON d.invoice_number = o.order_number
ORDER BY d.created_at DESC;
