-- ============================================
-- COPCCA CRM - REMOVE ALL DEMO DATA
-- This script removes all demo/test data from tables
-- while preserving the database schema and structure
-- ============================================

-- Clear main business tables
DELETE FROM sales_hub_orders;
DELETE FROM sales_hub_customers;
DELETE FROM deals;
DELETE FROM invoices;
DELETE FROM after_sales;
DELETE FROM debt_collection;
DELETE FROM competitors;
DELETE FROM sales_strategies;
DELETE FROM kpi_data;
DELETE FROM interactions;
DELETE FROM products;
DELETE FROM companies;
DELETE FROM user_permissions;
DELETE FROM invitation_links;
DELETE FROM notifications;
DELETE FROM feedback;
DELETE FROM marketing_campaigns;
DELETE FROM marketing_budgets;
DELETE FROM marketing_kpis;
DELETE FROM stock_history;
DELETE FROM system_settings;

-- Clear user data but keep the admin user (if exists)
-- Note: This keeps users with admin role, adjust as needed
DELETE FROM users WHERE role != 'admin';

-- Reset sequences if they exist
-- ALTER SEQUENCE IF EXISTS deals_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS companies_id_seq RESTART WITH 1;
-- Add other sequences as needed

-- Optional: Clean up any orphaned records or reset auto-increment counters
-- This ensures clean state for production use

COMMIT;

-- Verification: Count records in each table
SELECT
  'companies' as table_name, COUNT(*) as record_count FROM companies
UNION ALL
SELECT 'deals', COUNT(*) FROM deals
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'sales_hub_customers', COUNT(*) FROM sales_hub_customers
UNION ALL
SELECT 'sales_hub_orders', COUNT(*) FROM sales_hub_orders
ORDER BY table_name;