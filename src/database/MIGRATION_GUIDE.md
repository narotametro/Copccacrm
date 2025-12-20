# 🗄️ DATABASE MIGRATION GUIDE

## Overview
This guide will help you migrate from the Key-Value store to a proper PostgreSQL database with well-organized tables, indexes, and Row Level Security.

---

## 📊 NEW DATABASE STRUCTURE

### **11 Core Tables:**

1. **`users`** - User profiles (extends Supabase auth)
2. **`companies`** - Company branding information
3. **`team_memberships`** - Admin-to-member relationships
4. **`invitations`** - Team invitation codes
5. **`after_sales_records`** - Customer follow-up tracking
6. **`competitors`** - Competitor intelligence
7. **`my_products`** - Product catalog
8. **`debt_records`** - Payment collection tracking
9. **`sales_strategies`** - Marketing campaigns
10. **`kpi_records`** - Daily performance metrics
11. **`activities`** - Activity log

### **3 Utility Views:**
- `overdue_debts` - Quick view of overdue payments
- `upcoming_followups` - Upcoming follow-up tasks
- `user_performance` - Performance summary per user

---

## 🚀 MIGRATION STEPS

### **Step 1: Backup Current Data** ⚠️

Before migrating, backup your existing KV store data:

```bash
# This will be handled automatically by the migration script
# But it's good practice to verify your data first
```

### **Step 2: Run the Schema**

Execute the schema in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the entire content from `/database/schema.sql`
4. Click **Run**

✅ This will create all tables, indexes, triggers, and RLS policies.

### **Step 3: Migrate Existing Data**

The system will automatically handle the migration from KV store to PostgreSQL on the first run. The backend will:

1. Check if data exists in the new tables
2. If not, read from KV store
3. Import all data to PostgreSQL
4. Keep KV store as backup (won't delete automatically)

### **Step 4: Verify Migration**

After running the migration, verify your data:

```sql
-- Check user count
SELECT COUNT(*) FROM users;

-- Check after-sales records
SELECT COUNT(*) FROM after_sales_records;

-- Check debt records
SELECT COUNT(*) FROM debt_records;

-- Check all tables
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **Step 5: Update Your Backend**

The backend has been updated to use PostgreSQL instead of KV store. No manual changes needed.

---

## 📋 DATABASE FEATURES

### **1. Automatic Timestamps**
All tables have `created_at` and `updated_at` fields that update automatically.

```sql
-- Triggered on every UPDATE
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **2. Computed Columns**
Some fields calculate automatically:

```sql
-- Debt remaining calculates from total - paid
amount_remaining = amount_total - amount_paid

-- Days overdue calculates from due date
days_overdue = CURRENT_DATE - due_date (if overdue)

-- Profit calculates from revenue - expenses
profit = revenue - expenses
```

### **3. Data Validation**
Built-in constraints ensure data quality:

```sql
-- Status can only be specific values
status TEXT CHECK (status IN ('Pending', 'In Progress', 'Completed'))

-- Satisfaction must be 1-5
satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5)

-- Email must be unique
email TEXT UNIQUE NOT NULL
```

### **4. Row Level Security (RLS)**
Users can only see their own data (or their team's if they're admin):

```sql
-- Users see their own data
CREATE POLICY aftersales_select ON after_sales_records FOR SELECT
    USING (
        user_id = auth.uid()  -- Own data
        OR EXISTS (           -- Or team member's data
            SELECT 1 FROM team_memberships 
            WHERE admin_id = auth.uid() AND member_id = user_id
        )
    );
```

### **5. Indexes for Performance**
All foreign keys and frequently queried fields are indexed:

```sql
CREATE INDEX idx_aftersales_user ON after_sales_records(user_id);
CREATE INDEX idx_aftersales_status ON after_sales_records(status);
CREATE INDEX idx_debt_due_date ON debt_records(due_date);
```

---

## 🔍 USEFUL QUERIES

### **Find Overdue Debts:**
```sql
SELECT * FROM overdue_debts
WHERE user_id = 'your-user-id'
ORDER BY days_overdue DESC
LIMIT 10;
```

### **Get Upcoming Follow-ups:**
```sql
SELECT * FROM upcoming_followups
WHERE user_id = 'your-user-id'
AND date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY date ASC;
```

### **User Performance Summary:**
```sql
SELECT * FROM user_performance
WHERE id = 'your-user-id';
```

### **Monthly Revenue Trend:**
```sql
SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(revenue) as total_revenue,
    SUM(expenses) as total_expenses,
    SUM(profit) as total_profit
FROM kpi_records
WHERE user_id = 'your-user-id'
AND date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY month
ORDER BY month DESC;
```

### **Top Priorities Today:**
```sql
-- After-sales follow-ups due today
SELECT 'After-Sales' as type, customer_name, priority, status
FROM after_sales_records
WHERE user_id = 'your-user-id'
AND follow_up_date = CURRENT_DATE
AND status NOT IN ('Completed', 'Cancelled')

UNION ALL

-- Debt follow-ups due today
SELECT 'Debt Collection' as type, customer_name, priority, status
FROM debt_records
WHERE user_id = 'your-user-id'
AND next_follow_up = CURRENT_DATE
AND status NOT IN ('Paid', 'Written Off')

ORDER BY priority DESC;
```

---

## 🛡️ SECURITY

### **Row Level Security (RLS)**
✅ Enabled on all tables
✅ Users can only access their own data
✅ Admins can access their team's data
✅ Service role can access everything (for backend)

### **Data Isolation**
- Regular users: See only their data
- Admins: See their data + team members' data
- Backend: Uses service role for cross-user operations

### **Authentication**
- All API calls require valid Supabase auth token
- Token verified on every request
- User ID extracted from token (can't be spoofed)

---

## 📈 PERFORMANCE OPTIMIZATIONS

### **Indexes Created:**
- ✅ All foreign keys indexed
- ✅ Status fields indexed (for filtering)
- ✅ Date fields indexed (for sorting)
- ✅ Email indexed (for lookups)
- ✅ User IDs indexed (for joins)

### **Query Performance:**
- Fast lookups by user ID
- Fast filtering by status
- Fast date range queries
- Efficient joins between tables

### **Database Size:**
- Users: ~1KB per record
- After-sales: ~2KB per record
- Debt: ~2KB per record
- Activities: ~500 bytes per record

**Estimated for 1000 users with active data:**
- ~50MB total database size
- Lightning-fast queries (< 10ms)

---

## 🔧 MAINTENANCE

### **Regular Tasks:**

#### **1. Vacuum (Weekly)**
```sql
-- Reclaim storage and update statistics
VACUUM ANALYZE;
```

#### **2. Check Table Sizes (Monthly)**
```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size,
    pg_size_pretty(pg_relation_size('public.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size('public.'||tablename) - pg_relation_size('public.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;
```

#### **3. Archive Old Activities (Quarterly)**
```sql
-- Delete activities older than 1 year
DELETE FROM activities
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
```

#### **4. Update Statistics (Monthly)**
```sql
ANALYZE;
```

---

## 🎯 MIGRATION CHECKLIST

- [ ] Backup current KV store data
- [ ] Run schema.sql in Supabase SQL Editor
- [ ] Verify all 11 tables created
- [ ] Check all indexes created
- [ ] Verify RLS policies enabled
- [ ] Test insert/update/delete operations
- [ ] Verify users can only see their data
- [ ] Test admin can see team data
- [ ] Run performance queries
- [ ] Update backend to use PostgreSQL
- [ ] Deploy and test in production
- [ ] Monitor query performance
- [ ] Set up regular maintenance schedule

---

## ⚠️ IMPORTANT NOTES

### **Do NOT Delete KV Store Yet**
Keep the KV store as backup for at least 30 days after migration. The backend will prioritize PostgreSQL but can fall back to KV if needed.

### **Test Thoroughly**
Test all CRUD operations before going to production:
- Create records
- Read/list records
- Update records
- Delete records
- Filter by status
- Search functionality
- Date range queries

### **Monitor Performance**
After migration, monitor:
- Query execution times
- Database size growth
- Index usage
- Slow query log

---

## 🆘 TROUBLESHOOTING

### **Issue: RLS blocks my queries**
**Solution:** Make sure you're using the service role key for backend operations, not the anon key.

### **Issue: Migration fails**
**Solution:** Check if tables already exist. Drop them first:
```sql
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS kpi_records CASCADE;
-- ... etc
```

### **Issue: Slow queries**
**Solution:** Run ANALYZE and check if indexes are being used:
```sql
EXPLAIN ANALYZE SELECT * FROM after_sales_records WHERE user_id = 'xxx';
```

### **Issue: Can't see data**
**Solution:** Check RLS policies and ensure your auth token is valid.

---

## 📚 NEXT STEPS

After successful migration:

1. ✅ **Monitor Performance** - Check query times
2. ✅ **Set Up Backups** - Enable Supabase auto-backups
3. ✅ **Create Indexes** - Add custom indexes if needed
4. ✅ **Optimize Queries** - Use EXPLAIN ANALYZE
5. ✅ **Document Changes** - Keep this guide updated

---

## 🎉 BENEFITS OF NEW DATABASE

### **Before (KV Store):**
- ❌ No relationships between data
- ❌ No data validation
- ❌ No indexes for performance
- ❌ No query flexibility
- ❌ Limited search capabilities
- ❌ No automatic timestamps
- ❌ No computed fields

### **After (PostgreSQL):**
- ✅ Proper relationships with foreign keys
- ✅ Data validation with constraints
- ✅ Fast queries with indexes
- ✅ Full SQL query power
- ✅ Advanced search and filtering
- ✅ Automatic timestamps and triggers
- ✅ Computed fields (profit, days overdue, etc.)
- ✅ Row Level Security
- ✅ Utility views for common queries
- ✅ Well-documented schema

**Your database is now production-ready, scalable, and maintainable!** 🚀
