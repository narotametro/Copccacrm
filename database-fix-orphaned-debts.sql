-- =====================================================
-- FIX ORPHANED DEBTS (Debts without matching orders)
-- Cleanup script for debt records that have no orders
-- =====================================================

-- Step 1: Review orphaned debts
SELECT 
  d.id,
  d.invoice_number,
  d.company_name,
  d.amount,
  d.created_at,
  'No matching order' as issue
FROM debts d
LEFT JOIN sales_hub_orders o ON d.invoice_number = o.order_number
WHERE o.id IS NULL
ORDER BY d.created_at DESC;

-- Step 2: DELETE orphaned debts (debts without matching orders)
-- WARNING: This will permanently delete debt records that don't have orders!
-- Review the above query first, then uncomment to run:

DELETE FROM debts
WHERE invoice_number IN (
  SELECT d.invoice_number
  FROM debts d
  LEFT JOIN sales_hub_orders o ON d.invoice_number = o.order_number
  WHERE o.id IS NULL
);

-- Step 3: Verify cleanup
SELECT 
  'Total debts' as metric,
  COUNT(*) as count
FROM debts
UNION ALL
SELECT 
  'Debts with matching orders',
  COUNT(*)
FROM debts d
INNER JOIN sales_hub_orders o ON d.invoice_number = o.order_number
UNION ALL
SELECT 
  'Orphaned debts (should be 0)',
  COUNT(*)
FROM debts d
LEFT JOIN sales_hub_orders o ON d.invoice_number = o.order_number
WHERE o.id IS NULL;

-- =====================================================
-- CREATE MISSING DEBTS for existing credit orders
-- For credit orders that don't have debt records yet
-- =====================================================

-- Step 4: Find credit orders without debt records
SELECT 
  o.order_number,
  o.total_amount,
  o.created_at,
  c.name as customer_name,
  'Missing debt record' as issue
FROM sales_hub_orders o
LEFT JOIN debts d ON o.order_number = d.invoice_number
LEFT JOIN sales_hub_customers c ON o.customer_id = c.id
WHERE o.payment_method = 'credit'
  AND d.id IS NULL
ORDER BY o.created_at DESC;

-- Step 5: CREATE missing debt records for existing credit orders
-- Uncomment to run:

INSERT INTO debts (
  invoice_number,
  amount,
  due_date,
  status,
  days_overdue,
  payment_probability,
  risk_score,
  auto_reminder,
  company_id,
  company_name,
  company_contact_email,
  company_contact_phone,
  created_by,
  created_at
)
SELECT 
  o.order_number,
  o.total_amount,
  -- Default to 30 days after order creation
  (o.created_at::date + INTERVAL '30 days')::date,
  CASE 
    WHEN (o.created_at::date + INTERVAL '30 days')::date < CURRENT_DATE THEN 'overdue'
    ELSE 'pending'
  END,
  CASE 
    WHEN (o.created_at::date + INTERVAL '30 days')::date < CURRENT_DATE 
    THEN (CURRENT_DATE - (o.created_at::date + INTERVAL '30 days')::date)
    ELSE 0
  END,
  70,
  'medium',
  true,
  c.customer_id,
  c.name,
  c.email,
  COALESCE(c.mobile, c.phone),
  o.created_by,
  o.created_at
FROM sales_hub_orders o
LEFT JOIN debts d ON o.order_number = d.invoice_number
LEFT JOIN sales_hub_customers c ON o.customer_id = c.id
WHERE o.payment_method = 'credit'
  AND d.id IS NULL
  AND o.created_by IS NOT NULL;

-- Step 6: Final verification
SELECT 
  'Credit orders' as metric,
  COUNT(*) as count
FROM sales_hub_orders
WHERE payment_method = 'credit'
UNION ALL
SELECT 
  'Debt records',
  COUNT(*)
FROM debts
UNION ALL
SELECT 
  'Credit orders with debts',
  COUNT(DISTINCT o.order_number)
FROM sales_hub_orders o
INNER JOIN debts d ON o.order_number = d.invoice_number
WHERE o.payment_method = 'credit';
