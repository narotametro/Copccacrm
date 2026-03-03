# 🚀 DigitalOcean App Platform - Complete Setup Guide

**Last Updated:** March 4, 2026  
**Purpose:** Zero-config SPA deployment with automatic routing

---

## ✨ WHY APP PLATFORM?

### **Advantages over Manual Droplet:**
✅ No Nginx configuration needed  
✅ No SSH/server management  
✅ Automatic deployments on git push  
✅ Built-in CDN + SSL  
✅ Auto-scaling  
✅ Simpler troubleshooting  

### **Cost:**
- Static site: **$5/month** (or free tier if available)
- Much simpler than managing a Droplet

---

## 🎯 THE PROBLEM (Why You Get 404s)

### **Symptom:**
- Visit `yourdomain.com/customers` → **404 ERROR**
- Refresh any route → **404 ERROR**
- Hashed JS file: `index-Ba3JX9CD.js:1 Failed to load resource: 404`

### **Root Cause:**
App Platform doesn't know your app is a Single Page Application (SPA):
- User visits `/customers`
- App Platform looks for a file called `customers`
- File doesn't exist → returns 404
- React Router never gets a chance to handle it

### **Solution:**
Add a **rewrite rule** that tells App Platform:
> "If file doesn't exist, serve `index.html` and let React handle routing"

---

## ✅ PERMANENT FIX (One-Time Setup)

### **Step 1: Verify Vite Configuration**

Open `vite.config.ts` and check the `base` setting:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',  // ✅ For root domain (yourdomain.com)
  // ... rest of config
});
```

**If deploying to a subfolder** (e.g., `yourdomain.com/app/`):
```typescript
export default defineConfig({
  base: '/app/',  // Must match your route
});
```

**⚠️ CRITICAL:** If `base` is wrong, ALL JS/CSS files will 404.

**If you changed this:**
```bash
rm -rf dist
npm run build
git add -A
git commit -m "Fix vite base path"
git push origin main
```

---

### **Step 2: Configure Build Settings**

1. Go to **DigitalOcean Dashboard**
2. Navigate to **App Platform → Your App**
3. Click **Settings** → **Components** → **[Your Static Site]**
4. Under **Build Phase**, verify:

```
Build Command:     npm run build
Output Directory:  dist
```

**Screenshot Guide:**
```
┌─────────────────────────────────────┐
│ Build Command                       │
│ ┌─────────────────────────────────┐ │
│ │ npm run build                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Output Directory                    │
│ ┌─────────────────────────────────┐ │
│ │ dist                            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**⚠️ CRITICAL:** If Output Directory is wrong, you'll get 404s on JS/CSS files.

Common mistakes:
- ❌ `build` (wrong - that's NextJS)
- ❌ `public` (wrong - that's source)
- ✅ `dist` (correct - Vite output)

---

### **Step 3: Add SPA Rewrite Rule** (MOST IMPORTANT)

This fixes route 404s permanently.

1. Go to **DigitalOcean Dashboard**
2. Navigate to **App Platform → Your App**
3. Click **Settings** → **Components** → **[Your Static Site]**
4. Scroll to **HTTP Routes** section
5. Click **Add Route** or **Edit** if one exists

**Configure the route:**

```
Source:        /*
Destination:   /index.html
Type:          Rewrite (Internal)
Priority:      1 (or lower number)
```

**What each field means:**

| Field | Value | Meaning |
|-------|-------|---------|
| **Source** | `/*` | Match all routes |
| **Destination** | `/index.html` | Serve index.html |
| **Type** | Rewrite | Internal rewrite (invisible to user) |
| **Priority** | 1 | Lower number = higher priority |

**Screenshot Guide:**
```
┌──────────────────────────────────────────────┐
│ HTTP Routes                                  │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │
│ │ Source Path:        /*                   │ │
│ │ Destination Path:   /index.html          │ │
│ │ Type:               Rewrite (Internal)   │ │
│ │ Priority:           1                    │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [ Save ]                                     │
└──────────────────────────────────────────────┘
```

**What this does:**
- User visits: `yourdomain.com/customers`
- App Platform serves: `index.html` (invisibly)
- React Router sees: `/customers` in URL
- React Router renders: Customers page
- User never sees any redirect or 404

Click **Save Changes**

---

### **Step 4: Deploy and Verify**

After saving settings, App Platform will redeploy automatically.

**Monitor deployment:**
1. Go to **App Platform → Your App**
2. Click **Activity** tab
3. Wait for "Deployed" status (~2-3 minutes)

**After deployment completes:**

```bash
# Hard refresh your browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or open in incognito/private window
```

---

## 🧪 TESTING CHECKLIST

After setup, test all scenarios:

- [ ] **Home page:** Visit `yourdomain.com` → Loads ✓
- [ ] **Direct route:** Visit `yourdomain.com/customers` → Loads (not 404) ✓
- [ ] **Refresh test:** Visit any page → Press F5 → Still loads ✓
- [ ] **Deep link:** Share `yourdomain.com/dashboard` → Opens correctly ✓
- [ ] **Browser console:** Open DevTools → Console tab → Zero 404 errors ✓
- [ ] **Network tab:** Check Network tab → All JS/CSS files load (200 status) ✓
- [ ] **Mobile:** Test on phone → All routes work ✓

---

## 🔥 COMMON ERRORS & FIXES

### **Error: Hashed JS File 404** (`index-Ba3JX9CD.js:1 Failed to load resource`)

**Cause:** Browser cached old build HTML, requests old JS file that no longer exists.

**Fix:**
```bash
# 1. Clear dist folder
rm -rf dist

# 2. Clean build
npm run build

# 3. Push to trigger redeploy
git add -A
git commit -m "Clean rebuild"
git push origin main

# 4. Wait for deployment
# 5. Hard refresh browser (Ctrl+Shift+R)
```

**Why this happens:**
```
Build 1 generates: index-AAAA.js
Build 2 generates: index-BBBB.js

If browser cached index.html from Build 1,
it still references: index-AAAA.js
But server only has: index-BBBB.js
→ 404
```

---

### **Error: Routes 404 Even After Rewrite Rule**

**Check 1: Rewrite rule exists**
```
App → Settings → HTTP Routes
Should show: /* → /index.html (Rewrite)
```

**Check 2: Route priority**
```
If you have multiple routes, make sure:
/* (catch-all) has LOWER priority number (runs last)

Example:
Priority 1: /api/* → http://backend:3000 (API proxy)
Priority 2: /*      → /index.html (SPA fallback)
```

**Check 3: Deployment completed**
```
App → Activity tab
Latest deployment should show: "Deployed" (green checkmark)
```

**Check 4: Clear browser cache**
```
Hard refresh: Ctrl+Shift+R
Or: Open in incognito window
```

---

### **Error: Build Fails / Files Not Found**

**Check build command:**
```
Settings → Build Command = npm run build (not npm build)
```

**Check output directory:**
```
Settings → Output Directory = dist (not build, not public)
```

**Check package.json has build script:**
```json
{
  "scripts": {
    "build": "vite build"  // ✓ Must exist
  }
}
```

**Check dependencies installed:**
```bash
# Make sure package-lock.json is committed
git add package-lock.json
git commit -m "Add lock file"
git push
```

---

### **Error: CSS/Images Load but JS Files 404**

**Cause:** Output directory is wrong - App Platform is serving `src/` instead of `dist/`

**Fix:**
```
App → Settings → Components → Output Directory
Change from: src (wrong)
Change to:   dist (correct)

Save → Wait for redeploy
```

---

### **Error: "Module not found" in Browser Console**

**Cause:** Vite `base` path doesn't match deployment path.

**Fix:**

If deployed to **root domain** (`yourdomain.com`):
```typescript
// vite.config.ts
export default defineConfig({
  base: '/',  // ✓ Correct
});
```

If deployed to **subpath** (`yourdomain.com/app/`):
```typescript
// vite.config.ts
export default defineConfig({
  base: '/app/',  // ✓ Correct - must match route
});
```

After changing, rebuild:
```bash
rm -rf dist && npm run build
git add -A && git commit -m "Fix base path" && git push
```

---

## 🚀 DEPLOYMENT WORKFLOW (Every Time)

### **Automatic (Recommended):**

```bash
# 1. Make your changes
# 2. Commit and push
git add -A
git commit -m "Your changes"
git push origin main

# 3. App Platform auto-deploys (~2 minutes)
# 4. Hard refresh browser (Ctrl+Shift+R)
```

**That's it!** No manual building, no file uploads, no SSH.

---

### **Manual Trigger (If needed):**

1. Go to **App Platform → Your App**
2. Click **Create Deployment** button
3. Select branch: `main`
4. Click **Deploy**
5. Wait for completion (~2 minutes)

---

## 📊 BEFORE vs AFTER

### **BEFORE Fix:**
```
User visits:     yourdomain.com/customers
App Platform:    ❌ 404 - File not found
User sees:       Error page
React Router:    Never runs
```

### **AFTER Fix:**
```
User visits:     yourdomain.com/customers
Rewrite rule:    Match /* → serve /index.html
App Platform:    ✓ 200 - Serves index.html
React Router:    Runs and handles /customers
User sees:       Customers page
```

---

## 🔧 ADVANCED: Environment Variables

If you need environment variables for production:

1. Go to **App Platform → Your App → Settings**
2. Click **App-Level Environment Variables**
3. Add variables:

```
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_ANON_KEY = your_anon_key
```

**⚠️ Important:**
- Vite env vars MUST start with `VITE_`
- They're embedded in build (not secret!)
- For secrets, use Supabase RLS policies

App Platform will rebuild automatically when you save.

---

## 🔒 ADVANCED: Custom Domain + SSL

### **Step 1: Add Custom Domain**

1. Go to **App Platform → Your App → Settings**
2. Scroll to **Domains**
3. Click **Add Domain**
4. Enter your domain: `yourdomain.com`
5. Click **Add Domain**

### **Step 2: Update DNS Records**

App Platform will show you DNS records to add:

```
Type:  A
Name:  @
Value: [App Platform IP]

Type:  CNAME
Name:  www
Value: [Generated CNAME]
```

Add these to your DNS provider (Namecheap, GoDaddy, etc.)

### **Step 3: Wait for SSL**

- DNS propagation: ~5-60 minutes
- SSL certificate: Auto-generated by Let's Encrypt
- HTTPS: Enabled automatically

**Verify:**
- Visit `https://yourdomain.com`
- Should show green padlock icon
- No certificate warnings

---

## 💰 COST BREAKDOWN

### **Static Site Pricing:**

| Resource | Cost |
|----------|------|
| Basic Static Site | **$5/month** |
| Bandwidth | Included (1 TB/month) |
| SSL Certificate | Free (Let's Encrypt) |
| CDN | Included |
| Custom Domain | Free |

### **Comparison:**

| Setup | Monthly Cost | Effort |
|-------|-------------|--------|
| **App Platform** | $5 | Low (auto-deploy) |
| **Droplet (Manual)** | $6-12 | High (Nginx, SSH, manual deploy) |
| **Vercel/Netlify** | $0-10 | Low (auto-deploy) |

**Recommendation:** App Platform is the sweet spot for DigitalOcean users.

---

## 🆚 APP PLATFORM vs MANUAL DROPLET

| Feature | App Platform | Manual Droplet |
|---------|-------------|----------------|
| **SPA Routing** | Rewrite rule (2 clicks) | Nginx config (5 min) |
| **Deployment** | Auto on git push | Manual SCP/SFTP |
| **SSL** | Auto (Let's Encrypt) | Manual certbot |
| **CDN** | Built-in | Need to configure |
| **Scaling** | Automatic | Manual |
| **Backup** | Git-based | Manual |
| **Server Management** | None | SSH, updates, security |
| **Complexity** | Low | Medium-High |
| **Best For** | SPAs, static sites | Custom servers, APIs |

---

## 📚 RELATED DOCUMENTATION

- **[QUICK-FIX-DIGITALOCEAN.md](QUICK-FIX-DIGITALOCEAN.md)** - Quick reference for both setups
- **[DIGITALOCEAN-DEPLOYMENT-GUIDE.md](DIGITALOCEAN-DEPLOYMENT-GUIDE.md)** - Manual Droplet guide
- **[ZERO-ERRORS-SYSTEM.md](ZERO-ERRORS-SYSTEM.md)** - Client-side error handling

---

## 🎯 FINAL CHECKLIST

Before going live, verify:

- [ ] Vite config `base: '/'` is correct
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Rewrite rule: `/* → /index.html`
- [ ] All routes tested and working
- [ ] Browser console: Zero 404 errors
- [ ] Custom domain configured (if using)
- [ ] SSL working (HTTPS)
- [ ] Environment variables set (if needed)

---

**With App Platform, you get zero-config SPA hosting with automatic deployments. Configure once, deploy forever.** ✅
