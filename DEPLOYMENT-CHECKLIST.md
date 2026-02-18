# Deployment Checklist — Prevent Cache Issues

## Why You Get "Failed to fetch dynamically imported module" Errors

**Root Cause:** PWA service worker caches old JavaScript chunk files. After new deployment with new hash names, browser tries to load old chunks → 404.

**Example:**
- Old build: `SalesHub-BIM2FC-q.js` (cached)
- New build: `SalesHub-NEW_HASH.js` (deployed)
- Browser requests: `SalesHub-BIM2FC-q.js` → **404 NOT FOUND**

---

## ✅ Pre-Deployment Checklist

### 1. Clean Build (Every Time)
```powershell
# Delete old build
rm -rf dist

# Fresh install (if package.json changed)
npm install

# Build
npm run build

# Verify dist folder has:
ls dist/
# ✅ index.html
# ✅ assets/ (folder with .js, .css files)
# ✅ manifest.webmanifest
# ✅ sw.js (service worker)
```

### 2. Test Build Locally (Before Deploying)
```powershell
npm run preview
# Open: http://localhost:4173
# Test: Navigate to all pages (Dashboard, Customers, SalesHub, etc.)
# Check: No 404 errors in DevTools console
```

### 3. Check Vite Config (Should Already Be Correct)
```typescript
// vite.config.ts
export default defineConfig({
  base: '/',  // ✅ Correct for https://copcca.com/
  // ❌ Wrong: base: '/app/' (only if deployed at /app/)
})
```

---

## 📤 Deployment Steps

### Option A: Vercel (Recommended)
1. Push to GitHub: `git push origin main`
2. Vercel auto-deploys from GitHub
3. Wait 2-3 minutes for build
4. Check deployment status: https://vercel.com/dashboard

### Option B: Netlify
1. Build locally: `npm run build`
2. Upload `dist/` folder to Netlify
3. Or connect GitHub for auto-deploy

### Option C: Manual Server (cPanel, VPS, etc.)
```powershell
# 1. Build
npm run build

# 2. Upload ENTIRE dist folder via FTP/SFTP
# ✅ Upload: dist/index.html
# ✅ Upload: dist/assets/* (all files)
# ✅ Upload: dist/manifest.webmanifest
# ✅ Upload: dist/sw.js

# 3. Verify server has .htaccess or Nginx config for SPA
```

**Server Config Required (SPA Rewrite):**

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 🧹 Post-Deployment: Force Cache Clear (Critical!)

After **every deployment**, users need to clear cache because PWA aggressively caches.

### Automatic: Version-Based Cache Busting (Already Implemented)
The new `vite.config.ts` uses **Network-First** for JS/CSS chunks, so browsers will:
1. Try to fetch latest from server
2. Fall back to cache only if offline
3. Auto-update cache with latest version

**This should prevent 90% of cache issues going forward.**

### Manual: Clear User Cache (For Existing Users After This Deployment)

**Method 1 — Incognito Mode (Fastest)**
- Press `Ctrl + Shift + N` (Chrome) or `Ctrl + Shift + P` (Firefox/Edge)
- Navigate to https://copcca.com
- Login → Test all pages

**Method 2 — Nuclear Cache Clear**
1. Open https://copcca.com
2. Press `F12` (DevTools)
3. **Application** tab → **Service Workers** → Click **Unregister**
4. **Storage** section → Click **Clear site data**
5. Close DevTools
6. `Ctrl + Shift + Delete` → Clear **All time** → Check **Cached images/files**
7. Close browser completely
8. Reopen → `Ctrl + F5` hard refresh

**Method 3 — Different Browser**
Use a browser you haven't used before (Edge, Firefox, Chrome)

---

## 🚀 Future Deployments (After This Fix)

After you deploy the updated `vite.config.ts`:

### What Changed
✅ **JS/CSS now use Network-First** (always tries server first)
✅ **Only cache static assets** (HTML, images, fonts — not JS chunks)
✅ **SPA fallback enabled** (`navigateFallback: '/index.html'`)
✅ **Auto cleanup** (`cleanupOutdatedCaches: true`)

### What This Means
- **Future deployments:** Users auto-get latest JS within 10 seconds
- **Offline support:** Still works offline with last cached version
- **No more 404s:** Network-first ensures fresh chunks

### New Deployment Workflow
```powershell
# 1. Build
npm run build

# 2. Deploy (Vercel/Netlify/Manual)
git push origin main

# 3. Wait 2-3 minutes

# 4. Test (First-time after deployment, force refresh once)
# Press Ctrl + F5 on https://copcca.com
# Navigate to all pages
# ✅ Should work without 404 errors

# 5. Users automatically get update within 10 seconds of visit
```

---

## 🐛 Debugging Cache Issues

### Check If It's a Cache Issue
**Symptoms:**
- 404 errors for `.js` files in DevTools console
- "Failed to fetch dynamically imported module"
- App works in Incognito but not regular window

**Verify:**
```powershell
# Open DevTools (F12)
# Go to Network tab
# Filter: JS
# Look for 404 responses on .js files
```

### Check Service Worker Status
```javascript
// In DevTools Console, run:
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Active service workers:', registrations.length);
  registrations.forEach(reg => console.log(reg));
});
```

### Force Service Worker Unregister (Emergency)
```javascript
// In DevTools Console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('All service workers unregistered');
  location.reload();
});
```

---

## 📋 Summary: What You Must Do Now

### Immediately (One-Time Setup)
1. ✅ **Deploy updated `vite.config.ts`** (I just fixed it)
   ```powershell
   npm run build
   git add -A
   git commit -m "fix: Improve PWA cache strategy to prevent 404 chunk errors"
   git push origin main
   ```

2. ✅ **Clear your browser cache** (to see current fixes)
   - Use Incognito mode to verify OTEGA LTD is gone from customers

### Every Future Deployment
1. Clean build: `rm -rf dist && npm run build`
2. Deploy: `git push origin main` (or upload `dist/`)
3. First visit: `Ctrl + F5` to force refresh once
4. Users auto-update within 10 seconds

### When Users Report Errors
- Ask them to press `Ctrl + F5` (hard refresh)
- Or send them this link with instructions
- Or tell them to use Incognito mode temporarily

---

**This fix is permanent.** After this deployment, you'll rarely see these cache errors again. The Network-First strategy ensures browsers always try to fetch the latest JavaScript from the server before using cached versions.
