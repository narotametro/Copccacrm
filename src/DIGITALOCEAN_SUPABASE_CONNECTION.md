# 🔗 Connect DigitalOcean to Supabase - Complete Guide

## 📋 Overview

Your COPCCA CRM has:
- **Frontend:** Deployed on DigitalOcean
- **Backend:** Running on Supabase (Database + Edge Functions)

You need to connect them using **environment variables**.

---

## 🔑 Step 1: Get Your Supabase Credentials

### Go to Supabase Dashboard

1. **Login to Supabase:** https://supabase.com/dashboard
2. **Select your project:** `bpydcrdvytnnjzytkptd`
3. **Go to Settings** (gear icon in left sidebar)
4. **Click "API"** in the settings menu

---

### Copy These Values:

You'll see these on the API settings page:

#### **1. Project URL**
```
https://bpydcrdvytnnjzytkptd.supabase.co
```
**Location:** Under "Project URL"

#### **2. anon/public Key**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweWRjcmR2eXRubmp6eXRrcHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODQwODEsImV4cCI6MjA3ODI2MDA4MX0.Y2f_jCqaFLIR6IlIiIJbXmefaEiMOYDJLG5KbLheM-c
```
**Location:** Under "Project API keys" → "anon public"

#### **3. service_role Key** ⚠️ (Secret!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweWRjcmR2eXRubmp6eXRrcHRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjY4NDA4MSwiZXhwIjoyMDc4MjYwMDgxfQ...
```
**Location:** Under "Project API keys" → "service_role" → Click "Reveal"

**⚠️ WARNING:** Never share this key publicly! Only use in backend/server code.

---

## 🌐 Step 2: Add Environment Variables to DigitalOcean

### Go to DigitalOcean App Settings

1. **Login to DigitalOcean:** https://cloud.digitalocean.com
2. **Go to Apps** (left sidebar)
3. **Select your COPCCA CRM app**
4. **Click Settings tab** at the top
5. **Scroll to "App-Level Environment Variables"**
6. **Click "Edit"**

---

### Add These Environment Variables

Click **"Add Variable"** for each one:

#### **Variable 1: VITE_SUPABASE_URL**
```
Key:   VITE_SUPABASE_URL
Value: https://bpydcrdvytnnjzytkptd.supabase.co
Type:  Encrypted ✅
```

#### **Variable 2: VITE_SUPABASE_ANON_KEY**
```
Key:   VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweWRjcmR2eXRubmp6eXRrcHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODQwODEsImV4cCI6MjA3ODI2MDA4MX0.Y2f_jCqaFLIR6IlIiIJbXmefaEiMOYDJLG5KbLheM-c
Type:  Encrypted ✅
```

#### **Variable 3: VITE_SUPABASE_PROJECT_ID**
```
Key:   VITE_SUPABASE_PROJECT_ID
Value: bpydcrdvytnnjzytkptd
Type:  Encrypted ✅
```

#### **Variable 4: VITE_SUPABASE_SERVICE_ROLE_KEY** ⚠️
```
Key:   VITE_SUPABASE_SERVICE_ROLE_KEY
Value: [Your service_role key from Supabase]
Type:  Encrypted ✅
```

**⚠️ IMPORTANT:** Get this from Supabase Dashboard → Settings → API → service_role (click Reveal)

---

### Screenshot Reference

Your environment variables should look like this:

```
┌─────────────────────────────────┬────────────────────────────────┐
│ Key                             │ Value                          │
├─────────────────────────────────┼────────────────────────────────┤
│ VITE_SUPABASE_URL              │ https://bpydcrdv...  [Encrypted]│
│ VITE_SUPABASE_ANON_KEY         │ eyJhbGciOiJIUzI1... [Encrypted]│
│ VITE_SUPABASE_PROJECT_ID       │ bpydcrdvytnnjz...  [Encrypted]│
│ VITE_SUPABASE_SERVICE_ROLE_KEY │ eyJhbGciOiJIUzI1... [Encrypted]│
└─────────────────────────────────┴────────────────────────────────┘
```

---

### Save and Deploy

1. **Click "Save"** at the bottom
2. DigitalOcean will ask: **"Redeploy app?"**
3. **Click "Save and Redeploy"**
4. Wait 5-10 minutes for deployment

---

## ✅ Step 3: Verify the Connection

### Test 1: Check Deployment Success

1. Go to your DigitalOcean app dashboard
2. Wait for **"Build succeeded"** and **"Deploy succeeded"**
3. Click on your app URL (e.g., `https://your-app.ondigitalocean.app`)

---

### Test 2: Test Login

1. **Open your deployed app**
2. **Try to login** with your credentials
3. If it works → ✅ **Connection successful!**
4. If it fails → See troubleshooting below

---

### Test 3: Check Browser Console

1. **Open your app** in browser
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. Look for errors:

**✅ Good (no errors):**
```
No errors related to Supabase
```

**❌ Bad (connection failed):**
```
Error: Invalid API key
Error: Failed to fetch
Error: CORS policy
```

---

### Test 4: Check Network Tab

1. **Press F12** → **Network tab**
2. **Try to login**
3. Look for requests to:
   ```
   https://bpydcrdvytnnjzytkptd.supabase.co/...
   ```
4. **Check status codes:**
   - ✅ **200 OK** = Connection working
   - ❌ **401 Unauthorized** = Wrong API key
   - ❌ **404 Not Found** = Wrong URL
   - ❌ **500 Server Error** = Backend issue

---

## 🔧 Step 4: Update Code (If Needed)

Your code is already configured correctly! It uses the environment variables:

### Current Setup ✅

**File: `/utils/supabase/info.tsx`**
```typescript
export const projectId = "bpydcrdvytnnjzytkptd"
export const publicAnonKey = "eyJhbGci..."
```

**File: `/lib/supabase-client.ts`**
```typescript
const supabaseUrl = `https://${projectId}.supabase.co`;
createSupabaseClient(supabaseUrl, publicAnonKey);
```

**File: `/components/PasswordReset.tsx`**
```typescript
fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/...`)
```

**✅ This is correct!** No changes needed.

---

## 🎯 Complete Configuration Checklist

### DigitalOcean Settings

- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Environment Variables:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_SUPABASE_PROJECT_ID`
  - [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY`

### Supabase Settings

- [ ] Edge Function deployed: `make-server-a2294ced`
- [ ] Database table exists: `kv_store_a2294ced`
- [ ] CORS enabled for your domain
- [ ] API keys are active (not expired)

---

## 🚨 Troubleshooting

### Issue 1: "Failed to fetch" Error

**Symptoms:**
```
Error: Failed to fetch
TypeError: NetworkError when attempting to fetch resource
```

**Causes:**
- Wrong Supabase URL
- Network/CORS issue

**Fix:**
1. Check `VITE_SUPABASE_URL` is correct
2. Verify Supabase project is active
3. Check if Supabase is down: https://status.supabase.com

---

### Issue 2: "Invalid API Key" Error

**Symptoms:**
```
Error: Invalid API key
401 Unauthorized
```

**Causes:**
- Wrong anon key
- Expired API key

**Fix:**
1. Go to Supabase → Settings → API
2. Copy the **anon/public key** again
3. Update `VITE_SUPABASE_ANON_KEY` in DigitalOcean
4. Redeploy

---

### Issue 3: CORS Error

**Symptoms:**
```
Access to fetch at 'https://bpydcrd...' has been blocked by CORS policy
```

**Causes:**
- Supabase CORS not configured for your domain

**Fix:**
1. Go to Supabase → Settings → API
2. Under "CORS Allowed Origins"
3. Add your DigitalOcean domain:
   ```
   https://your-app.ondigitalocean.app
   ```
4. Click "Save"

---

### Issue 4: Environment Variables Not Working

**Symptoms:**
```
Error: VITE_SUPABASE_URL is undefined
```

**Causes:**
- Variables not set in DigitalOcean
- Variable names have typos
- App not redeployed after adding variables

**Fix:**
1. Double-check variable names (case-sensitive!)
2. Ensure they start with `VITE_`
3. Click "Save and Redeploy"
4. Wait for full deployment

---

### Issue 5: Edge Function Not Found

**Symptoms:**
```
404 Not Found
/functions/v1/make-server-a2294ced/...
```

**Causes:**
- Edge function not deployed

**Fix:**
1. Deploy the function:
   ```bash
   supabase login
   supabase link --project-ref bpydcrdvytnnjzytkptd
   supabase functions deploy make-server-a2294ced
   ```

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Use encrypted environment variables
- ✅ Keep service_role key secret
- ✅ Use HTTPS only
- ✅ Enable Row Level Security (RLS) in Supabase

### ❌ DON'T:
- ❌ Commit API keys to GitHub
- ❌ Share service_role key
- ❌ Use service_role key in frontend
- ❌ Disable CORS

---

## 📊 Connection Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                           │
│                 (DigitalOcean App)                          │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │  React App (COPCCA CRM)                        │        │
│  │  - Login form                                  │        │
│  │  - Dashboard                                   │        │
│  │  - Modules                                     │        │
│  └────────────────────────────────────────────────┘        │
│                        │                                    │
│                        │ HTTPS                              │
│                        ▼                                    │
└────────────────────────────────────────────────────────────┘
                         │
                         │ API Calls
                         │ (with anon key)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Backend                               │
│    https://bpydcrdvytnnjzytkptd.supabase.co                │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │  Edge Function  │  │   Auth Service   │  │ Database  │ │
│  │  make-server-   │  │  (Login/Signup)  │  │ Postgres  │ │
│  │  a2294ced       │  │                  │  │           │ │
│  └─────────────────┘  └──────────────────┘  └───────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test API Connection Manually

### Using cURL (Terminal/Command Prompt)

Test if Supabase is reachable:

```bash
# Test 1: Health check
curl https://bpydcrdvytnnjzytkptd.supabase.co

# Test 2: Edge function health
curl https://bpydcrdvytnnjzytkptd.supabase.co/functions/v1/make-server-a2294ced/health

# Test 3: With authentication
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  https://bpydcrdvytnnjzytkptd.supabase.co/functions/v1/make-server-a2294ced/health
```

**Expected Response:**
```json
{"status": "ok"}
```

---

### Using Browser Console

1. **Open your deployed app**
2. **Press F12** → Console
3. **Paste and run:**

```javascript
// Test connection
fetch('https://bpydcrdvytnnjzytkptd.supabase.co/functions/v1/make-server-a2294ced/health', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweWRjcmR2eXRubmp6eXRrcHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODQwODEsImV4cCI6MjA3ODI2MDA4MX0.Y2f_jCqaFLIR6IlIiIJbXmefaEiMOYDJLG5KbLheM-c'
  }
})
.then(r => r.json())
.then(d => console.log('✅ Connection OK:', d))
.catch(e => console.error('❌ Connection Failed:', e));
```

---

## 📋 Quick Setup Summary

### 1. Get Credentials from Supabase
```
Supabase Dashboard → Settings → API
- Copy Project URL
- Copy anon/public key
- Copy service_role key
```

### 2. Add to DigitalOcean
```
DigitalOcean → Your App → Settings → Environment Variables
- VITE_SUPABASE_URL = https://bpydcrdvytnnjzytkptd.supabase.co
- VITE_SUPABASE_ANON_KEY = eyJhbGci...
- VITE_SUPABASE_PROJECT_ID = bpydcrdvytnnjzytkptd
- VITE_SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
```

### 3. Save and Redeploy
```
Click "Save and Redeploy"
Wait 5-10 minutes
```

### 4. Test
```
Open app → Try login
Check browser console for errors
```

---

## ✅ Success Indicators

You'll know the connection is working when:

1. ✅ **Login works** without errors
2. ✅ **Dashboard loads** with user data
3. ✅ **No console errors** related to Supabase
4. ✅ **Network requests** to Supabase return 200 OK
5. ✅ **Data saves** and loads correctly

---

## 🆘 Still Having Issues?

### Debug Checklist:

1. **Check Supabase status:** https://status.supabase.com
2. **Verify environment variables** in DigitalOcean
3. **Check build logs** for errors
4. **Test Edge Function** directly with cURL
5. **Check browser console** for specific errors
6. **Verify Supabase project** is active

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **DigitalOcean Docs:** https://docs.digitalocean.com/products/app-platform/
- **Supabase Discord:** https://discord.supabase.com
- **DigitalOcean Community:** https://www.digitalocean.com/community

---

## 🎉 You're Done!

Once environment variables are set and the app is redeployed, your COPCCA CRM will be fully connected to Supabase and ready to use! 🚀

**Your deployed app:** `https://your-app.ondigitalocean.app`
**Your Supabase backend:** `https://bpydcrdvytnnjzytkptd.supabase.co`

**Everything should work seamlessly!** ✅
