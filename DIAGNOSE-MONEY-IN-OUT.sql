-- =====================================================
-- 🔍 DIAGNOSE MONEY IN/OUT TRACKER
-- =====================================================
-- Why Money IN/OUT shows TSh0 even with sales

-- STEP 1: Check if you have a company_id
SELECT 
  '1️⃣ YOUR USER INFO' as check_name,
  id as user_id,
  email,
  company_id,
  CASE 
    WHEN company_id IS NOT NULL THEN '✅ Has company_id'
    ELSE '❌ Missing company_id'
  END as status
FROM users
WHERE id = auth.uid();

-- STEP 2: Check total sales in sales_hub_orders (all sales, any user)
SELECT 
  '2️⃣ ALL SALES IN DATABASE (TODAY)' as check_name,
  COUNT(*) as total_orders_today,
  SUM(total_amount) as total_revenue_today,
  MIN(created_at) as earliest_sale,
  MAX(created_at) as latest_sale
FROM sales_hub_orders
WHERE DATE(created_at) = CURRENT_DATE;

-- STEP 3: Check YOUR sales specifically
SELECT 
  '3️⃣ YOUR SALES (TODAY)' as check_name,
  COUNT(*) as your_orders_today,
  SUM(total_amount) as your_revenue_today
FROM sales_hub_orders
WHERE DATE(created_at) = CURRENT_DATE
AND created_by = auth.uid();

-- STEP 4: Check if created_by users have company_id
SELECT 
  '4️⃣ SALES WITH USER COMPANY INFO' as check_name,
  sho.order_number,
  sho.total_amount,
  sho.created_at,
  u.email as created_by_email,
  u.company_id,
  CASE 
    WHEN u.company_id IS NOT NULL THEN '✅ Has company'
    ELSE '❌ No company'
  END as user_status
FROM sales_hub_orders sho
LEFT JOIN users u ON sho.created_by = u.id
WHERE DATE(sho.created_at) = CURRENT_DATE
ORDER BY sho.created_at DESC
LIMIT 10;

-- STEP 5: Check company-wide sales (what Money IN/OUT should show)
WITH current_user_company AS (
  SELECT company_id FROM users WHERE id = auth.uid()
)
SELECT 
  '5️⃣ COMPANY-WIDE SALES (TODAY)' as check_name,
  COUNT(sho.id) as company_orders_today,
  SUM(sho.total_amount) as company_revenue_today,
  COUNT(DISTINCT u.id) as num_team_members_with_sales
FROM sales_hub_orders sho
LEFT JOIN users u ON sho.created_by = u.id
CROSS JOIN current_user_company cuc
WHERE DATE(sho.created_at) = CURRENT_DATE
AND u.company_id = cuc.company_id;

-- STEP 6: Check expenses (should match Expenses page)
SELECT 
  '6️⃣ EXPENSES TODAY' as check_name,
  COUNT(*) as expense_count,
  SUM(amount) as total_expenses
FROM expenses
WHERE expense_date = CURRENT_DATE;

-- STEP 7: Check if foreign key exists
SELECT 
  '7️⃣ CHECK FOREIGN KEY' as check_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'sales_hub_orders'
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'created_by';

-- =====================================================
-- 📊 DIAGNOSIS
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  🔍 MONEY IN/OUT DIAGNOSIS                                       ║
╚══════════════════════════════════════════════════════════════════╝

CHECK RESULTS ABOVE:

1️⃣ YOUR USER INFO:
   - ✅ Has company_id: Money IN/OUT can work
   - ❌ Missing company_id: You need a company assigned

2️⃣ ALL SALES IN DATABASE:
   - Shows total sales today (any user)
   - If > 0: Sales exist in database
   - If = 0: No sales made today

3️⃣ YOUR SALES:
   - Shows only YOUR sales
   - If different from #2: Other users made sales too

4️⃣ SALES WITH USER COMPANY INFO:
   - Shows if order creators have company_id
   - If "No company": User not assigned to company

5️⃣ COMPANY-WIDE SALES:
   - THIS is what Money IN/OUT should show
   - If = 0 but #2 > 0: Company filtering not working

6️⃣ EXPENSES TODAY:
   - Should match Expenses page "Total Expenses"
   - If different: Date filter issue

7️⃣ CHECK FOREIGN KEY:
   - Shows if sales_hub_orders → users FK exists
   - Needed for company-wide queries

═══════════════════════════════════════════════════════════════════

🎯 LIKELY ISSUES:

A) YOU HAVE NO COMPANY_ID:
   - Money IN/OUT cannot work
   - Need admin to assign you to company

B) YOUR SALES EXIST BUT NO COMPANY_ID:
   - Your old sales have no company link
   - Only new sales after fix will show

C) FOREIGN KEY MISSING:
   - Complex join won''t work
   - Need simpler company tracking

✅ SOLUTION (depends on diagnosis):

If #1 shows "Missing company_id":
   → Contact admin to assign you to a company

If #5 shows 0 but #2 shows sales:
   → Sales creators not in same company
   → Or foreign key join not working

If #6 doesn''t match Expenses page:
   → Date timezone issue

' as diagnosis;

-- =====================================================
-- ✅ RUN THIS IN SUPABASE TO DIAGNOSE
-- =====================================================
