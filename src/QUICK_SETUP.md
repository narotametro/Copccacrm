# ⚡ COPCCA CRM - Quick Setup Guide

## 🚀 Deploy to DigitalOcean in 5 Minutes

### Step 1: Get Supabase Keys (2 min)

1. Go to: https://supabase.com/dashboard
2. Select project: `bpydcrdvytnnjzytkptd`
3. Click: **Settings** → **API**
4. Copy these 4 values:

```
Project URL:     https://bpydcrdvytnnjzytkptd.supabase.co
Project ID:      bpydcrdvytnnjzytkptd
anon/public:     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (click Reveal)
```

---

### Step 2: Add to DigitalOcean (2 min)

1. Go to: https://cloud.digitalocean.com/apps
2. Select your app → **Settings** → **Environment Variables**
3. Click **"Edit"** → Add these 4 variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://bpydcrdvytnnjzytkptd.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `[Your anon key from Step 1]` |
| `VITE_SUPABASE_PROJECT_ID` | `bpydcrdvytnnjzytkptd` |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | `[Your service_role key from Step 1]` |

4. Click **"Save and Redeploy"**

---

### Step 3: Fix Build Command (1 min)

Still in Settings:

1. Find **"Build Command"**
2. Click **"Edit"**
3. Change to: `npm run build`
4. Click **"Save"**

---

### Step 4: Deploy (5-10 min wait)

1. Push your code:
   ```bash
   git add .
   git commit -m "Deploy to DigitalOcean"
   git push
   ```

2. Wait for deployment to complete
3. Check build logs for: ✅ **"Build succeeded"**

---

### Step 5: Test (1 min)

1. Open your app URL
2. Try to login
3. If it works → **Done! 🎉**

---

## 📋 Complete Checklist

- [ ] Supabase keys copied
- [ ] Environment variables added to DigitalOcean
- [ ] Build command set to `npm run build`
- [ ] Code pushed to GitHub
- [ ] Deployment completed successfully
- [ ] App tested and working

---

## 🔧 Your Configuration

### DigitalOcean Settings

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Environment Variables:**
```
VITE_SUPABASE_URL=https://bpydcrdvytnnjzytkptd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=bpydcrdvytnnjzytkptd
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

### Supabase Configuration

**Project ID:** `bpydcrdvytnnjzytkptd`
**Project URL:** `https://bpydcrdvytnnjzytkptd.supabase.co`
**Edge Function:** `make-server-a2294ced`
**Database Table:** `kv_store_a2294ced`

---

## 🚨 If Something Goes Wrong

### Build Fails
- Check build command is just: `npm run build`
- Check environment variables are set
- See: `/DIGITALOCEAN_BUILD_FIX.md`

### Can't Login
- Check environment variables match Supabase keys
- Check browser console for errors
- See: `/DIGITALOCEAN_SUPABASE_CONNECTION.md`

### 404 Errors
- Check Edge Function is deployed
- Run: `supabase functions deploy make-server-a2294ced`

---

## 📚 Full Documentation

- **Build Issues:** `/DIGITALOCEAN_BUILD_FIX.md`
- **Connection Guide:** `/DIGITALOCEAN_SUPABASE_CONNECTION.md`
- **All Commands:** `/COMPLETE_COMMAND_REFERENCE.md` (see previous response)

---

## 🎯 That's It!

Your COPCCA CRM is now deployed! 🚀

**Frontend:** DigitalOcean ($5/month)
**Backend:** Supabase (Free tier)
**Total Cost:** ~$5/month

Access your admin dashboard at: `https://your-app.ondigitalocean.app/#/copcca-admin`

---

## 💡 Pro Tips

1. **Bookmark these:**
   - Your app: `https://your-app.ondigitalocean.app`
   - DigitalOcean: `https://cloud.digitalocean.com`
   - Supabase: `https://supabase.com/dashboard`

2. **Deploy updates:**
   ```bash
   git add .
   git commit -m "Update message"
   git push
   ```
   (Auto-deploys in 5-10 minutes)

3. **Monitor logs:**
   - DigitalOcean: App → Runtime Logs
   - Supabase: Functions → make-server-a2294ced → Logs

4. **Backup your keys:**
   - Save Supabase keys in a password manager
   - Never commit them to GitHub

---

**Questions? Check the full guides or test locally first!** ✅
