# 🚀 DIGITALOCEAN DEPLOYMENT GUIDE - PERMANENT FIX

**Last Updated:** March 4, 2026  
**Purpose:** Fix 404 errors on routes & hashed JS files FOREVER

---

## 🎯 THE PROBLEM

### What Users Experience:
- Visit `yourdomain.com/customers` → **404 ERROR**
- Refresh page on any route → **404 ERROR**
- Missing hashed JS file: `index-Ba3JX9CD.js:1 Failed to load resource: 404`
- Pages load slowly or not at all

### Root Cause:
This is **NOT a React/Vite problem**.  
This is **NOT a Supabase problem**.  
This is a **server configuration problem**.

**Why:**
- Vite/React is a Single Page Application (SPA)
- All routes (`/customers`, `/dashboard`, etc.) are handled by React Router
- Server (Nginx) doesn't know this → looks for real files → returns 404
- Wrong deployment method → old hashed JS files → 404

---

## ✅ PERMANENT FIX #1: Nginx Configuration

### Step 1: SSH Into Your DigitalOcean Server

```bash
ssh root@your_server_ip
```

### Step 2: Open Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/default
```

### Step 3: Add SPA Routing Configuration

Inside the `server {}` block, find the `location /` section and update it:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name yourdomain.com www.yourdomain.com;
    
    # Root directory (where your dist files are)
    root /var/www/html;
    
    # Index file
    index index.html;
    
    # ⭐ THIS IS THE CRITICAL LINE ⭐
    # Always return index.html for any route
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets (JS, CSS, images) for 1 year
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Don't cache index.html (so users always get latest version)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Gzip compression (faster load times)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### Step 4: Test Nginx Configuration

```bash
sudo nginx -t
```

**Expected output:**
```
nginx: configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 5: Restart Nginx

```bash
sudo systemctl restart nginx
```

### Step 6: Verify Status

```bash
sudo systemctl status nginx
```

Should show: `active (running)`

---

## ✅ PERMANENT FIX #2: Correct Deployment Workflow

### ❌ WRONG WAY (Causes 404s):
```bash
# DON'T DO THIS
git pull
npm run build
# Upload random files
# Mix old + new files
```

**Problems:**
- Old hashed JS files remain
- New build references different hashes
- Browser requests `index-Ba3JX9CD.js` but server has `index-Cx7KLm9D.js`
- Result: **404 ERROR**

---

### ✅ CORRECT WAY (Zero 404s):

#### **Option A: Manual Deployment (Simple)**

```bash
# 1. On your local machine - Clean build
rm -rf dist
npm run build

# 2. SSH into server
ssh root@your_server_ip

# 3. Delete ALL old files
sudo rm -rf /var/www/html/*

# 4. Exit SSH
exit

# 5. Upload new dist files (using SCP)
scp -r dist/* root@your_server_ip:/var/www/html/

# 6. Verify files uploaded
ssh root@your_server_ip "ls -la /var/www/html"

# 7. Hard refresh browser (Ctrl+Shift+R)
```

#### **Option B: Using SFTP (FileZilla, WinSCP)**

1. **Build locally:**
   ```bash
   rm -rf dist
   npm run build
   ```

2. **Connect via SFTP:**
   - Host: `sftp://your_server_ip`
   - Username: `root`
   - Port: `22`

3. **Delete old files from `/var/www/html/`**

4. **Upload ONLY `dist/*` contents to `/var/www/html/`**
   - ⚠️ Upload the **contents** of `dist`, not the `dist` folder itself
   - Should see: `index.html`, `assets/`, `manifest.webmanifest`, etc.

5. **Hard refresh browser**

#### **Option C: Automated Script (BEST)**

Create `deploy.sh` in your project root:

```bash
#!/bin/bash

# COPCCA CRM - Automated Deployment Script
# This script ensures clean, zero-404 deployments

SERVER_IP="your_server_ip"
SERVER_USER="root"
SERVER_PATH="/var/www/html"

echo "🚀 Starting COPCCA CRM Deployment..."
echo ""

# Step 1: Clean local build
echo "🧹 Cleaning old build..."
rm -rf dist
echo "✅ Old build cleaned"
echo ""

# Step 2: Build fresh
echo "🔨 Building production bundle..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi
echo "✅ Build successful"
echo ""

# Step 3: Clean server files
echo "🗑️  Cleaning server files..."
ssh ${SERVER_USER}@${SERVER_IP} "rm -rf ${SERVER_PATH}/*"
echo "✅ Server cleaned"
echo ""

# Step 4: Upload new files
echo "📦 Uploading new files..."
scp -r dist/* ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
if [ $? -ne 0 ]; then
    echo "❌ Upload failed. Check SSH connection."
    exit 1
fi
echo "✅ Files uploaded"
echo ""

# Step 5: Verify deployment
echo "🔍 Verifying deployment..."
ssh ${SERVER_USER}@${SERVER_IP} "ls -la ${SERVER_PATH} | head -20"
echo ""

echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Visit your site and hard refresh (Ctrl+Shift+R)"
echo "📝 Check browser console for any errors"
echo ""
```

Make it executable:
```bash
chmod +x deploy.sh
```

Use it:
```bash
./deploy.sh
```

---

## ✅ PERMANENT FIX #3: Vite Configuration

### If Deploying to Root (yourdomain.com/)

`vite.config.ts` should have:

```typescript
export default defineConfig({
  base: '/', // ← This is correct for root domain
  // ... rest of config
});
```

### If Deploying to Subfolder (yourdomain.com/app/)

`vite.config.ts` should have:

```typescript
export default defineConfig({
  base: '/app/', // ← Match your subfolder path
  // ... rest of config
});
```

**⚠️ CRITICAL:** If `base` is wrong, ALL JS/CSS will 404 forever.

**Verify in your project:**

```bash
# Check current base setting
grep -A 2 "base:" vite.config.ts
```

**After changing base, ALWAYS rebuild:**

```bash
rm -rf dist
npm run build
```

---

## 🧪 TESTING CHECKLIST

### After Deployment, Test These:

- [ ] **Home page loads:** `yourdomain.com`
- [ ] **Direct route access:** `yourdomain.com/customers`
- [ ] **Refresh on route:** Visit `/dashboard` → press F5
- [ ] **Deep link:** Visit `yourdomain.com/sales-hub` directly
- [ ] **Browser console:** Should be **ZERO errors** (production mode)
- [ ] **Network tab:** All JS/CSS files load (200 status)
- [ ] **Hard refresh:** Ctrl+Shift+R on all pages

### Success Criteria:

✅ All routes load instantly  
✅ Zero 404 errors in console  
✅ Zero missing resources  
✅ Refreshing any page works  
✅ Direct links work  

---

## 🔥 TROUBLESHOOTING

### Problem: Still Getting 404 on Routes

**Check:**
1. Nginx `try_files` directive is correct
2. Nginx restarted: `sudo systemctl restart nginx`
3. Browser cache cleared (Ctrl+Shift+R)
4. Correct domain in `server_name`

**Debug:**
```bash
# Check Nginx error log
sudo tail -f /var/www/nginx/error.log

# Check if index.html exists
ls -la /var/www/html/index.html
```

---

### Problem: Still Getting 404 on Hashed JS Files

**Check:**
1. Old files deleted before uploading new ones
2. Uploaded **contents** of `dist`, not `dist` folder itself
3. Files uploaded to correct path: `/var/www/html/`
4. Hard refresh browser (Ctrl+Shift+R)

**Debug:**
```bash
# List files on server
ssh root@your_server_ip "ls -la /var/www/html"

# Check what JS files exist
ssh root@your_server_ip "ls -la /var/www/html/assets/*.js"

# Compare with what browser requests (check Network tab)
```

**Fix:**
```bash
# Clean deploy
rm -rf dist
npm run build
ssh root@your_server_ip "rm -rf /var/www/html/*"
scp -r dist/* root@your_server_ip:/var/www/html/
```

---

### Problem: Pages Load Slowly

**Causes:**
1. No gzip compression → Large file downloads
2. No caching → Re-downloads everything
3. 404 retries → Browser waits for timeouts

**Fix:**
- Enable gzip in Nginx (see config above)
- Enable cache headers (see config above)
- Fix 404s using this guide

---

### Problem: SSL/HTTPS Issues

**If using Let's Encrypt:**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew (add to crontab)
sudo certbot renew --dry-run
```

**Nginx will auto-update to:**
- Listen on port 443 (HTTPS)
- Redirect HTTP → HTTPS
- Include SSL certificates

---

## 🚀 ALTERNATIVE: ZERO-CONFIG HOSTING

Instead of manual Nginx setup, use:

### **Option 1: DigitalOcean App Platform**

**Steps:**
1. Create App in DigitalOcean dashboard
2. Connect GitHub repo
3. Select "Static Site"
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

**Benefits:**
- ✅ Auto-handles SPA routing
- ✅ Auto-deployments on git push
- ✅ Built-in CDN
- ✅ Free SSL
- ✅ Zero server config

**Cost:** ~$5/month

---

### **Option 2: Vercel (Frontend Only)**

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts

**Benefits:**
- ✅ Zero config needed
- ✅ Auto SPA routing
- ✅ Deploy on git push
- ✅ Free tier available
- ✅ Global CDN

**Keep Supabase for backend** (unchanged)

---

### **Option 3: Netlify**

**Steps:**
1. Connect GitHub repo
2. Build: `npm run build`
3. Publish: `dist`
4. Deploy

**Benefits:**
- ✅ Auto SPA routing via `_redirects`
- ✅ Free tier
- ✅ Auto deployments
- ✅ Built-in CDN

---

## 📋 DEPLOYMENT CHECKLIST (Print This)

### Before Every Deployment:

- [ ] Run `rm -rf dist` (clean old build)
- [ ] Run `npm run build` (fresh build)
- [ ] Check `vite.config.ts` base path is correct
- [ ] Check no TypeScript errors
- [ ] Test locally with `npm run preview`

### During Deployment:

- [ ] SSH into server: `ssh root@your_server_ip`
- [ ] Delete old files: `sudo rm -rf /var/www/html/*`
- [ ] Upload new files: `scp -r dist/* root@ip:/var/www/html/`
- [ ] Verify files: `ls -la /var/www/html`
- [ ] Check Nginx running: `systemctl status nginx`

### After Deployment:

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Test all routes
- [ ] Check browser console (zero errors)
- [ ] Test on mobile/different browser
- [ ] Confirm with team

---

## 🎯 FINAL NOTES

### This Guide Fixes:

✅ 404 on routes (`/customers`, `/dashboard`)  
✅ 404 on refresh  
✅ 404 on hashed JS files (`index-Ba3JX9CD.js`)  
✅ Slow page loads  
✅ Deployment confusion  

### One-Time Setup:

1. Configure Nginx (see Section 1)
2. Choose deployment method (see Section 2)
3. Verify Vite config (see Section 3)
4. Test (see Section 4)

### Every Deployment After:

1. Clean build: `rm -rf dist && npm run build`
2. Clean server: `rm -rf /var/www/html/*`
3. Upload: `scp -r dist/* root@ip:/var/www/html/`
4. Hard refresh browser

---

## 🔗 Related Documentation

- [ZERO-ERRORS-SYSTEM.md](ZERO-ERRORS-SYSTEM.md) - Client-side error handling
- [DEPLOYMENT.md](DEPLOYMENT.md) - General deployment guide
- [SYSTEM-ERROR-ELIMINATION.md](SYSTEM-ERROR-ELIMINATION.md) - PWA/cache fixes

---

**This setup is PERMANENT. Configure once, deploy forever with zero 404s.** ✅
