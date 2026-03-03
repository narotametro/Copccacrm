# ⚡ QUICK FIX - DigitalOcean 404 Errors

**Problem:** Routes return 404, hashed JS files not found  
**Cause:** Server configuration, not React/Vite  
**Solution:** 5-minute one-time fix

---

## 🎯 WHICH SETUP DO YOU HAVE?

### **Option 1: App Platform** (Recommended - Easier)
- You deployed via DigitalOcean dashboard
- No SSH/server management
- Automatic deployments on git push
- **→ Jump to [App Platform Setup](#-app-platform-setup-2-minutes)**

### **Option 2: Droplet (Manual Server)**
- You have a VPS/Droplet
- You SSH into the server
- You manage Nginx manually
- **→ Jump to [Droplet Setup](#-droplet-setup-5-minutes)**

---

## 🚀 APP PLATFORM SETUP (2 Minutes)

**If you're using DigitalOcean App Platform, this is MUCH easier.**

### Step 1: Fix Vite Config (One-Time)

Open `vite.config.ts` and verify:

```typescript
export default defineConfig({
  base: '/',  // ✅ For root domain (domain.com)
  // If deploying to subfolder: base: '/app/'
});
```

**If you changed this, rebuild:**
```bash
rm -rf dist && npm run build
```

### Step 2: Set Build Settings in App Platform

Go to: **DigitalOcean → App Platform → Your App → Settings**

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

⚠️ **CRITICAL:** If Output Directory is wrong → JS files will 404 forever.

### Step 3: Add SPA Rewrite Rule (Fixes Route 404s)

Go to: **App → Settings → Components → [Your App] → HTTP Routes**

Click **Add Route** (or **Edit Route**):

```
Source:      /*
Destination: /index.html
Type:        Rewrite (Internal)
```

**What this does:**
- User visits `/customers` → App Platform serves `index.html`
- React Router handles the route
- Zero 404s on routes

**Save Settings**

### Step 4: Deploy Fresh Build

```bash
# Clean build
rm -rf dist && npm run build

# Push to Git (triggers auto-deploy)
git add -A
git commit -m "Fix SPA routing"
git push origin main
```

**Wait for deployment to complete (~2 minutes)**

### Step 5: Clear Browser Cache

```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

✅ **Done! Zero 404s forever.**

---

## 🔧 DROPLET SETUP (5 Minutes)

### Step 1: Fix Nginx Configuration

```bash
# SSH into your server
ssh root@your_server_ip

# Edit Nginx config
sudo nano /etc/nginx/sites-available/default
```

**Find this section:**
```nginx
location / {
    # ... existing config
}
```

**Replace with:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Save:** Ctrl+O, Enter, Ctrl+X

### Step 2: Restart Nginx

```bash
# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Exit SSH
exit
```

✅ **Done! Routes now work forever.**

---

## 🚀 EVERY DEPLOYMENT (3 Commands)

### Option A: Manual (Simple)

```bash
# 1. Clean build
rm -rf dist && npm run build

# 2. Upload
scp -r dist/* root@your_server_ip:/var/www/html/

# 3. Hard refresh browser (Ctrl+Shift+R)
```

### Option B: Automated (One Command)

```bash
# 1. Edit deploy.sh - set your SERVER_IP
nano deploy.sh

# 2. Make executable (one time)
chmod +x deploy.sh

# 3. Deploy (every time)
./deploy.sh
```

✅ **Done! Zero 404s guaranteed.**

---

## 📋 TROUBLESHOOTING

### App Platform: Still Getting 404?

**Check Build Settings:**
```
App → Settings → Build Command = npm run build
App → Settings → Output Directory = dist
```

**Check Rewrite Rule:**
```
App → Settings → HTTP Routes
Should have: /* → /index.html (Rewrite)
```

**Check Vite Config:**
```typescript
// vite.config.ts
base: '/'  // Must match your setup
```

**Force Clean Deploy:**
```bash
# Delete dist locally
rm -rf dist

# Clean build
npm run build

# Force push
git add -A
git commit -m "Force clean deploy"
git push origin main --force
```

**Clear Browser Cache:**
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

Or try incognito/private window
```

---

### Droplet: Still Getting 404?

**Check if files exist on server:**
```bashS

### **App Platform:**
- Add rewrite rule: `/* → /index.html`
- Set output directory: `dist`
- Automatic deployments on git push
- **Easiest option - no server management**

### **Droplet (Manual):**
- Add to Nginx: `try_files $uri $uri/ /index.html;`
- Manual file deployment via SCP/SFTP
- Full server control

**Both fix the same problem: Server must return `index.html` for all routes.**hould show: try_files $uri $uri/ /index.html;
```

**Clear server completely, re-upload:**
```bash
ssh root@your_server_ip "rm -rf /var/www/html/*"
scp -r dist/* root@your_server_ip:/var/www/html/
```

**Check Vite Config:**
```bash
# Should be base: '/' for root domain
grep "base:" vite.config.ts

# If deploying to subfolder (/app/), use:
# base: '/app/'
```

---

## 📚 FULL DOCUMENTATION

- **[DIGITALOCEAN-DEPLOYMENT-GUIDE.md](DIGITALOCEAN-DEPLOYMENT-GUIDE.md)** - Complete guide with explanations
- **[nginx-copcca.conf](nginx-copcca.conf)** - Full Nginx config template
- **[deploy.sh](deploy.sh)** - Automated deployment script

---

## ✅ VERIFICATION CHECKLIST

After deployment, test:

- [ ] Visit `yourdomain.com` → Loads
- [ ] Visit `yourdomain.com/customers` → Loads (not 404)
- [ ] Refresh on any page → Still loads
- [ ] Browser console → Zero 404 errors
- [ ] Network tab → All JS/CSS files load (200 status)

---

## 🎯 KEY TAKEAWAY

**Server must always return `index.html` for SPA routing.**

This one line fixes everything:
```nginx
try_files $uri $uri/ /index.html;
```

**Configure once. Deploy forever. Zero 404s.** ✅
