-- ===========================================
-- VERIFICATION QUERIES
-- Check if subscription system is properly set up
-- ===========================================

-- Check if subscription plans were created
SELECT name, display_name, price_monthly, currency FROM subscription_plans ORDER BY price_monthly;

-- Check if functions were created
SELECT proname, pg_get_function_identity_arguments(oid) as args
FROM pg_proc
WHERE proname IN ('has_feature_access', 'get_user_subscription', 'get_current_usage')
ORDER BY proname;

-- Check if tables were created
SELECT tablename
FROM pg_tables
WHERE tablename IN ('subscription_plans', 'user_subscriptions', 'subscription_payments', 'feature_usage', 'pos_locations', 'inventory_locations')
ORDER BY tablename;

-- ===========================================
-- TEST USAGE COUNTING
-- ===========================================

-- Test usage counting for admin user (replace with actual user UUID)
-- SELECT * FROM get_current_usage('ced0ef52-5592-4fb1-895c-d5182b121a12');

-- ===========================================
-- ADD SAMPLE DATA FOR TESTING
-- ===========================================

-- Add a sample POS location for testing (replace user UUID)
-- INSERT INTO pos_locations (name, address, city, created_by, company_id)
-- VALUES ('Main Store', '123 Main St', 'Dar es Salaam', 'ced0ef52-5592-4fb1-895c-d5182b121a12', (SELECT company_id FROM users WHERE id = 'ced0ef52-5592-4fb1-895c-d5182b121a12'));

-- Add a sample inventory location for testing (replace user UUID)
-- INSERT INTO inventory_locations (name, address, city, type, created_by, company_id)
-- VALUES ('Main Warehouse', '456 Warehouse Rd', 'Dar es Salaam', 'warehouse', 'ced0ef52-5592-4fb1-895c-d5182b121a12', (SELECT company_id FROM users WHERE id = 'ced0ef52-5592-4fb1-895c-d5182b121a12'));