-- Temporarily disable RLS for testing Sales Hub tables
-- Run this in Supabase SQL Editor to disable RLS temporarily

ALTER TABLE sales_hub_customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_hub_orders DISABLE ROW LEVEL SECURITY;

-- This will allow all operations without RLS checks
-- Re-enable after testing with: ALTER TABLE sales_hub_customers ENABLE ROW LEVEL SECURITY;