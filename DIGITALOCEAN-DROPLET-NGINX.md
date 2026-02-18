# DigitalOcean Droplet + Nginx Deployment Guide

## Problem You're Experiencing

**Error:**
```
Failed to load resource: the server responded with a status of 404
- SalesHub-BIM2FC-q.js
- printer-qMDhRGAD.js
- receipt-B5iUG7FH.js
```

**Root Cause:** Nginx is not serving the `/assets/` folder correctly. Your `index.html` loads, but when React tries to lazy-load page chunks, the server returns 404.

---

## Step-by-Step Fix

### 1. Build Correctly (On Your Local Computer)

```powershell
# Clean old build
Remove-Item -Path dist -Recurse -Force -ErrorAction SilentlyContinue

# Build fresh
npm run build

# Verify you have these files:
dir dist
```

**You MUST see:**
```
dist/
├── index.html
├── manifest.webmanifest
├── sw.js
├── workbox-[hash].js
└── assets/
    ├── SalesHub-DqCOY_cK.js       ← NEW HASH
    ├── printer-BWNnjy-z.js         ← NEW HASH
    ├── receipt-DgokgqDW.js         ← NEW HASH
    ├── index-9ySWKxWm.js
    ├── index-D87d7DYR.css
    └── ... (many more files)
```

**⚠️ CRITICAL:** Notice the hash names have **changed** from your old build. This is why you get 404s — old service worker requests old hashes.

---

### 2. Upload Full `dist/` Folder to DigitalOcean

**Option A: Using SFTP (FileZilla, WinSCP)**

1. Connect to your DigitalOcean droplet
2. Navigate to: `/var/www/copcca/` (or wherever your app is)
3. **Delete old files first:**
   ```bash
   rm -rf /var/www/copcca/*
   ```
4. Upload **entire `dist/` folder contents**:
   - `index.html`
   - `manifest.webmanifest`
   - `sw.js`
   - `workbox-[hash].js`
   - **`assets/` folder with ALL files inside**

**Option B: Using SCP from PowerShell**

```powershell
# From your local computer
scp -r dist/* root@your-server-ip:/var/www/copcca/
```

Replace `your-server-ip` with your actual IP.

**Option C: Using rsync (Best for Updates)**

```powershell
# From WSL or Git Bash
rsync -avz --delete dist/ root@your-server-ip:/var/www/copcca/
```

---

### 3. Fix Nginx Configuration (CRITICAL!)

SSH into your DigitalOcean droplet:

```bash
ssh root@your-server-ip
```

#### Check Current Nginx Config

```bash
# Find your site config (usually one of these)
cat /etc/nginx/sites-available/copcca
# OR
cat /etc/nginx/sites-available/default
# OR
cat /etc/nginx/nginx.conf
```

#### Correct Nginx Config for React SPA

**Create/Edit your site config:**

```bash
sudo nano /etc/nginx/sites-available/copcca
```

**Use this configuration:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name copcca.com www.copcca.com;

    # Point to where you uploaded dist files
    root /var/www/copcca;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # React Router fallback (CRITICAL for SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Serve assets with aggressive caching
    location /assets/ {
        try_files $uri =404;
        access_log off;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Service worker and manifest should NOT be cached
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    location = /manifest.webmanifest {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    location ~* ^/workbox-.+\.js$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }
}
```

**If you have SSL (HTTPS) with Let's Encrypt:**

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name copcca.com www.copcca.com;

    ssl_certificate /etc/letsencrypt/live/copcca.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/copcca.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/copcca;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        try_files $uri =404;
        access_log off;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    location = /manifest.webmanifest {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    location ~* ^/workbox-.+\.js$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name copcca.com www.copcca.com;
    return 301 https://$server_name$request_uri;
}
```

#### Enable the Site (if not already enabled)

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/copcca /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

#### Reload Nginx

```bash
sudo systemctl reload nginx

# Or restart if reload doesn't work
sudo systemctl restart nginx
```

---

### 4. Verify Server Files

**On your DigitalOcean server, check that files exist:**

```bash
# List uploaded files
ls -lah /var/www/copcca/

# Check assets folder
ls -lah /var/www/copcca/assets/ | head -20

# Verify a specific chunk file exists
ls -lah /var/www/copcca/assets/SalesHub-*.js
```

**You should see:**
```
-rw-r--r-- 1 www-data www-data 184K Feb 18 10:30 SalesHub-DqCOY_cK.js
-rw-r--r-- 1 www-data www-data  47K Feb 18 10:30 printer-BWNnjy-z.js
```

**If files are missing:** Re-upload the `dist/` folder.

---

### 5. Test Direct Asset Access

**From your browser, try to open:**

```
https://copcca.com/assets/SalesHub-DqCOY_cK.js
```

**Expected Result:**
- Browser shows/downloads JavaScript code
- **OR** you see the JS content directly

**If you get 404:**
- Either the file doesn't exist on server
- Or Nginx `root` path is wrong

**Common mistake:**

```nginx
# WRONG (if you uploaded to /var/www/copcca/dist/)
root /var/www/copcca;

# CORRECT
root /var/www/copcca/dist;
```

Or vice versa — your `root` must point to the **exact folder containing index.html and assets/**.

---

### 6. Clear Service Worker Cache (On Your Browser)

The new service worker will auto-update, but for immediate testing:

**Manual Clear (Fastest):**
1. Open https://copcca.com
2. Press `F12` (DevTools)
3. Go to **Application** tab
4. **Service Workers** → Click **Unregister**
5. **Storage** → Click **Clear site data**
6. Close DevTools
7. Press `Ctrl + F5` (hard refresh)

**Or Use Incognito:**
- `Ctrl + Shift + N` → Visit https://copcca.com → Test

---

## Common DigitalOcean Mistakes

### Mistake 1: Wrong Root Path

**Symptom:** 404 for all assets

**Check:**
```bash
ls /var/www/copcca/index.html       # Should exist
ls /var/www/copcca/assets/          # Should exist
```

**If you deployed inside a `dist/` subfolder:**
```bash
ls /var/www/copcca/dist/index.html  # Exists here
```

Then your Nginx `root` must be:
```nginx
root /var/www/copcca/dist;  # ← Notice /dist
```

### Mistake 2: Only Uploaded `index.html`

**Symptom:** 404 for all `.js` files

**Check:**
```bash
ls /var/www/copcca/assets/
```

If empty or missing → **Re-upload entire `dist/` folder**

### Mistake 3: File Permissions

**Symptom:** 403 Forbidden or 404 even though files exist

**Fix:**
```bash
sudo chown -R www-data:www-data /var/www/copcca/
sudo chmod -R 755 /var/www/copcca/
```

---

## Summary: What You Must Do RIGHT NOW

1. **SSH into DigitalOcean:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Check if assets folder exists:**
   ```bash
   ls -lah /var/www/copcca/assets/ | head -20
   ```
   - **If missing:** Re-upload `dist/` folder from local computer

3. **Fix Nginx config:**
   ```bash
   sudo nano /etc/nginx/sites-available/copcca
   ```
   - Add the config from **Step 3** above
   - Save: `Ctrl + X`, then `Y`, then `Enter`

4. **Test and reload Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Test in browser:**
   - Direct asset: https://copcca.com/assets/index-9ySWKxWm.js
   - Should download/show JS code (not 404)

6. **Clear browser cache:**
   - `F12` → Application → Unregister service worker → Clear site data
   - `Ctrl + F5` hard refresh

---

**Once fixed, future deployments are simple** — just upload new `dist/` and the Network-First cache strategy ensures users get updates automatically.
