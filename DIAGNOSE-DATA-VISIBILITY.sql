-- =====================================================
-- 🔍 DIAGNOSE DATA VISIBILITY ISSUES
-- =====================================================
-- User reported:
-- 1. Debt Collection is empty (but made credit sales)
-- 2. Customer Buying Patterns only shows "Walk-in Customer"
-- 3. Product Stocking History has limited data
-- =====================================================
-- Date: March 12, 2026
-- =====================================================

-- =====================================================
-- STEP 1: CHECK DEBTS TABLE
-- =====================================================

SELECT 
  '📊 DEBTS TABLE - ALL RECORDS' as report_section,
  COUNT(*) as total_debts,
  COUNT(CASE WHEN company_name = 'Walk-in Customer' THEN 1 END) as walkin_debts,
  COUNT(CASE WHEN company_name != 'Walk-in Customer' THEN 1 END) as real_customer_debts,
  SUM(amount) as total_debt_amount,
  COUNT(DISTINCT company_name) as unique_companies
FROM debts;

-- Show sample debt records
SELECT 
  '📋 SAMPLE DEBT RECORDS' as report,
  invoice_number,
  company_name,
  amount,
  due_date,
  status,
  payment_probability,
  created_at,
  created_by
FROM debts
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 2: CHECK SALES_HUB_ORDERS TABLE
-- =====================================================

SELECT 
  '📦 SALES ORDERS - CUSTOMER BREAKDOWN' as report_section,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN customer_id IS NULL THEN 1 END) as walkin_orders,
  COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as customer_orders,
  SUM(total_amount) as total_sales_value,
  COUNT(DISTINCT customer_id) as unique_customers
FROM sales_hub_orders;

-- Show sample orders with customer info
SELECT 
  '📊 SAMPLE ORDERS WITH CUSTOMERS' as report,
  o.invoice_number,
  o.customer_id,
  c.name as customer_name,
  c.company_name,
  o.total_amount,
  o.payment_method,
  o.created_at
FROM sales_hub_orders o
LEFT JOIN sales_hub_customers c ON o.customer_id = c.id
ORDER BY o.created_at DESC
LIMIT 15;

-- =====================================================
-- STEP 3: CHECK STOCK_HISTORY TABLE
-- =====================================================

SELECT 
  '📦 STOCK HISTORY - ACTION BREAKDOWN' as report_section,
  COUNT(*) as total_records,
  COUNT(DISTINCT product_id) as unique_products,
  COUNT(CASE WHEN action = 'pos_sale' THEN 1 END) as pos_sales,
  COUNT(CASE WHEN action = 'restock' THEN 1 END) as restocks,
  COUNT(CASE WHEN action = 'return' THEN 1 END) as returns,
  COUNT(CASE WHEN action = 'adjustment' THEN 1 END) as adjustments,
  SUM(ABS(quantity_change)) as total_quantity_moved
FROM stock_history;

-- Show recent stock history
SELECT 
  '📋 RECENT STOCK CHANGES' as report,
  sh.created_at,
  p.name as product_name,
  p.sku,
  sh.action,
  sh.quantity_change,
  sh.stock_before,
  sh.stock_after,
  sh.location,
  sh.reference_type,
  sh.reference_id
FROM stock_history sh
JOIN products p ON sh.product_id = p.id
ORDER BY sh.created_at DESC
LIMIT 20;

-- =====================================================
-- STEP 4: CHECK SALES_HUB_CUSTOMERS TABLE
-- =====================================================

SELECT 
  '👥 CUSTOMERS TABLE' as report_section,
  COUNT(*) as total_customers,
  COUNT(CASE WHEN name = 'Walk-in Customer' THEN 1 END) as walkin_entries,
  COUNT(CASE WHEN name != 'Walk-in Customer' THEN 1 END) as real_customers,
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as customers_with_email,
  COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as customers_with_phone
FROM sales_hub_customers;

-- Show all customers (should be small list)
SELECT 
  '👤 ALL CUSTOMERS' as report,
  id,
  name,
  company_name,
  email,
  phone,
  created_at
FROM sales_hub_customers
ORDER BY created_at DESC;

-- =====================================================
-- STEP 5: DIAGNOSE WALK-IN vs REAL CUSTOMER SALES
-- =====================================================

-- Orders by payment method and customer type
SELECT 
  '💳 PAYMENT METHOD BREAKDOWN' as report,
  payment_method,
  CASE WHEN customer_id IS NULL THEN 'Walk-in' ELSE 'Real Customer' END as customer_type,
  COUNT(*) as order_count,
  SUM(total_amount) as total_value
FROM sales_hub_orders
GROUP BY payment_method, customer_id IS NULL
ORDER BY payment_method, customer_type;

-- Credit orders (should match debts table)
SELECT 
  '💰 CREDIT ORDERS vs DEBTS' as report,
  (SELECT COUNT(*) FROM sales_hub_orders WHERE payment_method = 'credit') as credit_orders_count,
  (SELECT COUNT(*) FROM debts) as debt_records_count,
  (SELECT SUM(total_amount) FROM sales_hub_orders WHERE payment_method = 'credit') as credit_orders_total,
  (SELECT SUM(amount) FROM debts) as debt_records_total;

-- =====================================================
-- STEP 6: IDENTIFY ROOT CAUSES
-- =====================================================

-- Check if user is selecting customers or always using Walk-in
SELECT 
  '🎯 DIAGNOSIS: Customer Selection Behavior' as diagnosis,
  total_orders,
  walkin_orders,
  real_customer_orders,
  ROUND((CAST(walkin_orders AS FLOAT) / NULLIF(total_orders, 0)) * 100, 1) || '%' as walkin_percentage,
  ROUND((CAST(real_customer_orders AS FLOAT) / NULLIF(total_orders, 0)) * 100, 1) || '%' as real_customer_percentage,
  CASE 
    WHEN walkin_orders > real_customer_orders * 3 
      THEN '⚠️ USER IS MOSTLY USING WALK-IN MODE - Needs to select actual customers for better analytics'
    WHEN real_customer_orders > walkin_orders 
      THEN '✅ Good customer selection behavior'
    ELSE '⚠️ Mixed usage - encourage more customer selection'
  END as recommendation
FROM (
  SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN customer_id IS NULL THEN 1 END) as walkin_orders,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as real_customer_orders
  FROM sales_hub_orders
);

-- =====================================================
-- STEP 7: SUMMARY & RECOMMENDATIONS
-- =====================================================

DO $$
DECLARE
  total_debts INTEGER;
  walkin_debts INTEGER;
  total_orders INTEGER;
  walkin_orders INTEGER;
  real_customers INTEGER;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO total_debts FROM debts;
  SELECT COUNT(*) INTO walkin_debts FROM debts WHERE company_name = 'Walk-in Customer';
  SELECT COUNT(*) INTO total_orders FROM sales_hub_orders;
  SELECT COUNT(*) INTO walkin_orders FROM sales_hub_orders WHERE customer_id IS NULL;
  SELECT COUNT(*) INTO real_customers FROM sales_hub_customers WHERE name != 'Walk-in Customer';

  RAISE NOTICE '===================================';
  RAISE NOTICE '🔍 DATA VISIBILITY DIAGNOSIS SUMMARY';
  RAISE NOTICE '===================================';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ DEBTS (Debt Collection Tab):';
  RAISE NOTICE '   Total debt records: %', total_debts;
  RAISE NOTICE '   Walk-in debts: %', walkin_debts;
  RAISE NOTICE '   Real customer debts: %', total_debts - walkin_debts;
  
  IF total_debts = 0 THEN
    RAISE NOTICE '   ❌ NO DEBTS FOUND - Credit sales may not be creating debt records';
  ELSIF walkin_debts = total_debts THEN
    RAISE NOTICE '   ⚠️ ALL DEBTS ARE WALK-IN - User needs to select customers for credit sales';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ ORDERS (Customer Buying Patterns):';
  RAISE NOTICE '   Total orders: %', total_orders;
  RAISE NOTICE '   Walk-in orders: %', walkin_orders;
  RAISE NOTICE '   Real customer orders: %', total_orders - walkin_orders;
  RAISE NOTICE '   Real customers registered: %', real_customers;
  
  IF walkin_orders > (total_orders - walkin_orders) * 2 THEN
    RAISE NOTICE '   ⚠️ MOSTLY WALK-IN SALES - User needs to select customers during checkout';
    RAISE NOTICE '   💡 Fix: Switch from "Walk-in" to "Select Customer" mode before completing order';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ RECOMMENDATIONS:';
  RAISE NOTICE '   ✅ Add validation: Require customer selection for credit sales';
  RAISE NOTICE '   ✅ Improve UX: Show warning if completing order as Walk-in';
  RAISE NOTICE '   ✅ Train user: Explain Walk-in vs Customer selection modes';
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
END $$;

-- =====================================================
-- ✅ DIAGNOSIS COMPLETE
-- =====================================================
