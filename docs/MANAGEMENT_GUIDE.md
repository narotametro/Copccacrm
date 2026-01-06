# 📊 Pocket CRM - Management & Operations Guide

## Quick Access Dashboard

### 🔗 Important URLs

```
Production URLs:
├── Frontend:     https://[your-app].azurestaticapps.net
├── Backend API:  https://[project-id].supabase.co/functions/v1/make-server-a2294ced
└── Database:     Supabase Dashboard

Management Portals:
├── Azure Portal:      https://portal.azure.com
├── Supabase Dashboard: https://app.supabase.com
├── GitHub Actions:    https://github.com/[username]/pocket-crm/actions
└── Domain Registrar:  [Your DNS provider]

Monitoring:
├── Azure Insights:    [App Insights URL]
├── Supabase Logs:     [Supabase Project]/logs
└── Uptime Monitor:    [If configured]
```

---

## 🎛️ Daily Operations

### Morning Health Check (5 minutes)

```bash
# 1. Check Azure app status
az staticwebapp show \
  --name pocket-crm-app \
  --resource-group pocket-crm-rg \
  --query "{name:name, status:provisioningState, url:defaultHostname}"

# 2. Check recent deployments
az staticwebapp show \
  --name pocket-crm-app \
  --resource-group pocket-crm-rg \
  --query "builds[0].{status:status, started:createdTimeUtc}"

# 3. Test frontend is responding
curl -I https://your-app.azurestaticapps.net

# 4. Check Supabase Edge Function
curl https://[project-id].supabase.co/functions/v1/make-server-a2294ced/health
```

### Key Metrics Dashboard

| Metric | Check Location | Healthy Range | Action Threshold |
|--------|----------------|---------------|------------------|
| **Response Time** | Azure Insights | < 2s | > 5s → Investigate |
| **Error Rate** | Azure Insights | < 1% | > 5% → Alert team |
| **Active Users** | Supabase Auth | - | Monitor trends |
| **API Calls** | Supabase Dashboard | - | < 80% quota |
| **Database Size** | Supabase Storage | - | < 80% quota |
| **Build Status** | GitHub Actions | ✅ Passing | ❌ → Check logs |

---

## 🚨 Incident Response

### Quick Troubleshooting Guide

#### ⚠️ Frontend Down (Users can't access the site)

**Symptoms:**
- Users report "Site can't be reached"
- No response from frontend URL

**Diagnosis:**
```bash
# 1. Check if Azure app is running
az staticwebapp show --name pocket-crm-app --resource-group pocket-crm-rg

# 2. Check recent deployments
gh run list --limit 5  # If you have GitHub CLI

# 3. Check DNS resolution
nslookup your-app.azurestaticapps.net

# 4. Check SSL certificate
curl -vI https://your-app.azurestaticapps.net 2>&1 | grep -i "certificate"
```

**Solutions:**
```bash
# Solution 1: Trigger redeployment
git commit --allow-empty -m "Trigger redeployment"
git push origin main

# Solution 2: Restart via Azure Portal
# Portal → Static Web App → Overview → Restart

# Solution 3: Check Azure service status
# https://status.azure.com
```

**Escalation:** If issue persists > 15 minutes, contact Azure support.

---

#### ⚠️ Authentication Issues (Users can't login)

**Symptoms:**
- Login fails with timeout
- "Invalid credentials" for known-good passwords
- Social login redirects fail

**Diagnosis:**
```bash
# 1. Check Supabase Auth service
curl https://[project-id].supabase.co/auth/v1/health

# 2. Test login from backend
curl -X POST https://[project-id].supabase.co/auth/v1/token \
  -H "apikey: [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 3. Check CORS configuration
# Supabase Dashboard → Project Settings → API → Allowed Origins
```

**Solutions:**
1. **CORS Error:**
   - Add your domain to Supabase allowed origins
   - Include: `https://your-domain.com`, `https://your-app.azurestaticapps.net`

2. **Email Not Confirmed:**
   - Supabase Dashboard → Authentication → Users
   - Find user → Mark email as confirmed

3. **Rate Limiting:**
   - Check Supabase quotas
   - Upgrade plan if needed

**Escalation:** Check Supabase status: https://status.supabase.com

---

#### ⚠️ Backend API Errors (500 errors)

**Symptoms:**
- Network tab shows 500 errors
- Data not loading in frontend
- "Failed to fetch" errors

**Diagnosis:**
```bash
# 1. Check Edge Function logs
supabase functions logs make-server-a2294ced --project-ref [ref]

# Or via curl:
curl https://[project-id].supabase.co/functions/v1/make-server-a2294ced/health \
  -H "Authorization: Bearer [anon-key]"

# 2. Check database connection
# Supabase Dashboard → Database → Health

# 3. Check function deployment status
supabase functions list --project-ref [ref]
```

**Solutions:**
```bash
# Solution 1: Redeploy Edge Function
supabase functions deploy make-server-a2294ced --project-ref [ref]

# Solution 2: Check environment variables
supabase secrets list --project-ref [ref]

# Solution 3: Review recent code changes
git log --oneline -10

# Solution 4: Rollback if needed
git revert HEAD
git push origin main
```

---

#### ⚠️ Database Issues (Data not saving)

**Symptoms:**
- Changes not persisting
- "Transaction timeout" errors
- Slow queries

**Diagnosis:**
```sql
-- In Supabase SQL Editor

-- 1. Check table size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename = 'kv_store_a2294ced';

-- 2. Check for locks
SELECT * FROM pg_stat_activity 
WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%';

-- 3. Check connection count
SELECT count(*) FROM pg_stat_activity;

-- 4. Check recent errors
SELECT * FROM kv_store_a2294ced 
ORDER BY updated_at DESC 
LIMIT 10;
```

**Solutions:**
```sql
-- Solution 1: Kill long-running queries
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle in transaction' 
  AND state_change < current_timestamp - INTERVAL '5 minutes';

-- Solution 2: Clear old data (if needed)
DELETE FROM kv_store_a2294ced 
WHERE created_at < NOW() - INTERVAL '90 days' 
  AND key LIKE 'temp_%';

-- Solution 3: Vacuum database
VACUUM ANALYZE kv_store_a2294ced;
```

---

#### ⚠️ High Costs (Unexpected billing)

**Symptoms:**
- Higher than expected Azure/Supabase bill
- Quota warnings

**Diagnosis:**
```bash
# Check Azure costs
az consumption usage list \
  --resource-group pocket-crm-rg \
  --start-date 2024-12-01 \
  --end-date 2024-12-31

# Check Supabase usage
# Dashboard → Usage & Billing → Current Period
```

**Immediate Actions:**
```bash
# 1. Identify the cost driver
# Azure Portal → Cost Management → Cost Analysis
# Group by: Resource

# 2. Check for runaway processes
# Supabase → Database → Connections
# Look for: High connection count, long queries

# 3. Enable caching (if not already)
# Add cache headers to static assets

# 4. Review API call patterns
# Supabase → Logs → Filter by high-frequency endpoints
```

**Cost Optimization Checklist:**
- [ ] Enable browser caching for static assets
- [ ] Implement request debouncing in frontend
- [ ] Add pagination to large data queries
- [ ] Enable Supabase connection pooling
- [ ] Review and optimize database queries
- [ ] Set up budget alerts

---

## 🔧 Common Maintenance Tasks

### 1. Deploy a Hotfix

```bash
# 1. Create hotfix branch
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Make the fix
# Edit files...

# 3. Test locally
npm run build
npm run preview

# 4. Commit and push
git add .
git commit -m "fix: critical bug in authentication"
git push origin hotfix/critical-bug

# 5. Merge to main (triggers auto-deployment)
gh pr create --title "Hotfix: Critical Bug" --body "Fixes critical authentication issue"
gh pr merge --auto --squash

# 6. Monitor deployment
# GitHub → Actions → Watch deployment
```

### 2. Update Environment Variables

```bash
# Update in Azure
az staticwebapp appsettings set \
  --name pocket-crm-app \
  --resource-group pocket-crm-rg \
  --setting-names \
    NEW_VARIABLE=value

# Update Supabase secrets
supabase secrets set NEW_SECRET=value --project-ref [ref]

# Verify
az staticwebapp appsettings list --name pocket-crm-app --resource-group pocket-crm-rg
supabase secrets list --project-ref [ref]

# Trigger redeployment to pick up new values
git commit --allow-empty -m "Update environment variables"
git push origin main
```

### 3. Database Backup & Restore

```bash
# Automatic backups are handled by Supabase
# View backups: Supabase Dashboard → Database → Backups

# Manual backup:
supabase db dump --project-ref [ref] > backup-$(date +%Y%m%d).sql

# Restore from backup:
# 1. Create new Supabase project
# 2. Run: supabase db push --project-ref [new-ref] < backup-20241202.sql

# Export specific table:
supabase db dump --project-ref [ref] --table kv_store_a2294ced > kv_backup.sql
```

### 4. Scale Up/Down Resources

```bash
# Azure Static Web Apps - Change plan
az staticwebapp update \
  --name pocket-crm-app \
  --resource-group pocket-crm-rg \
  --sku Standard  # or Free

# Supabase - Upgrade via dashboard
# Dashboard → Settings → Billing → Change Plan

# Scale database (Supabase Pro only)
# Dashboard → Database → Settings → Compute
```

### 5. Add/Remove Users

```bash
# Add admin user via Supabase Dashboard:
# 1. Authentication → Users → Invite User
# 2. After signup, update user metadata:

-- Run in SQL Editor:
UPDATE auth.users 
SET raw_user_meta_data = 
  jsonb_set(raw_user_meta_data, '{role}', '"admin"')
WHERE email = 'admin@example.com';

# Remove user:
# Authentication → Users → Find user → Delete

# Bulk operations:
-- Disable inactive users (SQL):
UPDATE auth.users 
SET banned_until = NOW() + INTERVAL '30 days'
WHERE last_sign_in_at < NOW() - INTERVAL '180 days';
```

### 6. View and Analyze Logs

```bash
# Azure Static Web Apps logs (limited)
az staticwebapp show \
  --name pocket-crm-app \
  --resource-group pocket-crm-rg \
  --query "builds[0:5].{id:buildId, status:status, time:createdTimeUtc}"

# Supabase Edge Function logs
supabase functions logs make-server-a2294ced \
  --project-ref [ref] \
  --limit 100

# Filter for errors
supabase functions logs make-server-a2294ced \
  --project-ref [ref] \
  | grep -i "error"

# Export logs for analysis
supabase functions logs make-server-a2294ced \
  --project-ref [ref] \
  --limit 1000 > logs-$(date +%Y%m%d).txt
```

---

## 📈 Performance Optimization

### Frontend Performance Checklist

```bash
# 1. Run Lighthouse audit
npx lighthouse https://your-domain.com --view

# 2. Analyze bundle size
npm run build -- --analyze

# 3. Check for unused dependencies
npx depcheck

# 4. Optimize images (if manually added)
# Use: https://squoosh.app or imagemin

# 5. Review network calls
# Open DevTools → Network → Record page load
# Look for: Duplicate calls, slow endpoints, large payloads
```

### Backend Performance Checklist

```sql
-- 1. Identify slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 2. Add missing indexes
CREATE INDEX IF NOT EXISTS idx_kv_store_user_id 
ON kv_store_a2294ced(user_id);

CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix 
ON kv_store_a2294ced(key text_pattern_ops);

-- 3. Analyze table statistics
ANALYZE kv_store_a2294ced;

-- 4. Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'kv_store_a2294ced';
```

### Caching Strategy

```typescript
// Add to frontend (if not already present)
// /lib/cache.ts
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const cache = new Map<string, { data: any; timestamp: number }>();

export const getCached = (key: string) => {
  const item = cache.get(key);
  if (!item) return null;
  
  const isExpired = Date.now() - item.timestamp > CACHE_DURATION;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
};

export const setCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};
```

---

## 🔒 Security Management

### Security Checklist (Monthly)

- [ ] **Rotate API Keys**
  ```bash
  # Generate new Supabase keys
  # Dashboard → Settings → API → Generate New Keys
  # Update in Azure & GitHub Secrets
  ```

- [ ] **Review User Access**
  ```sql
  -- Check admin users
  SELECT id, email, raw_user_meta_data->>'role' as role, created_at
  FROM auth.users
  WHERE raw_user_meta_data->>'role' = 'admin';
  
  -- Check inactive users
  SELECT email, last_sign_in_at
  FROM auth.users
  WHERE last_sign_in_at < NOW() - INTERVAL '90 days';
  ```

- [ ] **Check Failed Login Attempts**
  ```bash
  # Supabase Dashboard → Logs → Filter: "authentication failed"
  # Look for: Unusual patterns, brute force attempts
  ```

- [ ] **Update Dependencies**
  ```bash
  # Check for vulnerabilities
  npm audit
  
  # Fix automatically
  npm audit fix
  
  # Update all packages
  npm update
  
  # Check outdated packages
  npm outdated
  ```

- [ ] **Review CORS Settings**
  ```bash
  # Supabase Dashboard → Project Settings → API
  # Allowed Origins should only include:
  # - Your production domain
  # - Your Azure Static Web Apps domain
  # Remove any old/test domains
  ```

- [ ] **Check SSL Certificate**
  ```bash
  # Azure manages this automatically
  # Verify it's working:
  curl -vI https://your-domain.com 2>&1 | grep "SSL certificate"
  ```

---

## 📊 Monitoring & Alerts Setup

### Set Up Azure Alerts

```bash
# 1. Create action group (for notifications)
az monitor action-group create \
  --name "pocket-crm-alerts" \
  --resource-group pocket-crm-rg \
  --short-name "pcrm" \
  --email-receiver "Admin" "admin@your-company.com"

# 2. Create alert rule for high error rate
az monitor metrics alert create \
  --name "high-error-rate" \
  --resource-group pocket-crm-rg \
  --scopes /subscriptions/[id]/resourceGroups/pocket-crm-rg/providers/Microsoft.Web/staticSites/pocket-crm-app \
  --condition "count Http5xx > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "pocket-crm-alerts"
```

### Set Up Supabase Alerts

1. **Go to:** Supabase Dashboard → Project Settings → Notifications
2. **Enable alerts for:**
   - High database CPU (> 80%)
   - High API request rate (> 80% of quota)
   - Storage nearly full (> 80%)
   - Long-running queries (> 30s)

### Custom Monitoring Script

```bash
#!/bin/bash
# /scripts/health-check.sh

# Run this as a cron job (every 5 minutes)
# crontab -e
# */5 * * * * /path/to/health-check.sh

FRONTEND_URL="https://your-app.azurestaticapps.net"
API_URL="https://[project].supabase.co/functions/v1/make-server-a2294ced/health"
ALERT_EMAIL="admin@your-company.com"

# Check frontend
if ! curl -sf "$FRONTEND_URL" > /dev/null; then
  echo "ALERT: Frontend is down!" | mail -s "Pocket CRM Alert" "$ALERT_EMAIL"
fi

# Check backend
if ! curl -sf "$API_URL" > /dev/null; then
  echo "ALERT: Backend API is down!" | mail -s "Pocket CRM Alert" "$ALERT_EMAIL"
fi
```

---

## 📝 Change Management

### Release Process

```
1. Development
   ├── Create feature branch: git checkout -b feature/new-feature
   ├── Develop & test locally
   └── Push: git push origin feature/new-feature

2. Code Review
   ├── Create PR: gh pr create
   ├── Request review from team
   ├── Address feedback
   └── Get approval

3. Staging (Optional)
   ├── Merge to staging branch
   ├── Deploy to staging environment
   └── QA testing

4. Production
   ├── Merge PR to main
   ├── Auto-deploy via GitHub Actions
   ├── Monitor deployment
   └── Verify in production

5. Post-Deployment
   ├── Monitor error rates
   ├── Check performance metrics
   └── Update documentation
```

### Rollback Procedure

```bash
# Option 1: Revert last commit
git revert HEAD
git push origin main

# Option 2: Revert to specific commit
git revert abc123
git push origin main

# Option 3: Emergency rollback (manual)
# 1. Find last good build: GitHub → Actions
# 2. Re-run that workflow
# 3. Or: Redeploy from that commit
git checkout abc123  # Last good commit
git push --force origin main  # ⚠️ Use with caution
```

---

## 💰 Cost Management

### Monthly Cost Breakdown

```
Expected Costs (Production):
├── Azure Static Web Apps
│   ├── Free Tier: $0/month (100GB bandwidth)
│   └── Standard Tier: $9/month (unlimited)
│
├── Supabase
│   ├── Free Tier: $0/month
│   │   ├── 500MB database
│   │   ├── 1GB file storage
│   │   └── 2GB bandwidth
│   └── Pro Tier: $25/month
│       ├── 8GB database
│       ├── 100GB file storage
│       └── 50GB bandwidth
│
└── Domain (Optional)
    └── ~$12/year

Total: $0-34/month + domain
```

### Cost Optimization Tips

1. **Use Free Tiers** for development/staging
2. **Enable caching** to reduce API calls
3. **Optimize images** before upload
4. **Clean up old data** regularly
5. **Monitor usage** weekly
6. **Set budget alerts** in Azure

```bash
# Set budget alert
az consumption budget create \
  --budget-name pocket-crm-budget \
  --amount 50 \
  --time-grain Monthly \
  --start-date 2024-12-01 \
  --end-date 2025-12-31 \
  --resource-group pocket-crm-rg
```

---

## 📞 Support Contacts

### Internal Team
```
DevOps Lead:    [Name] - [Email] - [Phone]
Backend Dev:    [Name] - [Email] - [Phone]
Frontend Dev:   [Name] - [Email] - [Phone]
On-Call:        [Current on-call engineer]
```

### External Support
```
Azure Support:     https://azure.microsoft.com/support/
                   Ticket System: Azure Portal → Help + Support

Supabase Support:  support@supabase.io (Pro plan)
                   Discord: https://discord.supabase.com

GitHub Support:    https://support.github.com
                   Status: https://www.githubstatus.com
```

### Escalation Matrix

| Severity | Response Time | Who to Contact |
|----------|--------------|----------------|
| Critical (Site down) | 15 min | On-Call Engineer → DevOps Lead |
| High (Major feature broken) | 2 hours | DevOps Lead |
| Medium (Minor bug) | 1 business day | Product Team |
| Low (Enhancement) | Next sprint | Product Backlog |

---

## 📚 Additional Resources

### Documentation
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

### Monitoring Tools
- [Azure Status](https://status.azure.com)
- [Supabase Status](https://status.supabase.com)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

### Learning Resources
- [Azure Learn](https://docs.microsoft.com/learn/azure/)
- [Supabase YouTube](https://www.youtube.com/c/Supabase)
- [Web.dev](https://web.dev) - Performance optimization

---

**Document Version:** 1.0.0  
**Last Updated:** December 2024  
**Next Review:** Monthly
