-- =====================================================
-- 🔧 FIX RLS POLICIES FOR SALES_HUB_CUSTOMERS
-- =====================================================
-- This fixes the 403 error preventing order completion
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sales_hub_customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sales_hub_customers;
DROP POLICY IF EXISTS "Users can insert customers" ON sales_hub_customers;
DROP POLICY IF EXISTS "Users can view customers" ON sales_hub_customers;

-- Enable RLS
ALTER TABLE sales_hub_customers ENABLE ROW LEVEL SECURITY;

-- Create new SELECT policy (read access)
CREATE POLICY "Users can view sales hub customers"
ON sales_hub_customers
FOR SELECT
TO authenticated
USING (true);

-- Create new INSERT policy (write access)
CREATE POLICY "Users can insert sales hub customers"
ON sales_hub_customers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create UPDATE policy
CREATE POLICY "Users can update sales hub customers"
ON sales_hub_customers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT 
  '✅ RLS POLICIES CREATED' as status,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'sales_hub_customers'
ORDER BY policyname;

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║  ✅ SALES_HUB_CUSTOMERS RLS FIXED                               ║
╚══════════════════════════════════════════════════════════════════╝

🎯 WHAT CHANGED:

✅ Dropped old restrictive policies
✅ Created new SELECT policy (read customers)
✅ Created new INSERT policy (create walk-in customers)
✅ Created new UPDATE policy (update customer records)

📊 NOW YOU CAN:

- Complete sales with walk-in customers
- Create new customer records
- View all customer data

🔍 NEXT STEPS:

1. Refresh your browser (Ctrl+F5)
2. Try completing a sale again
3. Should work without 403 errors

' as success_message;
