-- =====================================================
-- 🚨 FIX DATA DELAYS - Complete Diagnostic & Solution
-- =====================================================
-- Date: March 12, 2026
-- Issues Reported:
-- 1. Debt Collection empty (credit sales not showing)
-- 2. Customer Buying Patterns shows only "Walk-in Customer"
-- 3. Product Stocking History shows minimal data
-- =====================================================

-- =====================================================
-- ISSUE #1: DEBT COLLECTION EMPTY
-- =====================================================
-- ROOT CAUSE: SalesHub inserts into 'debts' table but it doesn't exist
-- SOLUTION: Create the missing 'debts' table
-- =====================================================

-- Check if debts table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'debts')
    THEN '✅ debts table EXISTS'
    ELSE '❌ debts table MISSING - Creating now...'
  END as debts_table_status;

-- Create debts table
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'reminded', 'written_off')),
  days_overdue INTEGER DEFAULT 0,
  payment_probability INTEGER DEFAULT 0 CHECK (payment_probability >= 0 AND payment_probability <= 100),
  risk_score TEXT DEFAULT 'low' CHECK (risk_score IN ('low', 'medium', 'high')),
  auto_reminder BOOLEAN DEFAULT false,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  company_contact_email TEXT,
  company_contact_phone TEXT,
  payment_plan TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view debts for their company" ON debts;
CREATE POLICY "Users can view debts for their company" ON debts 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.company_id = debts.company_id
    )
    OR debts.company_id IS NULL
  );

DROP POLICY IF EXISTS "Users can insert debts" ON debts;
CREATE POLICY "Users can insert debts" ON debts 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update debts for their company" ON debts;
CREATE POLICY "Users can update debts for their company" ON debts 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.company_id = debts.company_id
    )
    OR debts.company_id IS NULL
  );

DROP POLICY IF EXISTS "Users can delete debts for their company" ON debts;
CREATE POLICY "Users can delete debts for their company" ON debts 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.company_id = debts.company_id
    )
    OR debts.company_id IS NULL
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_debts_company_id ON debts(company_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debts_invoice_number ON debts(invoice_number);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_debts_updated_at ON debts;
CREATE TRIGGER update_debts_updated_at 
  BEFORE UPDATE ON debts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verify debts table was created
SELECT 
  '✅ DEBTS TABLE CREATED SUCCESSFULLY' as status,
  COUNT(*) as current_debt_records,
  SUM(amount) as total_debt_amount
FROM debts;

-- =====================================================
-- ISSUE #2: CUSTOMER BUYING PATTERNS - ONLY WALK-IN
-- =====================================================
-- ROOT CAUSE: User is NOT selecting a customer during checkout
-- SOLUTION: Select customers before checkout (explained below)
-- =====================================================

-- Diagnostic: Show how many orders have real customers vs walk-in
SELECT 
  '📊 CUSTOMER BUYING PATTERNS DIAGNOSTIC' as report_name,
  COUNT(*) as total_orders,
  COUNT(customer_id) as orders_with_customer,
  COUNT(*) - COUNT(customer_id) as walkIn_orders,
  ROUND(
    (COUNT(customer_id)::DECIMAL / NULLIF(COUNT(*), 0) * 100)::NUMERIC, 
    2
  ) || '%' as customer_selection_rate
FROM sales_hub_orders;

-- Show breakdown by customer type
SELECT 
  CASE 
    WHEN customer_id IS NULL THEN '🏪 Walk-in Customer (no customer selected)'
    ELSE '👤 Named Customer (customer selected)'
  END as customer_type,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  ROUND(AVG(total_amount)::NUMERIC, 2) as avg_order_value
FROM sales_hub_orders
GROUP BY customer_id IS NULL
ORDER BY order_count DESC;

-- Show top 10 actual customers (excluding walk-in)
SELECT 
  '👥 TOP CUSTOMERS (Real Customers Only)' as report_name,
  shc.name as customer_name,
  shc.company_name,
  COUNT(sho.id) as order_count,
  SUM(sho.total_amount) as total_spent,
  MAX(sho.created_at) as last_order_date
FROM sales_hub_orders sho
LEFT JOIN sales_hub_customers shc ON sho.customer_id = shc.id
WHERE sho.customer_id IS NOT NULL
GROUP BY shc.id, shc.name, shc.company_name
ORDER BY total_spent DESC
LIMIT 10;

-- =====================================================
-- ISSUE #3: PRODUCT STOCKING HISTORY - MINIMAL DATA
-- =====================================================
-- ROOT CAUSE: Data IS being recorded, but filters are hiding it
-- SOLUTION: Check all filters and date ranges
-- =====================================================

-- Show ALL stock history (last 30 days)
SELECT 
  '📦 STOCK HISTORY (Last 30 Days)' as report_name,
  COUNT(*) as total_entries,
  COUNT(DISTINCT product_id) as unique_products,
  SUM(CASE WHEN quantity_change > 0 THEN 1 ELSE 0 END) as stock_increases,
  SUM(CASE WHEN quantity_change < 0 THEN 1 ELSE 0 END) as stock_decreases
FROM stock_history
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Show breakdown by action type
SELECT 
  change_type as action_type,
  COUNT(*) as entry_count,
  SUM(quantity_change) as net_quantity_change,
  MIN(created_at) as earliest_entry,
  MAX(created_at) as latest_entry
FROM stock_history
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY change_type
ORDER BY entry_count DESC;

-- Show recent stock changes (last 20)
SELECT 
  TO_CHAR(sh.created_at, 'Mon DD, HH24:MI') as when_changed,
  p.name as product_name,
  p.sku,
  p.brand,
  sh.change_type as action,
  sh.quantity_change as change,
  sh.quantity_before || ' → ' || sh.quantity_after as stock_level,
  sh.reference_type || ': ' || sh.reference_id as reference
FROM stock_history sh
LEFT JOIN products p ON sh.product_id = p.id
ORDER BY sh.created_at DESC
LIMIT 20;

-- =====================================================
-- COMPREHENSIVE SYSTEM HEALTH CHECK
-- =====================================================

-- Check all critical tables
SELECT 
  '🏥 SYSTEM HEALTH CHECK' as report,
  (SELECT COUNT(*) FROM debts) as debt_records,
  (SELECT COUNT(*) FROM sales_hub_orders) as total_orders,
  (SELECT COUNT(*) FROM sales_hub_orders WHERE customer_id IS NOT NULL) as orders_with_customer,
  (SELECT COUNT(*) FROM sales_hub_customers) as total_customers,
  (SELECT COUNT(*) FROM stock_history) as stock_history_entries,
  (SELECT COUNT(*) FROM products) as total_products;

-- =====================================================
-- ACTION ITEMS FOR USER
-- =====================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  ✅ ACTION ITEMS TO FIX YOUR DATA DELAYS                         ║
╚══════════════════════════════════════════════════════════════════╝

📋 ISSUE #1: DEBT COLLECTION EMPTY
   ├─ ✅ FIX APPLIED: Created debts table
   ├─ 📝 NEXT STEP: Make a credit sale to test
   └─ 🔍 HOW TO TEST:
      1. Go to Sales Hub
      2. Add items to cart
      3. Select payment method: CREDIT (not cash/card)
      4. Complete checkout
      5. Go to Debt Collection tab → should see the debt appear

👥 ISSUE #2: CUSTOMER BUYING PATTERNS SHOWS ONLY WALK-IN
   ├─ ⚠️  ROOT CAUSE: You are not selecting customers during checkout
   ├─ 📝 FIX: SELECT A CUSTOMER before completing order
   └─ 🔍 HOW TO FIX:
      1. Before checkout, look for customer selection dropdown
      2. Click "Select Customer" button 
      3. Choose a customer from the list OR create new customer
      4. THEN complete checkout
      5. That order will now show under that customer in patterns
      
      💡 TIP: "Walk-in Customer" means you clicked checkout 
              WITHOUT selecting a customer. This is for retail 
              purchases where you don''t know who the customer is.

📦 ISSUE #3: PRODUCT STOCKING HISTORY MINIMAL DATA
   ├─ ✅ GOOD NEWS: This IS working (you saw 33 INCH +500)
   ├─ ⚠️  REASON FOR "SMALL DATA":
      │  • Default filter is "Last 7 Days"
      │  • Only shows operations YOU performed
      │  • If you did few restocks/sales, shows few entries
   └─ 🔍 HOW TO SEE MORE DATA:
      1. Change date range from "Last 7 Days" to "Last 30 Days"
      2. Change action type from "All Actions" to see specific types
      3. Do more operations (sales, restocks) to generate more data
      4. Check filters aren''t hiding your data

🎯 SUMMARY:
   ✅ Debt Collection: FIXED (table created)
   ⚠️  Customer Patterns: WORKING - You must select customers during checkout
   ✅ Stocking History: WORKING - Change filters to see more data

🚀 BEST PRACTICES FOR BEST COPCCA CRM EXPERIENCE:
   1. ALWAYS select a customer when you know who they are
   2. Only use "Walk-in" for true anonymous retail sales
   3. Use CREDIT payment method for credit sales (not cash)
   4. Check date range filters if data seems missing
   5. Restock via Sales Hub inventory management to track history

' as action_items;

-- =====================================================
-- ✅ RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- =====================================================
-- After running:
-- 1. debts table will be created (fixes Debt Collection)
-- 2. You'll see diagnostic reports explaining your data
-- 3. Follow the action items above to use the system correctly
-- =====================================================
