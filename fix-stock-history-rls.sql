-- Check and fix RLS policies for stock_history table

-- First, let's see what RLS policies currently exist
SELECT 'Current RLS policies on stock_history:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'stock_history';

-- Drop existing policies (they might be too restrictive)
DROP POLICY IF EXISTS "Users can view stock history for their company products" ON stock_history;
DROP POLICY IF EXISTS "Users can insert stock history for their company products" ON stock_history;
DROP POLICY IF EXISTS "Users can update stock history for their company products" ON stock_history;
DROP POLICY IF EXISTS "Enable read access for all users" ON stock_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON stock_history;

-- Create simpler, more permissive policies for testing
-- Allow all authenticated users to SELECT
CREATE POLICY "Allow authenticated users to view stock history" ON stock_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to INSERT
CREATE POLICY "Allow authenticated users to insert stock history" ON stock_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow all authenticated users to UPDATE
CREATE POLICY "Allow authenticated users to update stock history" ON stock_history
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow all authenticated users to DELETE (optional)
CREATE POLICY "Allow authenticated users to delete stock history" ON stock_history
  FOR DELETE
  TO authenticated
  USING (true);

-- Verify RLS is enabled
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Test query - this should return data if RLS is working
SELECT 'Test query - Recent stock history records:' as info;
SELECT 
  id,
  product_id,
  change_type,
  quantity_change,
  quantity_before,
  quantity_after,
  reference_type,
  reference_id,
  created_at,
  performed_by
FROM stock_history
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 10;

-- Check if products table has proper company_id
SELECT 'Products with stock history (checking company_id):' as info;
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.company_id,
  COUNT(sh.id) as history_count
FROM products p
LEFT JOIN stock_history sh ON sh.product_id = p.id
GROUP BY p.id, p.name, p.company_id
HAVING COUNT(sh.id) > 0
ORDER BY history_count DESC
LIMIT 10;
