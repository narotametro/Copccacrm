-- =====================================================
-- 🔍 DIAGNOSE: Why David Electronics has no purchase data
-- =====================================================

-- STEP 1: Check if David Electronics exists in CRM (companies table)
SELECT 
  '1️⃣ DAVID IN CRM (companies table)' as check_name,
  id,
  name,
  email,
  phone,
  city
FROM companies
WHERE LOWER(name) LIKE '%david%';

-- STEP 2: Check if David exists in Sales Hub customers
SELECT 
  '2️⃣ DAVID IN SALES HUB (sales_hub_customers table)' as check_name,
  id,
  customer_id,
  name,
  email,
  phone,
  company_id,
  CASE 
    WHEN company_id IS NOT NULL THEN '✅ Linked to CRM'
    ELSE '❌ Not linked'
  END as link_status
FROM sales_hub_customers
WHERE LOWER(name) LIKE '%david%';

-- STEP 3: Show ALL customers in sales_hub_customers
SELECT 
  '3️⃣ ALL SALES HUB CUSTOMERS' as check_name,
  COUNT(*) as total_customers,
  COUNT(company_id) as linked_to_crm,
  COUNT(*) - COUNT(company_id) as not_linked
FROM sales_hub_customers;

SELECT 
  name,
  email,
  company_id,
  CASE 
    WHEN company_id IS NOT NULL THEN '✅ Linked'
    ELSE '❌ Not linked'
  END as status
FROM sales_hub_customers
ORDER BY created_at DESC
LIMIT 20;

-- STEP 4: Check ALL orders (including Walk-in)
SELECT 
  '4️⃣ ALL ORDERS' as check_name,
  COUNT(*) as total_orders,
  COUNT(customer_id) as orders_with_customer,
  COUNT(*) - COUNT(customer_id) as walkin_orders,
  SUM(total_amount) as total_revenue
FROM sales_hub_orders;

-- STEP 5: Show recent orders with customer names
SELECT 
  '5️⃣ RECENT ORDERS' as check_name,
  sho.order_number,
  CASE 
    WHEN sho.customer_id IS NULL THEN '🚶 Walk-in (no customer selected)'
    ELSE COALESCE(shc.name, 'Unknown')
  END as customer_name,
  sho.total_amount,
  sho.status,
  sho.created_at
FROM sales_hub_orders sho
LEFT JOIN sales_hub_customers shc ON sho.customer_id = shc.id
ORDER BY sho.created_at DESC
LIMIT 10;

-- STEP 6: Check if companies and sales_hub_customers names match
SELECT 
  '6️⃣ NAME MATCHING CHECK' as check_name,
  c.name as crm_name,
  shc.name as sales_hub_name,
  CASE 
    WHEN LOWER(TRIM(c.name)) = LOWER(TRIM(shc.name)) THEN '✅ Perfect match'
    WHEN LOWER(c.name) LIKE '%' || LOWER(shc.name) || '%' THEN '⚠️ Partial match'
    ELSE '❌ No match'
  END as match_status
FROM companies c
FULL OUTER JOIN sales_hub_customers shc ON LOWER(TRIM(c.name)) = LOWER(TRIM(shc.name))
ORDER BY c.name, shc.name;

-- =====================================================
-- 📊 DIAGNOSIS GUIDE
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  🔍 DIAGNOSIS: How to read the results above                     ║
╚══════════════════════════════════════════════════════════════════╝

1️⃣ DAVID IN CRM:
   ✅ If you see rows: David Electronics exists in CRM
   ❌ If empty: David not in CRM (create them first)

2️⃣ DAVID IN SALES HUB:
   ✅ If you see rows: David exists as a Sales Hub customer
   ❌ If empty: David was NEVER SELECTED during checkout
   
   💡 This means all sales were completed as "Walk-in"
   
3️⃣ ALL SALES HUB CUSTOMERS:
   Shows how many customers exist in Sales Hub total
   If this is 0 or very low, it means most sales are Walk-in

4️⃣ ALL ORDERS:
   - total_orders: How many sales completed
   - orders_with_customer: Sales with customer selected
   - walkin_orders: Sales with no customer (Walk-in mode)
   
   ⚠️ If walkin_orders = total_orders, ALL sales were Walk-in!

5️⃣ RECENT ORDERS:
   Shows last 10 orders with customer names
   Look for "Walk-in" vs actual customer names

6️⃣ NAME MATCHING CHECK:
   Shows if CRM customer names match Sales Hub names
   
═══════════════════════════════════════════════════════════════════

🎯 LIKELY ISSUE:

Based on your report, the most likely scenario is:

   ❌ All sales were completed as "Walk-in Customer"
   ❌ David Electronics was NEVER selected during checkout
   
This means:
- David exists in CRM (you can see their page)
- David does NOT exist in sales_hub_customers
- All purchases show as Walk-in in Sales Hub

✅ SOLUTION:

1. For PAST sales (already completed as Walk-in):
   - Cannot retroactively assign to customers
   - Those sales are anonymous
   
2. For FUTURE sales:
   - ALWAYS click "Select Customer" button
   - Choose "David Electronics" from dropdown
   - THEN complete checkout
   - System will now track properly

3. To test the fix:
   - Make a new test sale
   - Select David Electronics as customer
   - Complete checkout
   - Refresh David customer page
   - Should now see the purchase data

' as diagnosis_guide;
