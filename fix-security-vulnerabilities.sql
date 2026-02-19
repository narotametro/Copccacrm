-- =====================================================
-- FIX: Critical Security Vulnerabilities (Supabase Linter)
-- =====================================================
-- This migration addresses security issues detected by Supabase database linter
-- 
-- CRITICAL ISSUES FIXED:
-- 1. RLS policies using user_metadata (SECURITY RISK - users can edit their own metadata!)
-- 2. Overly permissive RLS policies (USING true / WITH CHECK true)
-- 3. Security Definer views
-- 4. Functions without search_path protection
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: FIX RLS POLICIES USING user_metadata
-- =====================================================
-- CRITICAL: user_metadata is editable by end users via client SDK
-- We must use users.role column instead (server-controlled)

-- Fix: deals table
DROP POLICY IF EXISTS "Users can view deals for their companies" ON deals;
DROP POLICY IF EXISTS "Users can update their deals" ON deals;

CREATE POLICY "Users can view deals for their companies" ON deals
FOR SELECT 
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their deals" ON deals
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Fix: after_sales table
DROP POLICY IF EXISTS "Users can view after sales for their companies" ON after_sales;

CREATE POLICY "Users can view after sales for their companies" ON after_sales
FOR SELECT 
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Fix: debt_collection table
DROP POLICY IF EXISTS "Users can view debt collection for their companies" ON debt_collection;

CREATE POLICY "Users can view debt collection for their companies" ON debt_collection
FOR SELECT 
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Fix: competitors table
DROP POLICY IF EXISTS "Admins can manage competitors" ON competitors;

CREATE POLICY "Admins can manage competitors" ON competitors
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Fix: sales_strategies table
DROP POLICY IF EXISTS "Users can view sales strategies for their companies" ON sales_strategies;

CREATE POLICY "Users can view sales strategies for their companies" ON sales_strategies
FOR SELECT 
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Fix: interactions table
DROP POLICY IF EXISTS "Users can view interactions for their companies" ON interactions;

CREATE POLICY "Users can view interactions for their companies" ON interactions
FOR SELECT 
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Fix: user_permissions table
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;

CREATE POLICY "Users can view their own permissions" ON user_permissions
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Fix: invitation_links table
DROP POLICY IF EXISTS "Users can view invitation links they created" ON invitation_links;

CREATE POLICY "Users can view invitation links they created" ON invitation_links
FOR SELECT 
TO authenticated
USING (created_by = auth.uid());

-- Fix: users table
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

CREATE POLICY "Admins can manage all users" ON users
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Fix: sales_hub_customers table
DROP POLICY IF EXISTS "Users can view customers" ON sales_hub_customers;
DROP POLICY IF EXISTS "Users can update customers" ON sales_hub_customers;

CREATE POLICY "Users can view customers" ON sales_hub_customers
FOR SELECT 
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update customers" ON sales_hub_customers
FOR UPDATE 
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Fix: sales_hub_orders table
DROP POLICY IF EXISTS "Users can view orders" ON sales_hub_orders;
DROP POLICY IF EXISTS "Users can update orders" ON sales_hub_orders;

CREATE POLICY "Users can view orders" ON sales_hub_orders
FOR SELECT 
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update orders" ON sales_hub_orders
FOR UPDATE 
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- =====================================================
-- PART 2: FIX OVERLY PERMISSIVE RLS POLICIES
-- =====================================================

-- Fix: customer_feedback DELETE policy (too permissive)
-- Note: customer_feedback table has no created_by column, only company_id
-- Restrict to users from the same company OR admins
DROP POLICY IF EXISTS "authenticated_users_delete_feedback" ON customer_feedback;

CREATE POLICY "authenticated_users_delete_feedback" ON customer_feedback
FOR DELETE 
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Fix: customer_feedback UPDATE policy (too permissive)
-- Restrict to users from the same company OR admins
DROP POLICY IF EXISTS "authenticated_users_update_feedback" ON customer_feedback;

CREATE POLICY "authenticated_users_update_feedback" ON customer_feedback
FOR UPDATE 
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Fix: stock_history policies (too permissive - allow all authenticated users)
DROP POLICY IF EXISTS "Allow authenticated users to delete stock history" ON stock_history;
DROP POLICY IF EXISTS "Allow authenticated users to update stock history" ON stock_history;
DROP POLICY IF EXISTS "Allow authenticated users to insert stock history" ON stock_history;

CREATE POLICY "Users can insert own company stock history" ON stock_history
FOR INSERT 
TO authenticated
WITH CHECK (
  product_id IN (
    SELECT id FROM products 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can update own company stock history" ON stock_history
FOR UPDATE 
TO authenticated
USING (
  product_id IN (
    SELECT id FROM products 
    WHERE created_by = auth.uid()
  )
)
WITH CHECK (
  product_id IN (
    SELECT id FROM products 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete own company stock history" ON stock_history
FOR DELETE 
TO authenticated
USING (
  product_id IN (
    SELECT id FROM products 
    WHERE created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- PART 3: REMOVE SECURITY DEFINER FROM VIEWS
-- =====================================================
-- Security Definer views run with creator's permissions, bypassing RLS
-- Replace with SECURITY INVOKER (run with querying user's permissions)

-- Fix: customer_summary_view
DROP VIEW IF EXISTS customer_summary_view;
CREATE OR REPLACE VIEW customer_summary_view
WITH (security_invoker=true)
AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.phone,
  c.created_at,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as total_revenue
FROM companies c
LEFT JOIN sales_hub_orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.email, c.phone, c.created_at;

-- Fix: active_customers_view
DROP VIEW IF EXISTS active_customers_view;
CREATE OR REPLACE VIEW active_customers_view
WITH (security_invoker=true)
AS
SELECT *
FROM companies
WHERE status = 'active' AND is_own_company = false;

-- Fix: v_expense_summary_by_category
DROP VIEW IF EXISTS v_expense_summary_by_category;
CREATE OR REPLACE VIEW v_expense_summary_by_category
WITH (security_invoker=true)
AS
SELECT 
  e.category_name,
  ec.name as category_full_name,
  COUNT(*) as expense_count,
  SUM(e.amount) as total_amount,
  AVG(e.amount) as avg_amount
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
GROUP BY e.category_name, ec.name;

-- Fix: v_monthly_expense_trends
DROP VIEW IF EXISTS v_monthly_expense_trends;
CREATE OR REPLACE VIEW v_monthly_expense_trends
WITH (security_invoker=true)
AS
SELECT 
  DATE_TRUNC('month', e.expense_date) as month,
  e.category_name,
  SUM(e.amount) as total_amount
FROM expenses e
GROUP BY DATE_TRUNC('month', e.expense_date), e.category_name
ORDER BY month DESC;

-- Fix: v_vendor_spending
DROP VIEW IF EXISTS v_vendor_spending;
CREATE OR REPLACE VIEW v_vendor_spending
WITH (security_invoker=true)
AS
SELECT 
  vendor_name,
  COUNT(*) as transaction_count,
  SUM(amount) as total_spent
FROM expenses
WHERE vendor_name IS NOT NULL
GROUP BY vendor_name
ORDER BY total_spent DESC;

-- =====================================================
-- PART 4: ADD search_path TO CRITICAL FUNCTIONS
-- =====================================================
-- Prevent schema-shadowing attacks by setting explicit search_path

-- Fix: update_subscription_updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix: update_customer_updated_at
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix: update_sales_hub_order_updated_at
CREATE OR REPLACE FUNCTION update_sales_hub_order_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify RLS policies are no longer using user_metadata
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual LIKE '%user_metadata%' OR
    with_check LIKE '%user_metadata%'
  )
ORDER BY tablename, policyname;

-- Should return 0 rows if successful

-- Verify no views are using SECURITY DEFINER
SELECT 
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%SECURITY DEFINER%'
ORDER BY viewname;

-- Should return 0 rows if successful

-- Verify critical functions have search_path set
SELECT 
  routine_schema,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_subscription_updated_at',
    'update_customer_updated_at',
    'update_sales_hub_order_updated_at',
    'update_updated_at_column'
  )
ORDER BY routine_name;

-- All should show 'DEFINER' for security_type (meaning search_path is set)

COMMIT;
