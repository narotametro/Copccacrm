-- ============================================
-- COPCCA CRM - DELETE ALL EXISTING TABLES
-- WARNING: This will delete ALL data!
-- Run this ONLY if you want to start fresh
-- ============================================

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can read companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can access deals" ON deals;
DROP POLICY IF EXISTS "Authenticated users can access after_sales" ON after_sales;
DROP POLICY IF EXISTS "Authenticated users can access debt_collection" ON debt_collection;
DROP POLICY IF EXISTS "Authenticated users can access competitors" ON competitors;
DROP POLICY IF EXISTS "Authenticated users can access sales_strategies" ON sales_strategies;
DROP POLICY IF EXISTS "Authenticated users can access kpi_data" ON kpi_data;
DROP POLICY IF EXISTS "Authenticated users can access interactions" ON interactions;
DROP POLICY IF EXISTS "Authenticated users can access products" ON products;
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitation_links;

-- Drop all tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS kpi_data CASCADE;
DROP TABLE IF EXISTS sales_strategies CASCADE;
DROP TABLE IF EXISTS debt_collection CASCADE;
DROP TABLE IF EXISTS after_sales CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS invitation_links CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
DROP TRIGGER IF EXISTS update_after_sales_updated_at ON after_sales;
DROP TRIGGER IF EXISTS update_debt_collection_updated_at ON debt_collection;
DROP TRIGGER IF EXISTS update_competitors_updated_at ON competitors;
DROP TRIGGER IF EXISTS update_sales_strategies_updated_at ON sales_strategies;
DROP TRIGGER IF EXISTS update_kpi_data_updated_at ON kpi_data;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;

-- Drop the update function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column();

-- ============================================
-- ALL TABLES DELETED!
-- Next: Run the fresh database setup script
-- ============================================
