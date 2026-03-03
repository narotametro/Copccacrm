# ⚡ QUICK FIX - DigitalOcean 404 Errors

**Problem:** Routes return 404, hashed JS files not found  
**Cause:** Server configuration, not React/Vite  
**Solution:** 5-minute one-time fix

---

## 🔧 ONE-TIME SETUP (5 Minutes)

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

### Still Getting 404?

```bash
# Check if files exist on server
ssh root@your_server_ip "ls -la /var/www/html"

# Clear server completely, re-upload
ssh root@your_server_ip "rm -rf /var/www/html/*"
scp -r dist/* root@your_server_ip:/var/www/html/

# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Check Vite Config

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
