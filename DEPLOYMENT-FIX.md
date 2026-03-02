# COPCCA-CRM Deployment Configuration

## Current Setup

This project uses **Netlify** for deployment (not GitHub Pages).

### Deployment Files
- ✅ `netlify.toml` - Netlify configuration (active)
- ⚠️ `.github/workflows/deploy.yml` - GitHub Pages workflow (SHOULD BE DISABLED)
- ✅ `.github/workflows/netlify-deploy-check.yml` - Build verification only

## How Deployment Works

1. **Push to main branch** → Triggers Netlify auto-deploy
2. **Netlify builds** → Runs `npm run build` automatically
3. **Deploys to production** → Updates copcca.com (2-3 minutes)

## Fixing 404 Errors Permanently

### Root Cause
Vite generates new file hashes on each build (e.g., `index-abc123.js` → `index-xyz789.js`). 
If deployment is slow or incomplete, the HTML references files that don't exist yet.

### Solution 1: Verify Netlify Connection

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link your repo
netlify link

# Check status
netlify status
```

### Solution 2: Manual Deploy Command

Whenever you get 404 errors, run:

```bash
# Build and deploy immediately
netlify deploy --prod
```

This bypasses GitHub and deploys instantly.

### Solution 3: Disable GitHub Pages

1. Go to your **GitHub repo** → Settings → Pages
2. Under "Source", select **None**
3. Delete or rename `.github/workflows/deploy.yml` to `.github/workflows/deploy.yml.disabled`

This prevents conflicting deployments.

### Solution 4: Check Netlify Dashboard

Visit **[https://app.netlify.com](https://app.netlify.com)** and verify:

- ✅ Repository connected: `narotametro/Copccacrm`
- ✅ Branch: `main`
- ✅ Auto-publishing: **Enabled**
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist`

## Best Practices

1. **Wait 2-3 minutes** after pushing before checking production
2. Check **Netlify dashboard** for deployment status
3. Use **hard refresh** (Ctrl+Shift+R) to clear browser cache
4. If 404 persists, run **`netlify deploy --prod`** manually

## Troubleshooting

### Still getting 404s?

```bash
# Check latest deployment
netlify status

# View deployment logs
netlify deploy:list

# Force rebuild
netlify build

# Manual deploy
netlify deploy --prod
```

### Check if site is live

```bash
# Test production URL
curl -I https://copcca.com
```

### Verify build output

```bash
# Check dist/ folder exists
ls dist/

# Check index.html references
cat dist/index.html | Select-String -Pattern "assets/index"
```

## Quick Fix Command

If production shows 404 errors, run this single command:

```bash
netlify deploy --prod
```

This will build and deploy immediately, bypassing all automation.
