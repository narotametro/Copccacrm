-- Fix RLS Policies for Sales Hub Tables
-- Run this in your Supabase SQL Editor after the main migration

-- ===========================================
-- UPDATE RLS POLICIES TO ALLOW AUTHENTICATED USERS
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view customers" ON sales_hub_customers;
DROP POLICY IF EXISTS "Users can insert customers" ON sales_hub_customers;
DROP POLICY IF EXISTS "Users can update customers" ON sales_hub_customers;

DROP POLICY IF EXISTS "Users can view orders" ON sales_hub_orders;
DROP POLICY IF EXISTS "Users can create orders" ON sales_hub_orders;
DROP POLICY IF EXISTS "Users can update orders" ON sales_hub_orders;

-- Create new policies allowing authenticated users
CREATE POLICY "Authenticated users can view customers" ON sales_hub_customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customers" ON sales_hub_customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customers" ON sales_hub_customers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view orders" ON sales_hub_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create orders" ON sales_hub_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" ON sales_hub_orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

-- RLS policies updated to allow authenticated users access to Sales Hub tables.