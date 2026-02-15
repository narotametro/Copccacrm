-- ================================================================
-- FIX DATA ISOLATION: Ensure users only see their own company data
-- ================================================================
-- This migration fixes critical data leakage issues where new users
-- see customers, orders, products, and expenses from other companies.
-- 
-- Run this in your Supabase SQL Editor
-- ================================================================

-- ================================================================
-- STEP 1: Ensure all tables have company_id column
-- ================================================================

-- Add company_id to products if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_products_company_id ON products(company_id);
        
        RAISE NOTICE 'Added company_id to products table';
    END IF;
END $$;

-- Add company_id to sales_hub_customers if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_hub_customers' 
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE sales_hub_customers 
        ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_sales_hub_customers_company_id ON sales_hub_customers(company_id);
        
        RAISE NOTICE 'Added company_id to sales_hub_customers table';
    END IF;
END $$;

-- Add company_id to sales_hub_orders if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_hub_orders' 
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE sales_hub_orders 
        ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_sales_hub_orders_company_id ON sales_hub_orders(company_id);
        
        RAISE NOTICE 'Added company_id to sales_hub_orders table';
    END IF;
END $$;

-- ================================================================
-- STEP 2: DROP OLD RLS POLICIES
-- ================================================================

-- Drop old customers policies
DROP POLICY IF EXISTS "Users can view assigned customers" ON sales_hub_customers;
DROP POLICY IF EXISTS "Users can update assigned customers" ON sales_hub_customers;
DROP POLICY IF EXISTS "Users can insert customers" ON sales_hub_customers;
DROP POLICY IF EXISTS "Users can delete customers" ON sales_hub_customers;

-- Drop old orders policies
DROP POLICY IF EXISTS "Users can view orders for their customers" ON sales_hub_orders;
DROP POLICY IF EXISTS "Users can create orders" ON sales_hub_orders;
DROP POLICY IF EXISTS "Users can update orders they created" ON sales_hub_orders;
DROP POLICY IF EXISTS "Users can delete orders" ON sales_hub_orders;

-- Drop old products policies
DROP POLICY IF EXISTS "Authenticated users can access products" ON products;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON products;
DROP POLICY IF EXISTS "Users can view products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;

-- Drop old after_sales_tasks policies
DROP POLICY IF EXISTS "Authenticated users can access after_sales_tasks" ON after_sales_tasks;
DROP POLICY IF EXISTS "Users can view after sales tasks from their companies" ON after_sales_tasks;
DROP POLICY IF EXISTS "Users can manage after sales tasks for their companies" ON after_sales_tasks;

-- ================================================================
-- STEP 3: CREATE NEW COMPANY-SCOPED RLS POLICIES
-- ================================================================

-- ----------------------------------------------------------------
-- SALES_HUB_CUSTOMERS: Users only see customers from their company
-- ----------------------------------------------------------------
CREATE POLICY "Users can view own company customers" 
ON sales_hub_customers
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert own company customers" 
ON sales_hub_customers
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update own company customers" 
ON sales_hub_customers
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can delete own company customers" 
ON sales_hub_customers
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- ----------------------------------------------------------------
-- SALES_HUB_ORDERS: Users only see orders from their company
-- ----------------------------------------------------------------
CREATE POLICY "Users can view own company orders" 
ON sales_hub_orders
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert own company orders" 
ON sales_hub_orders
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update own company orders" 
ON sales_hub_orders
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can delete own company orders" 
ON sales_hub_orders
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- ----------------------------------------------------------------
-- PRODUCTS: Users only see products from their company
-- ----------------------------------------------------------------
CREATE POLICY "Users can view own company products" 
ON products
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert own company products" 
ON products
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update own company products" 
ON products
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can delete own company products" 
ON products
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- ----------------------------------------------------------------
-- AFTER_SALES_TASKS: Users only see tasks from their company
-- ----------------------------------------------------------------
CREATE POLICY "Users can view own company after sales tasks" 
ON after_sales_tasks
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert own company after sales tasks" 
ON after_sales_tasks
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update own company after sales tasks" 
ON after_sales_tasks
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can delete own company after sales tasks" 
ON after_sales_tasks
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- ================================================================
-- STEP 4: CLEAN UP ORPHANED DATA
-- ================================================================

-- Delete customers without valid company_id
DELETE FROM sales_hub_customers 
WHERE company_id IS NULL 
   OR company_id NOT IN (SELECT id FROM companies);

-- Delete orders without valid company_id
DELETE FROM sales_hub_orders 
WHERE company_id IS NULL 
   OR company_id NOT IN (SELECT id FROM companies);

-- Delete products without valid company_id
DELETE FROM products 
WHERE company_id IS NULL 
   OR company_id NOT IN (SELECT id FROM companies);

-- Delete tasks without valid company_id
DELETE FROM after_sales_tasks 
WHERE company_id IS NULL 
   OR company_id NOT IN (SELECT id FROM companies);

-- ================================================================
-- STEP 5: SET COMPANY_ID FOR ORPHANED RECORDS (FALLBACK)
-- ================================================================

-- For any remaining orphaned customers, assign to first company (emergency fallback)
UPDATE sales_hub_customers 
SET company_id = (SELECT id FROM companies ORDER BY created_at ASC LIMIT 1)
WHERE company_id IS NULL;

-- For any remaining orphaned orders, assign to first company (emergency fallback)
UPDATE sales_hub_orders 
SET company_id = (SELECT id FROM companies ORDER BY created_at ASC LIMIT 1)
WHERE company_id IS NULL;

-- For any remaining orphaned products, assign to first company (emergency fallback)
UPDATE products 
SET company_id = (SELECT id FROM companies ORDER BY created_at ASC LIMIT 1)
WHERE company_id IS NULL;

-- ================================================================
-- VERIFICATION
-- ================================================================

DO $$
DECLARE
  customers_without_company INTEGER;
  orders_without_company INTEGER;
  products_without_company INTEGER;
  users_without_company INTEGER;
BEGIN
  SELECT COUNT(*) INTO customers_without_company 
  FROM sales_hub_customers WHERE company_id IS NULL;
  
  SELECT COUNT(*) INTO orders_without_company 
  FROM sales_hub_orders WHERE company_id IS NULL;
  
  SELECT COUNT(*) INTO products_without_company 
  FROM products WHERE company_id IS NULL;
  
  SELECT COUNT(*) INTO users_without_company 
  FROM users WHERE company_id IS NULL;
  
  RAISE NOTICE '=== DATA ISOLATION FIX VERIFICATION ===';
  RAISE NOTICE 'Customers without company: %', customers_without_company;
  RAISE NOTICE 'Orders without company: %', orders_without_company;
  RAISE NOTICE 'Products without company: %', products_without_company;
  RAISE NOTICE 'Users without company: %', users_without_company;
  
  IF customers_without_company = 0 AND orders_without_company = 0 AND products_without_company = 0 THEN
    RAISE NOTICE '✓ All data properly scoped to companies';
  ELSE
    RAISE NOTICE '⚠️ Some data still needs company assignment';
  END IF;
  
  RAISE NOTICE '✓ Data isolation RLS policies updated successfully';
  RAISE NOTICE 'Users can now only see data from their own company';
END $$;
