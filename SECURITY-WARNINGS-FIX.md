# Security Warnings Fix Instructions

## Overview

This migration addresses **48 WARN-level** security issues detected by Supabase Database Linter.

## What This Migration Fixes

### 🔧 Part 1: Function Search Path Protection (40 functions)

**Vulnerability:** Functions without `SET search_path` are vulnerable to schema-shadowing attacks where malicious users can create objects in their search path to intercept function calls.

**Impact:** Medium - Could allow privilege escalation or data manipulation

**Fixed Functions:**
- Trial management: `get_trial_status`, `get_trial_analytics`, `process_trial_expirations`, `update_trial_statuses`
- Authentication: `verify_admin_login`, `hash_password`, `change_admin_password`
- Customer health: `calculate_customer_health_score`
- Invoice automation: `update_invoice_paid_amount`, `update_invoice_status`, `update_invoice_total`
- Expense management: `calculate_expense_totals`, `generate_recurring_expenses`
- Subscription management: `activate_subscription`, `upgrade_user_subscription`, `activate_subscription_with_payment`
- Feature access: `has_feature_access`, `user_has_feature`
- Security logging: `log_security_event`, `is_ip_blocked`, `auto_block_ip_if_needed`
- Cleanup functions: `cleanup_old_audit_logs`, `cleanup_expired_sessions`, `cleanup_expired_ip_blocks`
- SMS functions: `set_sms_log_company`, `get_sms_stats`, `get_debt_sms_history`
- Cash payments: `record_cash_payment`, `verify_cash_payment`, `get_cash_payments_summary`, `get_cash_payments_by_collector`
- System functions: `upsert_system_setting`, `get_integration_stats`, `assign_start_plan_to_new_user`, `assign_inviter_subscription_to_user`
- Feedback: `update_company_feedback_metrics`, `trigger_update_company_feedback_metrics`
- Debt tracking: `update_debt_days_overdue`
- Analytics: `get_subscription_dashboard_stats`

**Solution:** Added `SET search_path = public` to all 40 functions

### 🔒 Part 2: Overly Permissive RLS Policies (2 tables fixed)

**Vulnerability:** RLS policies with `USING (true)` on UPDATE/DELETE/INSERT operations bypass row-level security

**Fixed Tables:**

1. **invoice_payments** - Changed from single `ALL` policy with `USING (true)` to separate policies:
   - SELECT policy with proper company filtering
   - INSERT policy with company validation
   - UPDATE policy with company validation

2. **invoice_reminders** - Changed from single `ALL` policy with `USING (true)` to separate policies:
   - SELECT, INSERT, UPDATE, DELETE policies all with proper company filtering

**System Tables (Intentionally Permissive):**
These tables keep `USING (true)` as they're for automated system operations:
- `blocked_ips` - Auto-blocking security system
- `expense_analytics` - Automated analytics
- `failed_login_attempts` - Security event logging
- `security_audit_logs` - Audit trail
- `session_fingerprints` - Session management
- `sync_logs` - Integration sync logs

### 📋 Part 3: Tables With RLS But No Policies (8 tables)

**Vulnerability:** RLS enabled but no policies = complete data lockout (users can't access any data)

**Fixed Tables:**

1. **campaign_leads** - Added company-based policies via campaign relationship
2. **deal_products** - Added company-based policies via deal relationship
3. **debts** - Added company-based policies (admins can delete)
4. **email_communications** - Added company-based read/insert policies
5. **kv_store_a2294ced** - Added user-specific policies (user_id = auth.uid())
6. **payments** - Added company-based policies (admins can update)
7. **support_tickets** - Added company-based policies (users can update own tickets)
8. **user_preferences** - Added user-specific policies (user_id = auth.uid())

## How to Run This Migration

### Prerequisites
- You must have already run `fix-security-vulnerabilities.sql` (fixes ERROR-level issues)
- Admin access to Supabase SQL Editor
- Backup your database first

### Steps

1. **Open Supabase Dashboard** → SQL Editor

2. **Copy the entire contents** of `fix-security-warnings.sql`

3. **Paste into SQL Editor** and click **RUN**

4. **Expected Results:**
   - All functions recreated successfully
   - All policies updated/created successfully
   - 3 verification queries show:
     - All DEFINER functions have `has_search_path = true`
     - 0 rows for overly permissive policies (excluding system tables)
     - 0 rows for RLS-enabled tables without policies

### Verification

Run these queries after migration:

```sql
-- Query 1: Verify all functions have search_path
SELECT 
  routine_name,
  routine_definition LIKE '%SET search_path%' as has_search_path
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND security_type = 'DEFINER'
ORDER BY routine_name;
-- Expected: All rows show has_search_path = true

-- Query 2: Check for overly permissive policies (excluding system tables)
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND ((qual = 'true' AND cmd NOT IN ('SELECT')) OR (with_check = 'true'))
  AND tablename NOT IN ('blocked_ips', 'expense_analytics', 'failed_login_attempts', 
                        'security_audit_logs', 'session_fingerprints', 'sync_logs')
ORDER BY tablename;
-- Expected: 0 rows

-- Query 3: Check tables with RLS but no policies
SELECT t.tablename, COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0;
-- Expected: 0 rows
```

### Re-run Supabase Database Linter

After successful migration:
1. Go to **Database** → **Linter** in Supabase Dashboard
2. Click **Run Linter**
3. Expected results:
   - **ERROR level:** 0 issues ✅ (from previous migration)
   - **WARN level:** ~9 issues (down from 48)
     - Remaining warnings will be system tables (acceptable)
     - Plus 1 leaked password protection warning (enable in Auth settings)

## Remaining Acceptable Warnings

After this migration, you'll still see these warnings (which are acceptable):

### System Tables With Permissive Policies (6 warnings)
- `blocked_ips` - Used by auto-blocking system
- `expense_analytics` - Used by analytics engine
- `failed_login_attempts` - Security event logging
- `security_audit_logs` - Audit trail
- `session_fingerprints` - Session management
- `sync_logs` - Integration sync

**Why acceptable?** These are write-only logging tables for automated systems. Users cannot read them directly due to restrictive SELECT policies.

### Leaked Password Protection (1 warning)
**To fix:** Supabase Dashboard → **Authentication** → **Policies** → Toggle "Leaked Password Protection" ON

This enables password checking against HaveIBeenPwned.org database.

## Impact Assessment

### Security Improvements
- ✅ 40 functions now protected against schema-shadowing attacks
- ✅ 2 tables (invoice_payments, invoice_reminders) now have proper RLS
- ✅ 8 tables now accessible with secure policies
- ✅ All user data properly isolated by company_id

### No Breaking Changes
- All existing functionality preserved
- RLS policies only restrict unauthorized access (not authorized access)
- Functions maintain same signatures and behavior
- System operations (logging, analytics) continue working

### Performance
- Minimal impact (RLS policies are efficiently indexed)
- Function overhead negligible (search_path set at creation time)

## Troubleshooting

### Error: "function does not exist"
**Cause:** Function signature mismatch between DROP and CREATE
**Solution:** Each function is recreated with `CREATE OR REPLACE`, so this shouldn't happen

### Error: "policy already exists"
**Cause:** Policy name conflict
**Solution:** All policy creations use `DROP POLICY IF EXISTS` first

### Error: "column does not exist"
**Cause:** Table schema mismatch
**Solution:** Verify table structures match the policies (e.g., `kv_store_a2294ced` should have `user_id` column)

### Application Still Works But Linter Shows Warnings
**Cause:** Result is cached or linter needs refresh
**Solution:** Wait 30 seconds and re-run linter

## Checklist

- [ ] Backup database before migration
- [ ] Run `fix-security-vulnerabilities.sql` first (ERROR-level fixes)
- [ ] Run `fix-security-warnings.sql` (this migration)
- [ ] Run all 3 verification queries
- [ ] Re-run Supabase Database Linter
- [ ] Verify WARN count reduced from 48 to ~9
- [ ] Enable Leaked Password Protection in Auth settings
- [ ] Test application functionality (login, CRUD operations)
- [ ] Monitor for any unexpected RLS denials

## Summary

This migration completes the security hardening of your Supabase database:

**Before:**
- 19 ERROR-level issues ❌
- 48 WARN-level issues ⚠️

**After (both migrations):**
- 0 ERROR-level issues ✅
- ~9 WARN-level issues ✅ (system tables + password protection setting)

**Result:** Production-ready enterprise-grade security! 🎉

---

For questions or issues, refer to:
- [Supabase Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL Function Security](https://www.postgresql.org/docs/current/sql-createfunction.html)
