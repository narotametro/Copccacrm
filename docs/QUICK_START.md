# 🚀 COPCCA CRM - Quick Start Guide

## 3 Simple Steps to Deploy

### Step 1: Push to GitHub (5 minutes)
```bash
# Download code from Figma Make
# Then:
cd copcca-crm
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/copcca-crm.git
git push -u origin main
```

### Step 2: Deploy to DigitalOcean (10 minutes)
1. Go to: https://cloud.digitalocean.com
2. Create → Apps → Connect GitHub
3. Select repository: `copcca-crm`
4. Add environment variables (see below)
5. Click "Deploy"

### Step 3: Access Your App (1 minute)
- **Main App**: `https://your-app.ondigitalocean.app`
- **Admin Dashboard**: `https://your-app.ondigitalocean.app/#/copcca-admin`
- **Password**: `COPCCA_ADMIN_2024`

---

## Required Environment Variables

Copy-paste these into DigitalOcean (Settings → Environment Variables):

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres
WHATSAPP_API_KEY=your-whatsapp-key
RESEND_API_KEY=your-resend-key
```

**Where to get these?**
- Supabase Dashboard → Settings → API

---

## Admin Dashboard Quick Access

### URL Format
```
https://your-app.ondigitalocean.app/#/copcca-admin
```

### Login
- **Password**: `COPCCA_ADMIN_2024`
- **⚠️ Change this password** in `/AdminDashboard.tsx` line 12

### What You Can Do
- ✅ View all customer subscriptions
- ✅ Manage payments (paid/unpaid)
- ✅ Activate/deactivate accounts
- ✅ View revenue analytics
- ✅ Track all users

### Common Tasks

**Activate Customer After Payment:**
1. Search customer by email
2. Click "Mark Paid"
3. Click "Activate"
4. Done! ✅

**Deactivate Non-Paying Customer:**
1. Search customer
2. Click "Deactivate"
3. Click "Mark Unpaid"
4. Done! ✅

---

## Subscription System

### Current Status
**DISABLED** (for fast loading during development)

### Enable Subscription Checking
Edit `/components/SubscriptionGate.tsx` line 17:
```javascript
// Change from:
const DISABLE_SUBSCRIPTION_CHECK = true;

// To:
const DISABLE_SUBSCRIPTION_CHECK = false;
```

### Pricing
- **Per User/Month**: TSH 30,000
- **Billed**: Annually (×12 months)
- **Example**: 5 users = TSH 1,800,000/year

---

## Troubleshooting

### App Won't Load
```bash
# Check build logs in DigitalOcean
# Settings → Runtime Logs
```

### Admin Dashboard 404
- Make sure URL has `#/copcca-admin` (with the hash!)
- Try: `https://your-app.ondigitalocean.app/#/copcca-admin`

### Subscription Modal Stuck
```javascript
// Temporarily disable in /components/SubscriptionGate.tsx
const DISABLE_SUBSCRIPTION_CHECK = true;
```

### Database Not Saving
- Check Supabase is connected
- Verify environment variables
- Check Network tab for errors

---

## Important Files

| File | Purpose |
|------|---------|
| `/App.tsx` | Main application entry |
| `/components/SubscriptionGate.tsx` | Subscription check |
| `/components/SubscriptionModal.tsx` | Payment modal |
| `/AdminDashboard.tsx` | Admin dashboard |
| `/utils/supabase/info.tsx` | Supabase config |
| `/supabase/functions/server/index.tsx` | Backend API |

---

## Architecture

```
User Browser
    ↓
DigitalOcean (Frontend)
    ↓
Supabase Edge Functions (Backend)
    ↓
Supabase PostgreSQL (Database)
```

---

## Costs

| Service | Plan | Cost |
|---------|------|------|
| **DigitalOcean** | App Platform Basic | $5/month |
| **Supabase** | Free Tier | $0/month |
| **Total** | - | **$5/month** |

Upgrade to Professional ($12/month) for more resources.

---

## Next Steps

1. ✅ Deploy to DigitalOcean
2. ✅ Test main app
3. ✅ Test admin dashboard
4. ✅ Change admin password
5. ✅ Enable subscription check (when ready)
6. ✅ Add custom domain (optional)
7. ✅ Train your team
8. ✅ Launch! 🚀

---

## Support

**Detailed Guides:**
- `/DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `/SUBSCRIPTION_SYSTEM.md` - Subscription system details
- `/ADMIN_DASHBOARD_GUIDE.md` - Admin dashboard manual
- `/DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `/LOADING_FIX.md` - Performance optimization

**External Resources:**
- DigitalOcean Docs: https://docs.digitalocean.com
- Supabase Docs: https://supabase.com/docs

---

**That's it! You're ready to deploy COPCCA CRM.** 🎉

For detailed instructions, see `/DEPLOYMENT_GUIDE.md`
