# 📋 COPCCA CRM - Deployment Cheat Sheet

**Print this page and keep it handy!**

---

## 🎯 Quick Reference

### Your Supabase Info
```
Project ID:  bpydcrdvytnnjzytkptd
Project URL: https://bpydcrdvytnnjzytkptd.supabase.co
Function:    make-server-a2294ced
Table:       kv_store_a2294ced
```

### Your DigitalOcean Settings
```
Build Command:    npm run build
Output Directory: dist
Node Version:     22.x (auto)
```

---

## ⚡ Essential Commands

### Deploy Update
```bash
git add .
git commit -m "Update description"
git push
```

### Test Locally
```bash
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Test production build
```

### Deploy Supabase Function
```bash
supabase login
supabase link --project-ref bpydcrdvytnnjzytkptd
supabase functions deploy make-server-a2294ced
```

### Check Logs
```bash
# Supabase function logs
supabase functions logs make-server-a2294ced

# DigitalOcean logs
# Go to: App Dashboard → Runtime Logs
```

---

## 🔑 Environment Variables (DigitalOcean)

**Add these 4 variables in Settings → Environment Variables:**

| Key | Value | Type |
|-----|-------|------|
| `VITE_SUPABASE_URL` | `https://bpydcrdvytnnjzytkptd.supabase.co` | Encrypted ✅ |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (from Supabase) | Encrypted ✅ |
| `VITE_SUPABASE_PROJECT_ID` | `bpydcrdvytnnjzytkptd` | Encrypted ✅ |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (from Supabase) | Encrypted ✅ |

**Get keys from:** Supabase Dashboard → Settings → API

---

## 🔧 Common Fixes

### Build Fails
```
Problem: Build command has comments/multiple commands
Fix:     Change to just: npm run build
```

### Can't Login
```
Problem: Environment variables not set
Fix:     Add all 4 variables in DigitalOcean Settings
```

### Changes Not Showing
```
Problem: Cache or deployment not complete
Fix:     Hard refresh (Ctrl+Shift+R) or wait for deploy
```

### 404 Errors
```
Problem: Edge function not deployed
Fix:     Run: supabase functions deploy make-server-a2294ced
```

---

## 🧪 Quick Tests

### Test Supabase Connection
```javascript
// Paste in browser console (F12)
fetch('https://bpydcrdvytnnjzytkptd.supabase.co/functions/v1/make-server-a2294ced/health')
  .then(r => r.json())
  .then(d => console.log('✅', d))
  .catch(e => console.error('❌', e));
```

### Test Local Build
```bash
rm -rf dist
npm run build
# If succeeds → Will work on DigitalOcean
```

---

## 📱 Important URLs

### Production
```
App:              https://your-app.ondigitalocean.app
Admin Dashboard:  https://your-app.ondigitalocean.app/#/copcca-admin
```

### Development
```
Local Dev:        http://localhost:5173
Local Preview:    http://localhost:4173
```

### Dashboards
```
DigitalOcean:     https://cloud.digitalocean.com
Supabase:         https://supabase.com/dashboard
GitHub:           https://github.com/YOUR_USERNAME/copcca-crm
```

---

## 🚨 Emergency Recovery

### If Everything Breaks
```bash
# 1. Force redeploy
git add .
git commit -m "Emergency fix"
git push

# 2. In DigitalOcean
Actions → Force Rebuild and Deploy

# 3. Redeploy Supabase function
supabase functions deploy make-server-a2294ced

# 4. Clear browser cache
Ctrl+Shift+Delete → Clear everything
```

---

## ✅ Deployment Checklist

Before every deployment:

- [ ] Code tested locally (`npm run build`)
- [ ] No TypeScript errors
- [ ] Environment variables set
- [ ] Build command correct
- [ ] Changes committed to git
- [ ] Pushed to GitHub
- [ ] Deployment succeeded
- [ ] App tested in browser
- [ ] No console errors

---

## 📊 Troubleshooting Matrix

| Symptom | Likely Cause | Quick Fix |
|---------|-------------|-----------|
| Build fails | Wrong build command | Set to `npm run build` |
| Can't login | Missing env vars | Add all 4 variables |
| 404 errors | Function not deployed | Deploy Edge Function |
| White screen | JS error | Check browser console |
| Slow loading | Network/cache | Hard refresh (Ctrl+Shift+R) |
| Data not saving | Supabase connection | Test health endpoint |
| Changes not showing | Cache | Clear cache or wait 10 min |
| CORS errors | Domain not allowed | Add domain to Supabase CORS |

---

## 💰 Cost Reference

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| DigitalOcean | Basic | $5 |
| Supabase | Free | $0 |
| **Total** | | **$5** |

**Scaling:**
- 10-50 users: ~$12/month
- 50-100 users: ~$37/month
- 100+ users: ~$49+/month

---

## 🎯 Key Files in Project

```
/App.tsx                        - Main app component
/lib/supabase-client.ts        - Supabase client setup
/utils/supabase/info.tsx       - Supabase credentials
/components/SubscriptionGate.tsx - Subscription system
/components/COPCCAAdmin.tsx    - Admin dashboard
/supabase/functions/server/    - Backend Edge Functions

/QUICK_SETUP.md                - 5-minute setup guide
/DEPLOYMENT_SUMMARY.md         - Complete overview
/TROUBLESHOOTING.md            - Problem solutions
/DEPLOYMENT_CHEATSHEET.md      - This file
```

---

## 🔐 Security Reminders

- ✅ Never commit API keys to GitHub
- ✅ Keep service_role key secret
- ✅ Use encrypted env vars in DigitalOcean
- ✅ Enable HTTPS only (auto on DigitalOcean)
- ✅ Test subscription gate before launch

---

## 📞 Support Links

**Docs:**
- DigitalOcean: https://docs.digitalocean.com
- Supabase: https://supabase.com/docs
- React: https://react.dev
- Vite: https://vitejs.dev

**Community:**
- Supabase Discord: https://discord.supabase.com
- DO Community: https://digitalocean.com/community
- Stack Overflow: Tag `supabase` or `digitalocean`

**Status Pages:**
- Supabase: https://status.supabase.com
- DigitalOcean: https://status.digitalocean.com

---

## 🎓 Learning Resources

**If you want to understand more:**

1. **React Tutorial:** https://react.dev/learn
2. **TypeScript Handbook:** https://www.typescriptlang.org/docs/
3. **Supabase Quickstart:** https://supabase.com/docs/guides/getting-started
4. **Tailwind CSS:** https://tailwindcss.com/docs
5. **Git Basics:** https://git-scm.com/book/en/v2

---

## 🚀 Deployment Timeline

```
Preparation:     10 minutes (read guides)
Get Credentials: 5 minutes (Supabase dashboard)
Configure DO:    5 minutes (add env vars)
Deploy:          10 minutes (auto-build)
Testing:         10 minutes (verify works)
---------------------------------------------
Total:           ~40 minutes
```

---

## 🎯 Success Criteria

**Your deployment is successful when:**

1. ✅ Build completes without errors
2. ✅ App loads at your DO URL
3. ✅ Login works without delays
4. ✅ Dashboard shows correctly
5. ✅ All 6 modules accessible
6. ✅ Data saves and persists
7. ✅ Admin panel works
8. ✅ No browser console errors

---

## 📝 Quick Notes Space

**Your App URL:**
```
_______________________________________________
```

**Your Admin Email:**
```
_______________________________________________
```

**Deployment Date:**
```
_______________________________________________
```

**Custom Domain (if any):**
```
_______________________________________________
```

**Notes:**
```
_______________________________________________

_______________________________________________

_______________________________________________
```

---

## 🔄 Regular Maintenance

### Daily
- Check error logs if users report issues
- Monitor uptime

### Weekly
- Review deployment logs
- Check Supabase usage (approaching limits?)
- Test critical features

### Monthly
- Update dependencies (`npm update`)
- Review security alerts (`npm audit`)
- Backup database (Supabase dashboard)
- Review user feedback

---

## 💡 Pro Tips

1. **Test locally first:** Always run `npm run build` before pushing
2. **Small commits:** Commit often with clear messages
3. **Monitor logs:** Check both DO and Supabase logs regularly
4. **Backup data:** Export Supabase data monthly
5. **Document changes:** Keep notes of what you change
6. **Use branches:** Create feature branches for big changes
7. **Hard refresh:** When testing, use Ctrl+Shift+R
8. **Check status:** Before debugging, check status pages

---

## ⚡ One-Liner Commands

```bash
# Quick deploy
git add . && git commit -m "Update" && git push

# Full clean rebuild
rm -rf dist node_modules && npm install && npm run build

# Test everything local
npm install && npm run build && npm run preview

# Deploy function
supabase functions deploy make-server-a2294ced

# Check function health
curl https://bpydcrdvytnnjzytkptd.supabase.co/functions/v1/make-server-a2294ced/health
```

---

## 🎉 You Got This!

**Remember:**
- Most issues = environment variables or build command
- Always test locally first
- Read error messages carefully
- Check the guides when stuck
- Take breaks when frustrated

**Your COPCCA CRM is ready to deploy!** 🚀

---

**Keep this cheat sheet handy for quick reference!**
**Print it or save as PDF for offline access.**

**Last Updated:** December 21, 2024
**Version:** 1.0
**System:** COPCCA CRM Deployment Guide
