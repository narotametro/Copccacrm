-- ============================================
-- POCKET CRM - USEFUL QUERIES
-- ============================================
-- Collection of common and useful SQL queries
-- ============================================

-- ============================================
-- 1. USER MANAGEMENT
-- ============================================

-- Get all users with their stats
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.status,
    COUNT(DISTINCT a.id) as after_sales_count,
    COUNT(DISTINCT c.id) as competitor_count,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT d.id) as debt_count,
    COUNT(DISTINCT s.id) as strategy_count,
    COALESCE(SUM(d.amount_remaining), 0) as total_outstanding
FROM users u
LEFT JOIN after_sales_records a ON u.id = a.user_id
LEFT JOIN competitors c ON u.id = c.user_id
LEFT JOIN my_products p ON u.id = p.user_id
LEFT JOIN debt_records d ON u.id = d.user_id AND d.status NOT IN ('Paid', 'Written Off')
LEFT JOIN sales_strategies s ON u.id = s.user_id
GROUP BY u.id, u.name, u.email, u.role, u.status
ORDER BY u.created_at DESC;

-- Get admin's team members
SELECT 
    u.id,
    u.name,
    u.email,
    u.status,
    tm.joined_at
FROM team_memberships tm
JOIN users u ON tm.member_id = u.id
WHERE tm.admin_id = 'your-admin-id'
ORDER BY tm.joined_at DESC;

-- ============================================
-- 2. DASHBOARD OVERVIEW
-- ============================================

-- Get today's overview for a user
SELECT 
    -- After-sales stats
    COUNT(DISTINCT CASE WHEN a.follow_up_date = CURRENT_DATE THEN a.id END) as followups_today,
    COUNT(DISTINCT CASE WHEN a.status = 'Pending' THEN a.id END) as pending_followups,
    
    -- Debt stats
    COUNT(DISTINCT CASE WHEN d.next_follow_up = CURRENT_DATE THEN d.id END) as debt_followups_today,
    COUNT(DISTINCT CASE WHEN d.status = 'Overdue' THEN d.id END) as overdue_debts,
    COALESCE(SUM(CASE WHEN d.status != 'Paid' THEN d.amount_remaining END), 0) as total_outstanding,
    
    -- Strategy stats
    COUNT(DISTINCT CASE WHEN s.status = 'In Progress' THEN s.id END) as active_strategies,
    
    -- Recent activity
    COUNT(DISTINCT CASE WHEN act.created_at >= CURRENT_DATE THEN act.id END) as activities_today
    
FROM users u
LEFT JOIN after_sales_records a ON u.id = a.user_id
LEFT JOIN debt_records d ON u.id = d.user_id
LEFT JOIN sales_strategies s ON u.id = s.user_id
LEFT JOIN activities act ON u.id = act.user_id
WHERE u.id = 'your-user-id';

-- ============================================
-- 3. AFTER-SALES QUERIES
-- ============================================

-- Get pending follow-ups (high priority first)
SELECT 
    customer_name,
    customer_phone,
    product,
    follow_up_date,
    status,
    priority,
    CURRENT_DATE - follow_up_date as days_overdue
FROM after_sales_records
WHERE user_id = 'your-user-id'
AND status NOT IN ('Completed', 'Cancelled')
AND follow_up_date IS NOT NULL
ORDER BY priority DESC, follow_up_date ASC
LIMIT 20;

-- Get satisfaction trends
SELECT 
    DATE_TRUNC('month', purchase_date) as month,
    AVG(satisfaction_score) as avg_satisfaction,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN satisfaction_score >= 4 THEN 1 END) as satisfied_customers
FROM after_sales_records
WHERE user_id = 'your-user-id'
AND satisfaction_score IS NOT NULL
AND purchase_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY month
ORDER BY month DESC;

-- ============================================
-- 4. COMPETITOR ANALYSIS
-- ============================================

-- Get competitors by threat level
SELECT 
    threat_level,
    COUNT(*) as count,
    ARRAY_AGG(name ORDER BY name) as competitors
FROM competitors
WHERE user_id = 'your-user-id'
GROUP BY threat_level
ORDER BY 
    CASE threat_level
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
    END;

-- Get competitor comparison
SELECT 
    name,
    threat_level,
    market_share,
    strengths,
    weaknesses,
    last_analyzed_date
FROM competitors
WHERE user_id = 'your-user-id'
ORDER BY 
    CASE threat_level
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
    END,
    market_share DESC NULLS LAST;

-- ============================================
-- 5. DEBT COLLECTION
-- ============================================

-- Get all overdue debts (prioritized)
SELECT 
    customer_name,
    customer_phone,
    invoice_number,
    amount_total,
    amount_paid,
    amount_remaining,
    due_date,
    days_overdue,
    priority,
    status
FROM debt_records
WHERE user_id = 'your-user-id'
AND status IN ('Pending', 'Partially Paid', 'Overdue')
AND due_date < CURRENT_DATE
ORDER BY 
    CASE priority
        WHEN 'Urgent' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
    END,
    days_overdue DESC,
    amount_remaining DESC;

-- Get debt collection summary
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount_total) as total_amount,
    SUM(amount_paid) as paid_amount,
    SUM(amount_remaining) as remaining_amount,
    AVG(days_overdue) as avg_days_overdue
FROM debt_records
WHERE user_id = 'your-user-id'
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'Overdue' THEN 1
        WHEN 'Pending' THEN 2
        WHEN 'Partially Paid' THEN 3
        WHEN 'Paid' THEN 4
        WHEN 'Written Off' THEN 5
    END;

-- Get payment history (monthly)
SELECT 
    DATE_TRUNC('month', updated_at) as month,
    COUNT(*) as payments_count,
    SUM(amount_paid) as total_collected
FROM debt_records
WHERE user_id = 'your-user-id'
AND amount_paid > 0
AND updated_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY month
ORDER BY month DESC;

-- ============================================
-- 6. SALES STRATEGIES
-- ============================================

-- Get active strategies with ROI
SELECT 
    title,
    category,
    status,
    budget,
    expected_roi,
    actual_roi,
    start_date,
    end_date,
    CASE 
        WHEN actual_roi IS NOT NULL AND expected_roi IS NOT NULL 
        THEN actual_roi - expected_roi 
    END as roi_variance
FROM sales_strategies
WHERE user_id = 'your-user-id'
AND status = 'In Progress'
ORDER BY priority DESC, start_date DESC;

-- Get strategy performance by category
SELECT 
    category,
    COUNT(*) as total_strategies,
    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
    AVG(budget) as avg_budget,
    AVG(actual_roi) as avg_roi
FROM sales_strategies
WHERE user_id = 'your-user-id'
GROUP BY category
ORDER BY avg_roi DESC NULLS LAST;

-- ============================================
-- 7. KPI TRACKING
-- ============================================

-- Get monthly KPI summary
SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(revenue) as total_revenue,
    SUM(expenses) as total_expenses,
    SUM(profit) as total_profit,
    AVG(profit) as avg_daily_profit,
    SUM(sales_count) as total_sales,
    SUM(new_customers) as total_new_customers,
    AVG(customer_satisfaction) as avg_satisfaction,
    AVG(conversion_rate) as avg_conversion,
    AVG(churn_rate) as avg_churn
FROM kpi_records
WHERE user_id = 'your-user-id'
AND date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY month
ORDER BY month DESC;

-- Get current month performance
SELECT 
    SUM(revenue) as mtd_revenue,
    SUM(expenses) as mtd_expenses,
    SUM(profit) as mtd_profit,
    SUM(sales_count) as mtd_sales,
    SUM(new_customers) as mtd_new_customers,
    AVG(customer_satisfaction) as avg_satisfaction
FROM kpi_records
WHERE user_id = 'your-user-id'
AND date >= DATE_TRUNC('month', CURRENT_DATE);

-- Compare this month vs last month
WITH this_month AS (
    SELECT 
        SUM(revenue) as revenue,
        SUM(profit) as profit,
        SUM(sales_count) as sales
    FROM kpi_records
    WHERE user_id = 'your-user-id'
    AND date >= DATE_TRUNC('month', CURRENT_DATE)
),
last_month AS (
    SELECT 
        SUM(revenue) as revenue,
        SUM(profit) as profit,
        SUM(sales_count) as sales
    FROM kpi_records
    WHERE user_id = 'your-user-id'
    AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND date < DATE_TRUNC('month', CURRENT_DATE)
)
SELECT 
    tm.revenue as this_month_revenue,
    lm.revenue as last_month_revenue,
    ROUND(((tm.revenue - lm.revenue) / NULLIF(lm.revenue, 0) * 100)::numeric, 2) as revenue_growth_pct,
    tm.profit as this_month_profit,
    lm.profit as last_month_profit,
    ROUND(((tm.profit - lm.profit) / NULLIF(lm.profit, 0) * 100)::numeric, 2) as profit_growth_pct,
    tm.sales as this_month_sales,
    lm.sales as last_month_sales
FROM this_month tm, last_month lm;

-- ============================================
-- 8. ACTIVITY LOG
-- ============================================

-- Get recent activities (last 7 days)
SELECT 
    type,
    action,
    entity_type,
    entity_name,
    description,
    created_at
FROM activities
WHERE user_id = 'your-user-id'
AND created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 50;

-- Get activity summary by type
SELECT 
    type,
    action,
    COUNT(*) as count,
    MAX(created_at) as last_activity
FROM activities
WHERE user_id = 'your-user-id'
AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY type, action
ORDER BY count DESC;

-- ============================================
-- 9. REPORTS & ANALYTICS
-- ============================================

-- Get comprehensive user report
WITH user_stats AS (
    SELECT 
        COUNT(DISTINCT a.id) as total_customers,
        COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.id END) as completed_followups,
        AVG(a.satisfaction_score) as avg_satisfaction
    FROM after_sales_records a
    WHERE a.user_id = 'your-user-id'
),
debt_stats AS (
    SELECT 
        COUNT(*) as total_debts,
        SUM(amount_remaining) as outstanding_amount,
        COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as overdue_count
    FROM debt_records
    WHERE user_id = 'your-user-id'
    AND status NOT IN ('Paid', 'Written Off')
),
kpi_stats AS (
    SELECT 
        SUM(revenue) as total_revenue,
        SUM(profit) as total_profit
    FROM kpi_records
    WHERE user_id = 'your-user-id'
    AND date >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT 
    u.name,
    u.email,
    u.role,
    us.*,
    ds.*,
    ks.*
FROM users u
CROSS JOIN user_stats us
CROSS JOIN debt_stats ds
CROSS JOIN kpi_stats ks
WHERE u.id = 'your-user-id';

-- Get top customers by revenue (requires linking to KPI data)
SELECT 
    customer_name,
    COUNT(*) as total_interactions,
    MAX(purchase_date) as last_purchase,
    AVG(satisfaction_score) as avg_satisfaction
FROM after_sales_records
WHERE user_id = 'your-user-id'
GROUP BY customer_name
ORDER BY total_interactions DESC, last_purchase DESC
LIMIT 10;

-- ============================================
-- 10. SEARCH & FILTERS
-- ============================================

-- Full-text search across after-sales
SELECT 
    customer_name,
    customer_email,
    product,
    status,
    priority
FROM after_sales_records
WHERE user_id = 'your-user-id'
AND (
    customer_name ILIKE '%search_term%'
    OR customer_email ILIKE '%search_term%'
    OR product ILIKE '%search_term%'
    OR notes ILIKE '%search_term%'
)
ORDER BY 
    CASE priority
        WHEN 'Urgent' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
    END;

-- Search by tags
SELECT *
FROM after_sales_records
WHERE user_id = 'your-user-id'
AND 'urgent' = ANY(tags);

-- ============================================
-- 11. MAINTENANCE QUERIES
-- ============================================

-- Check database size
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Vacuum statistics
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY last_autovacuum DESC NULLS LAST;

-- ============================================
-- 12. ADMIN QUERIES
-- ============================================

-- Get all users activity summary (admin only)
SELECT 
    u.name,
    u.email,
    u.status,
    COUNT(DISTINCT a.id) as total_activities,
    MAX(a.created_at) as last_activity,
    COUNT(DISTINCT asr.id) as after_sales_count,
    COUNT(DISTINCT dr.id) as debt_count
FROM users u
LEFT JOIN activities a ON u.id = a.user_id
LEFT JOIN after_sales_records asr ON u.id = asr.user_id
LEFT JOIN debt_records dr ON u.id = dr.user_id
GROUP BY u.id, u.name, u.email, u.status
ORDER BY last_activity DESC NULLS LAST;

-- Get system-wide stats
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
    (SELECT COUNT(*) FROM after_sales_records) as total_after_sales,
    (SELECT COUNT(*) FROM debt_records) as total_debts,
    (SELECT SUM(amount_remaining) FROM debt_records WHERE status NOT IN ('Paid', 'Written Off')) as total_outstanding,
    (SELECT COUNT(*) FROM activities WHERE created_at >= CURRENT_DATE) as activities_today;

-- ============================================
-- END OF QUERIES
-- ============================================
