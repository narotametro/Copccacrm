# 🔍 COPCCA CRM - Troubleshooting Guide

## 🚨 Common Issues and Solutions

---

## Issue #1: Build Fails on DigitalOcean

### Symptoms:
```
❌ build failed
error during build:
ERROR: Expected ">" but found "className"
bash: Testing: command not found
```

### Solution:

1. **Fix Build Command**
   - Go to: DigitalOcean → Your App → Settings
   - Find: "Build Command"
   - Change to: `npm run build` (only those 3 words!)
   - Save

2. **Push Fixed Code**
   ```bash
   git add .
   git commit -m "Fix build error"
   git push
   ```

3. **Wait 5-10 minutes** for rebuild

**Status:** ✅ Fixed in latest code

---

## Issue #2: Login Fails / White Screen

### Symptoms:
- Login button doesn't work
- White screen after login
- "Failed to fetch" error
- Infinite loading

### Check 1: Environment Variables

1. **Go to:** DigitalOcean → Your App → Settings → Environment Variables
2. **Verify all 4 are set:**

```
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
✅ VITE_SUPABASE_PROJECT_ID
✅ VITE_SUPABASE_SERVICE_ROLE_KEY
```

3. **If any are missing:**
   - Click "Edit"
   - Add missing variables (see `/QUICK_SETUP.md`)
   - Click "Save and Redeploy"

---

### Check 2: Browser Console

1. **Open your app**
2. **Press F12** → Console tab
3. **Look for errors:**

**Error:** `Failed to fetch`
**Fix:** Check Supabase URL in environment variables

**Error:** `Invalid API key` / `401 Unauthorized`
**Fix:** Check anon key in environment variables

**Error:** `CORS policy`
**Fix:** Add your domain to Supabase CORS settings

**Error:** `undefined is not an object`
**Fix:** Clear browser cache and reload

---

### Check 3: Network Tab

1. **Press F12** → Network tab
2. **Try to login**
3. **Look for requests to Supabase:**

```
✅ Status 200 = Working
❌ Status 401 = Wrong API key
❌ Status 404 = Wrong URL or function not deployed
❌ Status 500 = Server error
```

---

## Issue #3: Can't Access After Deployment

### Symptoms:
- "Application Error"
- "Service Unavailable"
- 502 Bad Gateway
- App won't load

### Solution 1: Check Deployment Status

1. **Go to:** DigitalOcean → Your App
2. **Check status:**
   - ✅ Green = Running
   - 🟡 Yellow = Deploying
   - 🔴 Red = Failed

3. **If failed:**
   - Click on failed deployment
   - Read error logs
   - Fix the error
   - Redeploy

---

### Solution 2: Check Runtime Logs

1. **Go to:** DigitalOcean → Your App → Runtime Logs
2. **Look for errors:**

**Common errors:**
```
Error: Cannot find module
→ Run: npm install

Error: ENOENT: no such file or directory
→ Check file paths in code

Error: Port already in use
→ DigitalOcean handles this automatically
```

---

## Issue #4: Data Not Saving / Loading

### Symptoms:
- Form submissions fail
- Data disappears after refresh
- "Error saving data"
- Empty dashboard

### Check 1: Supabase Connection

**Test in browser console:**
```javascript
// Open your app, press F12, paste this:
fetch('https://bpydcrdvytnnjzytkptd.supabase.co/functions/v1/make-server-a2294ced/health')
  .then(r => r.json())
  .then(d => console.log('✅ Connected:', d))
  .catch(e => console.error('❌ Failed:', e));
```

**Expected:** `✅ Connected: {status: "ok"}`

---

### Check 2: Edge Function Deployed

**In terminal:**
```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref bpydcrdvytnnjzytkptd

# Deploy function
supabase functions deploy make-server-a2294ced

# Check logs
supabase functions logs make-server-a2294ced
```

---

### Check 3: Database Table Exists

**In Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard
2. Select project
3. Click: **Table Editor** (left sidebar)
4. Check if table exists: `kv_store_a2294ced`

**If missing:**
- The backend should create it automatically
- Check Edge Function logs for errors

---

## Issue #5: Subscription Gate Blocks Login

### Symptoms:
- Can't login even with correct credentials
- Stuck at "Checking subscription status..."
- "Payment required" message won't go away

### Solution: Temporary Bypass

**For development/testing only:**

1. **Open:** `/components/SubscriptionGate.tsx`
2. **Find this line (around line 10):**
   ```typescript
   const TEMPORARILY_DISABLE_SUBSCRIPTION = false;
   ```
3. **Change to:**
   ```typescript
   const TEMPORARILY_DISABLE_SUBSCRIPTION = true;
   ```
4. **Save and push:**
   ```bash
   git add .
   git commit -m "Temporarily disable subscription gate"
   git push
   ```

**⚠️ WARNING:** This disables payment checks. Use only for testing!

**Re-enable for production:**
Set back to `false` before launching to real users.

---

## Issue #6: Admin Dashboard Not Working

### Symptoms:
- `/copcca-admin` shows 404
- Admin page blank
- Can't manage users

### Check URL Hash

**Wrong:** `https://your-app.com/copcca-admin` ❌
**Correct:** `https://your-app.com/#/copcca-admin` ✅

Note the `#` before `/copcca-admin`

---

### Check Authentication

1. **Login as admin first**
2. **Then navigate to:** `#/copcca-admin`
3. **If still doesn't work:**
   - Check browser console for errors
   - Verify Edge Function has admin routes

---

## Issue #7: Slow Loading / Performance

### Symptoms:
- Long load times (>10 seconds)
- App feels sluggish
- Timeout errors

### Solution 1: Check Network Speed

**In browser:**
1. Press F12 → Network tab
2. Click the "No throttling" dropdown
3. Make sure it's set to "No throttling"

**If on slow network:**
- This is expected
- The initial load may take time
- Subsequent loads use cache (faster)

---

### Solution 2: Clear Cache

**In browser:**
```
Chrome: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
Firefox: Ctrl+Shift+Delete
Safari: Cmd+Option+E
```

Select:
- ✅ Cached images and files
- ✅ Site data
- Click "Clear data"

---

### Solution 3: Optimize DigitalOcean

**Upgrade plan if needed:**
- Basic ($5/mo) = 512MB RAM, 1 vCPU
- Professional ($12/mo) = 1GB RAM, 1 vCPU
- Professional XL ($24/mo) = 2GB RAM, 2 vCPU

For most use cases, Basic is sufficient.

---

## Issue #8: Changes Not Showing After Push

### Symptoms:
- Pushed code but no changes visible
- Old version still showing
- Git push succeeded but app unchanged

### Solution: Hard Refresh

**In browser:**
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

This clears cache and reloads the page.

---

### Check Deployment

1. **Go to:** DigitalOcean → Your App
2. **Check:** Last deployment time
3. **If old:**
   - Click "Actions" → "Force Rebuild and Deploy"
   - Wait 5-10 minutes

---

## Issue #9: Environment Variables Not Working

### Symptoms:
```
Error: VITE_SUPABASE_URL is undefined
Uncaught ReferenceError: import is not defined
```

### Common Mistakes:

**❌ Wrong:**
```
SUPABASE_URL=https://...          (missing VITE_ prefix)
VITE_SUPABASE_URL = https://...   (extra spaces)
vite_supabase_url=https://...     (lowercase)
```

**✅ Correct:**
```
VITE_SUPABASE_URL=https://...
```

---

### Fix:

1. **Go to:** DigitalOcean → Settings → Environment Variables
2. **Click "Edit"**
3. **Double-check:**
   - Exact spelling (case-sensitive!)
   - No extra spaces
   - Starts with `VITE_`
4. **Save and Redeploy**
5. **Wait 5-10 minutes**

---

## Issue #10: Git Push Rejected

### Symptoms:
```
! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs
```

### Solution:

**If you're the only developer:**
```bash
# Pull latest changes
git pull origin main

# If conflicts, resolve them, then:
git add .
git commit -m "Merge changes"
git push
```

**If pull also fails:**
```bash
# Force pull (⚠️ overwrites local changes)
git fetch --all
git reset --hard origin/main
git push
```

---

## 🧪 Testing Tools

### Browser Console Quick Tests

**Test 1: Check Environment Variables**
```javascript
console.log('Environment check:');
console.log('DEV mode:', import.meta.env.DEV);
console.log('All vars:', import.meta.env);
```

---

**Test 2: Test Supabase Connection**
```javascript
fetch('https://bpydcrdvytnnjzytkptd.supabase.co')
  .then(r => console.log('Supabase status:', r.status))
  .catch(e => console.error('Supabase error:', e));
```

---

**Test 3: Test Edge Function**
```javascript
fetch('https://bpydcrdvytnnjzytkptd.supabase.co/functions/v1/make-server-a2294ced/health', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweWRjcmR2eXRubmp6eXRrcHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODQwODEsImV4cCI6MjA3ODI2MDA4MX0.Y2f_jCqaFLIR6IlIiIJbXmefaEiMOYDJLG5KbLheM-c'
  }
})
  .then(r => r.json())
  .then(d => console.log('Edge Function:', d))
  .catch(e => console.error('Edge Function error:', e));
```

---

### Terminal Quick Tests

**Test Local Build:**
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build

# If build succeeds locally, it will work on DigitalOcean
```

---

**Test Edge Function:**
```bash
# Check if function exists
curl https://bpydcrdvytnnjzytkptd.supabase.co/functions/v1/make-server-a2294ced/health

# Expected: {"status":"ok"}
```

---

## 📊 Diagnostic Checklist

Run through this when debugging:

### Frontend (DigitalOcean)
- [ ] Build command is `npm run build`
- [ ] All 4 environment variables set
- [ ] Latest code pushed to GitHub
- [ ] Deployment succeeded
- [ ] No errors in browser console
- [ ] Hard refresh done (Ctrl+Shift+R)

### Backend (Supabase)
- [ ] Project is active
- [ ] Edge function deployed
- [ ] Database table exists
- [ ] API keys are correct
- [ ] CORS configured for your domain

### Connection
- [ ] Can ping Supabase URL
- [ ] Edge function health check passes
- [ ] Network requests return 200 OK
- [ ] No CORS errors

---

## 🆘 Emergency Recovery

### If Everything is Broken:

**Step 1: Verify Supabase is Up**
```
Check: https://status.supabase.com
```

**Step 2: Redeploy Everything**
```bash
# 1. Redeploy Edge Function
supabase functions deploy make-server-a2294ced

# 2. Force rebuild frontend
# In DigitalOcean: Actions → Force Rebuild and Deploy

# 3. Clear browser cache
# Ctrl+Shift+Delete → Clear everything
```

**Step 3: Test Locally**
```bash
# Clone fresh copy
git clone <your-repo-url> copcca-test
cd copcca-test
npm install
npm run build
npm run preview

# If works locally, issue is with deployment
# If fails locally, issue is with code
```

**Step 4: Check Basics**
- [ ] Internet connection working?
- [ ] Supabase project active?
- [ ] DigitalOcean app running?
- [ ] GitHub repo accessible?
- [ ] API keys not expired?

---

## 📞 Getting Help

### Before Asking for Help:

1. **Check these files:**
   - `/QUICK_SETUP.md` - Setup guide
   - `/DIGITALOCEAN_BUILD_FIX.md` - Build issues
   - `/DIGITALOCEAN_SUPABASE_CONNECTION.md` - Connection issues

2. **Collect this information:**
   - Exact error message
   - Browser console screenshot
   - DigitalOcean build logs
   - What you tried already

3. **Test these:**
   - Does it work locally?
   - Does Edge Function respond?
   - Are environment variables set?

---

### Support Resources:

- **Supabase Discord:** https://discord.supabase.com
- **DigitalOcean Community:** https://www.digitalocean.com/community
- **Stack Overflow:** Tag with `supabase` or `digitalocean`

---

## ✅ Success Indicators

Everything is working when:

1. ✅ Build completes in 5-10 minutes
2. ✅ No errors in browser console
3. ✅ Login works without delays
4. ✅ Data saves and loads correctly
5. ✅ Admin dashboard accessible at `#/copcca-admin`
6. ✅ All modules function properly
7. ✅ No 404 or 500 errors

---

## 🎯 Prevention Tips

### Avoid Common Issues:

1. **Always test locally first:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Use version control properly:**
   ```bash
   git status  # Check before committing
   git diff    # Review changes
   ```

3. **Keep environment variables in sync:**
   - Local `.env`
   - DigitalOcean settings
   - Supabase Edge Function secrets

4. **Monitor deployments:**
   - Watch build logs
   - Check for warnings
   - Test immediately after deploy

5. **Regular backups:**
   ```bash
   # Backup code
   git push

   # Backup Supabase data
   # Use Supabase dashboard export feature
   ```

---

**Most issues can be solved by checking environment variables and redeploying!** 🚀
