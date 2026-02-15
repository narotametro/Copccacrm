# DigitalOcean App Platform Deployment Guide

## Current Setup
- Platform: DigitalOcean App Platform (Static Site)
- Repository: narotametro/Copccacrm
- Auto-deploy: Enabled (deploys on push to main)
- Build command: `npm run build`
- Output directory: `dist`

## Force Rebuild After Errors

### Option 1: Trigger Auto-Deployment (Easiest)
The latest fix (commit 2c5d0a4) should auto-deploy. Wait 5-10 minutes, then:

1. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete → Clear cached images and files
   - Or hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

2. **Check deployment status:**
   - Go to https://cloud.digitalocean.com/apps
   - Click your app → "Activity" tab
   - Wait for "Deployed" status (green checkmark)

### Option 2: Manual Rebuild
If auto-deploy didn't trigger:

1. Go to https://cloud.digitalocean.com/apps
2. Click your **copcca-crm** app
3. Click **"Actions"** dropdown (top right)
4. Select **"Force Rebuild and Deploy"**
5. Wait 5-10 minutes
6. Clear browser cache and refresh

### Option 3: Push Empty Commit (Force Trigger)
```bash
git commit --allow-empty -m "chore: Force DigitalOcean rebuild"
git push origin main
```

## Common Deployment Issues

### 1. Old Assets (404 errors)
**Symptom:** `Failed to load resource: 404` for CSS/JS files

**Cause:** Cached old build with different file hashes

**Fix:**
- Force rebuild (see above)
- Clear browser cache completely
- Check deployment logs for build errors

### 2. Preload Warnings
**Symptom:** "resource was preloaded but not used"

**Cause:** Code splitting creates many small chunks

**Fix:** This is normal and doesn't affect functionality. Vite optimizes loading.

### 3. Service Worker Caching Old Version
**Symptom:** App still shows old version after deployment

**Fix:**
```javascript
// Open browser console and run:
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
// Then hard refresh (Ctrl+Shift+R)
```

## Environment Variables on DigitalOcean

1. Go to your app → **"Settings"** tab
2. Scroll to **"App-Level Environment Variables"**
3. Add these (if not already set):
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Custom Domain Setup (copcca.com)

Your CNAME is correctly set. If domain isn't working:

1. Go to app → **"Settings"** → **"Domains"**
2. Ensure `copcca.com` and `www.copcca.com` are added
3. DigitalOcean should show SSL certificate status as "Active"
4. DNS propagation can take up to 48 hours

## Verify Deployment

After rebuild completes, check:

```bash
# 1. Check CSS file exists (should return 200)
curl -I https://copcca.com/assets/index-BxIew168.css

# 2. Check main JS file exists (should return 200)
curl -I https://copcca.com/assets/index-D5OGMOjg.js

# 3. Check index.html references correct files
curl https://copcca.com | grep "index-"
```

## Deployment Logs

To check build logs:
1. DigitalOcean dashboard → Your app
2. **"Activity"** tab → Click deployment
3. View **"Build Logs"** and **"Deploy Logs"**
4. Look for errors (npm install, npm run build)

## Quick Fix Checklist

- [ ] Latest commit pushed to GitHub (2c5d0a4 or newer)
- [ ] DigitalOcean shows successful deployment (green checkmark)
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Service worker unregistered (if using PWA)
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Test in incognito/private mode

## Production Build Verification

Test locally before deployment:
```bash
npm run build
npm run preview
# Open http://localhost:4173
```

## Contact Support

If issues persist after force rebuild:
- Email: support@digitalocean.com
- Check status: https://status.digitalocean.com
- Community: https://www.digitalocean.com/community
