# ⚡ YOUR EXACT SETUP - DigitalOcean App Platform + GitHub Auto-Deploy

**Your Setup:**
- ✅ DigitalOcean App Platform
- ✅ Automatic deploy from GitHub
- ✅ No manual server management

**Your Problem:**
- ❌ Routes return 404 (`/customers`, `/dashboard`, etc.)
- ❌ Refresh on any route → 404
- ❌ Sometimes hashed JS files 404

**Time to Fix:** **2 minutes**

---

## 🎯 THE FIX (3 Steps)

### **Step 1: Add SPA Rewrite Rule** (THIS FIXES ROUTE 404s)

This is the critical step that fixes everything.

1. Go to: **DigitalOcean Dashboard**
2. Click: **App Platform → Your App**
3. Click: **Settings** tab
4. Click: **Components** → **[your-app-name]**
5. Scroll down to: **HTTP Routes** section
6. Click: **Add Route** (or **Edit** if one exists)

**Enter these values:**

```
Source Path:       /*
Destination Path:  /index.html
Type:              Rewrite (Internal)
Priority:          1
```

**What this does:**
- User visits `/customers` → App Platform serves `index.html`
- React Router handles the route
- User sees the Customers page
- **Zero 404s forever**

7. Click **Save**
8. App Platform will redeploy automatically (~2 minutes)

---

### **Step 2: Verify Build Settings**

While on the same page, scroll up and verify:

```
Build Command:      npm run build     ✓
Output Directory:   dist              ✓
```

**If these are wrong, change them and save.**

Common mistakes:
- ❌ Output Directory: `build` (that's for NextJS)
- ❌ Output Directory: `public` (that's source files)
- ✅ Output Directory: `dist` (correct for Vite)

---

### **Step 3: Clear Browser Cache**

After deployment completes:

```
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)

Or open incognito/private window
```

---

## ✅ DONE! Test These:

- [ ] Visit `yourdomain.com/customers` → Should load (not 404)
- [ ] Refresh on any page → Should work
- [ ] Check browser console → Zero 404 errors
- [ ] All routes work

---

## 🔥 IF YOU STILL GET 404 ON HASHED JS FILES

**Example error:**
```
index-Ba3JX9CD.js:1 Failed to load resource: 404
```

**Cause:** Old build cached in browser, requesting wrong JS file.

**Fix:**

```bash
# 1. Force clean build locally
rm -rf dist
npm run build

# 2. Push to GitHub (triggers auto-deploy)
git add -A
git commit -m "Clean rebuild"
git push origin main

# 3. Wait for DigitalOcean deployment (~2 minutes)
# Check: App Platform → Activity tab → should show "Deployed"

# 4. Hard refresh browser
Ctrl+Shift+R
```

---

## 🧪 VERIFY YOUR VITE CONFIG

Open `vite.config.ts` - should have:

```typescript
export default defineConfig({
  base: '/',  // ✓ Correct for root domain
});
```

**If you changed this, rebuild and push:**
```bash
npm run build
git add vite.config.ts
git commit -m "Fix base path"
git push origin main
```

---

## 🚀 YOUR DEPLOYMENT WORKFLOW (From Now On)

```bash
# 1. Make changes to your code

# 2. Commit and push
git add -A
git commit -m "Your changes"
git push origin main

# 3. DigitalOcean auto-deploys (~2 minutes)
# Watch: App Platform → Activity tab

# 4. Hard refresh browser
Ctrl+Shift+R

# Done! ✅
```

**That's it.** No manual builds, no file uploads, no SSH.

---

## 📸 VISUAL GUIDE: Where to Add Rewrite Rule

```
┌─────────────────────────────────────────────────┐
│ DigitalOcean Dashboard                          │
│                                                 │
│ App Platform → Your App → Settings → Components│
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Component Settings                              │
│                                                 │
│ Build Command:        npm run build             │
│ Output Directory:     dist                      │
│                                                 │
│ ──────────────────────────────────────────────  │
│                                                 │
│ HTTP Routes                              [Add]  │
│ ┌─────────────────────────────────────────────┐│
│ │ Source Path:        /*                      ││
│ │ Destination Path:   /index.html             ││
│ │ Type:               Rewrite (Internal)      ││
│ │ Priority:           1                       ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│                                    [Save]       │
└─────────────────────────────────────────────────┘
```

---

## 🎯 WHY THIS WORKS

### **Before Fix:**
```
User visits:       yourdomain.com/customers
GitHub:            Pushes code
App Platform:      Builds and deploys
User requests:     /customers (file)
App Platform:      ❌ 404 - file doesn't exist
```

### **After Fix:**
```
User visits:       yourdomain.com/customers
Rewrite rule:      /* matches this route
App Platform:      Serves /index.html (invisibly)
React Router:      Sees /customers in URL
React:             ✅ Renders Customers page
User:              Sees working page
```

---

## 📋 TROUBLESHOOTING

### "I don't see HTTP Routes section"

**Possible causes:**
1. You're looking at the wrong component (check you selected your static site, not a service)
2. Old App Platform version (update in settings)
3. Wrong app type (should be "Static Site" or "Web Service")

**Solution:** Look for "Routes" or "Routing" section in Component settings.

---

### "Rewrite rule is there but still 404"

**Check:**
1. Deployment completed? (Activity tab → should say "Deployed")
2. Browser cache cleared? (Ctrl+Shift+R)
3. Correct rewrite type? (Should be "Rewrite Internal", not "Redirect")
4. Priority correct? (Lower number = higher priority)

**Nuclear option:**
```bash
# Force redeploy
Go to App Platform → Your App
Click "Create Deployment" button
Select branch: main
Click "Deploy"
```

---

### "Build succeeds but files are wrong"

**Check output directory:**
```
Settings → Components → Output Directory
Should be: dist (not build, not public)
```

**Check locally:**
```bash
npm run build
ls dist/

# Should see:
# index.html
# assets/
# manifest.webmanifest
```

---

## 📚 FULL DOCUMENTATION

For deeper dive, see:
- **[DIGITALOCEAN-APP-PLATFORM-GUIDE.md](DIGITALOCEAN-APP-PLATFORM-GUIDE.md)** - Complete guide

---

## ✅ COMPLETED CHECKLIST

After following steps above:

- [x] SPA rewrite rule added: `/* → /index.html`
- [x] Build settings verified: `npm run build` → `dist`
- [x] Vite config checked: `base: '/'`
- [x] App Platform redeployed
- [x] Browser cache cleared
- [ ] **All routes working! 🎉**

---

**Total time: 2 minutes. Zero 404s forever. Auto-deploys on every push.** ✅

The rewrite rule is the key - add it once, works forever.
