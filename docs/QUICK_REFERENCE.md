# ⚡ Pocket CRM - Quick Reference Card

## 🚀 Quick Deploy (First Time)

```bash
# 1. Prerequisites
az login
npm install

# 2. Run deployment script
chmod +x deploy-azure.sh
./deploy-azure.sh

# 3. Configure GitHub Secrets
# Go to: GitHub → Settings → Secrets → Actions
# Add: AZURE_STATIC_WEB_APPS_API_TOKEN, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# 4. Push to trigger auto-deploy
git push origin main
```

---

## 🔥 Emergency Commands

### Site is Down
```bash
# Quick fix: Trigger redeployment
git commit --allow-empty -m "Emergency redeploy"
git push origin main

# Check status
az staticwebapp show --name pocket-crm-app --resource-group pocket-crm-rg
```

### Rollback to Previous Version
```bash
git revert HEAD
git push origin main
```

### Check Logs Immediately
```bash
# Backend logs
supabase functions logs make-server-a2294ced --project-ref [ref] --limit 50

# Azure deployment status
az staticwebapp show --name pocket-crm-app --query "builds[0]"
```

---

## 📋 Daily Checklist

```bash
# Morning (2 minutes)
□ curl -I https://your-app.azurestaticapps.net  # Site up?
□ Check GitHub Actions - All green?
□ Supabase Dashboard - Usage < 80%?

# Weekly (10 minutes)  
□ Review error logs
□ Check costs: Azure Portal → Cost Management
□ Review user feedback
□ Update dependencies: npm update

# Monthly (30 minutes)
□ Security review (rotate keys)
□ Performance audit (Lighthouse)
□ Database cleanup
□ Cost optimization review
```

---

## 🛠️ Common Tasks

### Deploy Code Changes
```bash
git add .
git commit -m "feat: new feature"
git push origin main
# Auto-deploys via GitHub Actions
```

### Update Environment Variable
```bash
az staticwebapp appsettings set \
  --name pocket-crm-app \
  --resource-group pocket-crm-rg \
  --setting-names NEW_VAR=value
```

### Add New User as Admin
```sql
-- In Supabase SQL Editor
UPDATE auth.users 
SET raw_user_meta_data = 
  jsonb_set(raw_user_meta_data, '{role}', '"admin"')
WHERE email = 'newadmin@example.com';
```

### Backup Database
```bash
supabase db dump --project-ref [ref] > backup-$(date +%Y%m%d).sql
```

### View Recent Errors
```bash
supabase functions logs make-server-a2294ced --project-ref [ref] | grep -i error
```

---

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| **Production Site** | https://[your-app].azurestaticapps.net |
| **Azure Portal** | https://portal.azure.com |
| **Supabase Dashboard** | https://app.supabase.com |
| **GitHub Actions** | https://github.com/[user]/pocket-crm/actions |
| **This Repo** | https://github.com/[user]/pocket-crm |

---

## 🆘 Who to Call

| Issue | Contact |
|-------|---------|
| Site completely down | On-Call Engineer |
| Backend errors | Backend Team Lead |
| User can't login | Check Supabase Auth status first |
| High costs | DevOps Lead |
| Feature request | Product Manager |

---

## 🎯 Key Metrics to Watch

| Metric | Tool | Healthy |
|--------|------|---------|
| Response Time | Azure Insights | < 2s |
| Error Rate | Azure Insights | < 1% |
| Uptime | Azure Monitor | > 99.5% |
| API Quota | Supabase Dashboard | < 80% |
| Database Size | Supabase Dashboard | < 80% |
| Cost | Azure Portal | < Budget |

---

## 💡 Pro Tips

1. **Before pushing to main:** Always test locally with `npm run build && npm run preview`
2. **Check GitHub Actions:** Confirm green checkmark before considering deploy complete
3. **Monitor for 10 min:** After deploying, watch error logs for 10 minutes
4. **Use feature flags:** For risky features, add toggle capability
5. **Keep this updated:** Update this file when URLs/contacts change

---

## 📱 Mobile Quick Access

**Save these URLs on your phone:**

1. Azure Status: https://status.azure.com
2. Supabase Status: https://status.supabase.com  
3. GitHub Actions: https://github.com/[user]/pocket-crm/actions
4. Production Site: https://[your-app].azurestaticapps.net

---

## 🔐 Security Quick Checks

```bash
# Monthly security audit
npm audit                    # Check for vulnerabilities
npm outdated                 # Check for updates
git log --since="1 month"    # Review recent changes
```

**In Supabase Dashboard:**
- Auth → Users → Check for suspicious accounts
- Logs → Filter "error" → Look for attack patterns
- Settings → API → Verify CORS settings

---

## 💰 Cost Alert Thresholds

```
Azure Static Web Apps:
  Free Tier: 100GB bandwidth → Alert at 80GB
  
Supabase Free:
  Database: 500MB → Alert at 400MB
  Storage: 1GB → Alert at 800MB
  Bandwidth: 2GB → Alert at 1.6GB
```

**Set up alerts in:**
- Azure Portal → Cost Management → Budgets
- Supabase Dashboard → Usage & Billing

---

## 📞 Emergency Contact Card

```
┌─────────────────────────────────────────┐
│      POCKET CRM EMERGENCY CONTACTS      │
├─────────────────────────────────────────┤
│                                         │
│ On-Call Engineer:                       │
│   [Name]                                │
│   [Phone]                               │
│   [Email]                               │
│                                         │
│ Backup Contact:                         │
│   [Name]                                │
│   [Phone]                               │
│   [Email]                               │
│                                         │
│ Azure Support:                          │
│   Portal → Help + Support               │
│                                         │
│ Supabase Support:                       │
│   support@supabase.io (Pro plan only)   │
│   Discord: discord.supabase.com         │
│                                         │
└─────────────────────────────────────────┘
```

**Print this out and keep it accessible!**

---

## 🎓 Learning Resources

### New Team Members Start Here:
1. Read `/DEPLOYMENT_GUIDE.md` (30 min)
2. Read `/MANAGEMENT_GUIDE.md` (20 min)
3. Set up local environment (1 hour)
4. Deploy to personal test environment (30 min)
5. Shadow experienced team member (1 day)

### Quick Tutorials:
- **Azure CLI Basics:** https://docs.microsoft.com/cli/azure/get-started
- **Supabase Quickstart:** https://supabase.com/docs/guides/getting-started
- **GitHub Actions:** https://docs.github.com/actions

---

**Keep this file handy! Bookmark it in your browser.**

*Last Updated: December 2024*
*Next Review: Monthly or when major changes occur*
