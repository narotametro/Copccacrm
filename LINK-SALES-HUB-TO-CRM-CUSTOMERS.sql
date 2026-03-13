-- =====================================================
-- 🔗 LINK SALES HUB TO CRM CUSTOMERS
-- =====================================================
-- Date: March 13, 2026
-- Issue: Customer Detail page shows zero purchases even though 
--        customer bought from Sales Hub
-- Root Cause: sales_hub_customers and companies tables not linked
-- Solution: Add company_id foreign key and backfill existing data
-- =====================================================

-- =====================================================
-- STEP 1: Add company_id column to sales_hub_customers
-- =====================================================
-- This creates a direct link from Sales Hub customers to CRM companies

DO $$ 
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_hub_customers' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE sales_hub_customers 
    ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_sales_hub_customers_company_id 
    ON sales_hub_customers(company_id);
    
    RAISE NOTICE '✅ Added company_id column to sales_hub_customers';
  ELSE
    RAISE NOTICE 'ℹ️  company_id column already exists';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Backfill company_id for existing customers
-- =====================================================
-- Match sales_hub_customers to companies by:
-- 1. Exact name match (case-insensitive)
-- 2. Exact email match
-- 3. Phone number match

-- Preview: Show what will be matched
SELECT 
  '🔍 PREVIEW: Customers that will be matched' as status,
  shc.id as sales_hub_id,
  shc.name as sales_hub_name,
  shc.email as sales_hub_email,
  c.id as company_id,
  c.name as company_name,
  c.email as company_email
FROM sales_hub_customers shc
LEFT JOIN companies c ON (
  LOWER(TRIM(shc.name)) = LOWER(TRIM(c.name))
  OR LOWER(TRIM(shc.email)) = LOWER(TRIM(c.email))
  OR (shc.phone IS NOT NULL AND shc.phone = c.phone)
)
WHERE shc.company_id IS NULL
AND c.id IS NOT NULL
ORDER BY shc.name;

-- Apply: Update sales_hub_customers with matched company_id
UPDATE sales_hub_customers shc
SET company_id = c.id,
    updated_at = NOW()
FROM companies c
WHERE shc.company_id IS NULL
AND (
  LOWER(TRIM(shc.name)) = LOWER(TRIM(c.name))
  OR LOWER(TRIM(shc.email)) = LOWER(TRIM(c.email))
  OR (shc.phone IS NOT NULL AND shc.phone = c.phone)
);

-- Report: Show matching results
SELECT 
  '📊 MATCHING RESULTS' as status,
  COUNT(*) FILTER (WHERE company_id IS NOT NULL) as customers_matched,
  COUNT(*) FILTER (WHERE company_id IS NULL) as customers_unmatched,
  COUNT(*) as total_customers
FROM sales_hub_customers;

-- =====================================================
-- STEP 3: Show David Electronics specifically
-- =====================================================
-- Find "David Electronics" and show their sales data

SELECT 
  '🔍 DAVID ELECTRONICS DATA' as report,
  c.id as company_id,
  c.name as company_name,
  c.email as company_email,
  shc.id as sales_hub_customer_id,
  shc.name as sales_hub_name,
  COUNT(sho.id) as total_orders,
  SUM(sho.total_amount) as total_revenue,
  ROUND(AVG(sho.total_amount)::NUMERIC, 2) as avg_order_value,
  MAX(sho.created_at) as last_purchase_date
FROM companies c
LEFT JOIN sales_hub_customers shc ON shc.company_id = c.id
LEFT JOIN sales_hub_orders sho ON sho.customer_id = shc.id AND sho.status IN ('completed', 'pending')
WHERE LOWER(c.name) LIKE '%david%'
GROUP BY c.id, c.name, c.email, shc.id, shc.name
ORDER BY c.name;

-- =====================================================
-- STEP 4: Verify all customers with their purchase data
-- =====================================================

SELECT 
  '📊 ALL CRM CUSTOMERS WITH SALES DATA' as report,
  c.name as crm_customer,
  c.email,
  c.city,
  COALESCE(shc.name, '❌ Not in Sales Hub') as sales_hub_name,
  COALESCE(order_stats.total_orders, 0) as orders,
  COALESCE(order_stats.total_revenue, 0) as revenue,
  COALESCE(order_stats.avg_order_value, 0) as avg_order,
  COALESCE(TO_CHAR(order_stats.last_purchase, 'Mon DD, YYYY'), 'Never') as last_purchase
FROM companies c
LEFT JOIN sales_hub_customers shc ON shc.company_id = c.id
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    ROUND(AVG(total_amount)::NUMERIC, 2) as avg_order_value,
    MAX(created_at) as last_purchase
  FROM sales_hub_orders
  WHERE customer_id = shc.id
  AND status IN ('completed', 'pending')
) order_stats ON true
ORDER BY revenue DESC NULLS LAST;

-- =====================================================
-- STEP 5: Fix any Walk-in sales that should be attributed
-- =====================================================
-- Find orders with customer name in notes but marked as Walk-in

SELECT 
  '⚠️  POTENTIAL MISATTRIBUTED ORDERS' as warning,
  sho.id,
  sho.invoice_number,
  sho.total_amount,
  sho.created_at,
  'Walk-in order - customer may have been in system' as issue
FROM sales_hub_orders sho
WHERE sho.customer_id IS NULL
AND sho.created_at >= NOW() - INTERVAL '30 days'
ORDER BY sho.created_at DESC
LIMIT 20;

-- =====================================================
-- ACTION ITEMS
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  ✅ DATABASE LINK COMPLETED                                      ║
╚══════════════════════════════════════════════════════════════════╝

📋 WHAT CHANGED:
   ✅ Added company_id foreign key to sales_hub_customers table
   ✅ Matched existing customers by name, email, phone
   ✅ Created index for fast queries
   ✅ System now has direct link: Companies ↔ Sales Hub Customers

🔍 DAVID ELECTRONICS:
   Check the output above to see:
   - Is David linked to a sales_hub_customer?
   - How many orders do they have?
   - What is their total revenue?

🎯 NEXT STEPS:

1️⃣  GO TO CUSTOMER DETAIL PAGE
   - Open David Electronics customer page
   - Refresh the page (F5)
   - Should now see their purchase data

2️⃣  IF STILL SHOWING ZERO:
   Check if the customer name matches exactly:
   - CRM Customer Name: "David Electronics"
   - Sales Hub Customer: Must be exactly "David Electronics"
   - Or same email must be used
   
   ⚠️  Common issues:
   - Customer created with different name (e.g. "David" vs "David Electronics")
   - Sales completed as Walk-in instead of selecting customer
   - Email mismatch between systems

3️⃣  VERIFY THE CONNECTION:
   Run this query to see the link:
   
   SELECT c.name, shc.name as sales_name, shc.company_id
   FROM companies c
   LEFT JOIN sales_hub_customers shc ON shc.company_id = c.id
   WHERE c.name LIKE ''%David%'';

4️⃣  FOR FUTURE SALES:
   The system code will be updated to automatically set company_id
   when creating sales_hub_customers, so this stays linked.

💡 TIP: If customer bought as Walk-in, those sales won''t show here.
        Always select the customer before checkout for proper tracking.

' as action_items;

-- =====================================================
-- ✅ RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- =====================================================
