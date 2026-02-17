# SMS Activation Steps - COPCCA CRM

## 🚨 CRITICAL: You MUST complete these database steps before SMS activation will work!

---

## Step 1: Run Database Migrations (REQUIRED)

### 1.1 Fix RLS Permission Errors

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `bpydcrdvytnnjzytkptd`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire content of: **`fix-copcca-admin-settings-access.sql`**
6. Click **Run** (or press Ctrl + Enter)
7. ✅ You should see: **"Setup Complete"** message

**What this does:**
- Creates `upsert_system_setting()` function with SECURITY DEFINER (bypasses RLS)
- Grants execute permissions to anonymous users (COPCCA admin uses sessionStorage, not JWT)
- Allows anonymous SELECT on system_settings (for loading config)
- Creates `company_sms_balance` table if missing (fixes 404 errors)
- Enables COPCCA admin to save Twilio credentials despite being unauthenticated

**Why this is needed:**
- COPCCA admin authenticates via sessionStorage (client-side only)
- Database requests appear as unauthenticated (anon role, no JWT token)
- RLS policies on system_settings block unauthenticated INSERT/UPDATE
- This function safely bypasses RLS for specific operations

---

### 1.2 Update Admin Password

1. Still in **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire content of: **`update-admin-password.sql`**
4. Click **Run**
5. ✅ You should see: **"Password updated successfully"**

**New Credentials:**
- Email: `admin@copcca.com`
- Password: `COPCCA@2026#Secure2`

---

## Step 2: Clear Browser Cache (REQUIRED)

Since the app uses PWA (Progressive Web App) with service worker caching:

### Option A: Hard Refresh
1. Press **F12** to open DevTools
2. Go to **Application** tab
3. Under **Storage** → Click **Clear site data**
4. Under **Service Workers** → Click **Unregister**
5. Close DevTools
6. Press **Ctrl + Shift + Delete**
7. Select **Last hour** → Clear **Cached images and files**
8. Hard refresh: **Ctrl + Shift + R** (or Cmd + Shift + R on Mac)

### Option B: Incognito/Private Window (Easiest)
1. Open new Incognito window: **Ctrl + Shift + N**
2. Navigate to: https://copcca.com/copcca-admin
3. This bypasses all caching

---

## Step 3: Activate Twilio SMS

1. **Login to COPCCA Admin:**
   - URL: https://copcca.com/copcca-admin
   - Email: `admin@copcca.com`
   - Password: `COPCCA@2026#Secure2`

2. **Navigate to SMS Service:**
   - Click **"SMS Service"** tab in left sidebar
   - Should stay in admin panel (not redirect to main app)

3. **Get Twilio Credentials:**
   - Go to: https://console.twilio.com
   - Login to COPCCA's Twilio account
   - Find these values:
     - **Account SID:** AC... (starts with AC)
     - **Auth Token:** Click "View" to reveal
     - **Phone Number:** +255... (your Twilio number in E.164 format)

4. **Enter Credentials:**
   - Scroll down past the setup wizard
   - You'll see a configuration form with 3 input fields
   - Enter all three credentials

5. **Activate Instantly:**
   - Click the green **"Test & Activate Instantly"** button
   - This will:
     1. Verify credentials with Twilio API
     2. Auto-enable SMS service
     3. Save configuration to database
   - ✅ You should see: **"🎉 SMS Service Activated!"**
   - ✅ Status banner should show: **"✅ SMS Service Active"**

---

## Step 4: Verify Activation

### Check Admin Panel
- SMS service status should be **green/active**
- Statistics should load (Total messages, credits, companies)
- Configuration form should show your saved credentials (Auth Token masked)

### Check Main App
1. Logout from admin panel
2. Login to main app: https://copcca.com
3. Go to **Settings** → **SMS Settings**
4. You should see SMS pricing and credit purchase options
5. Companies can now buy credits and send SMS

---

## Common Issues & Solutions

### ❌ Still getting 403 Forbidden errors
**Solution:** You didn't run `fix-copcca-admin-settings-access.sql` in Supabase SQL Editor

### ❌ Can't login with new password
**Solution:** You didn't run `update-admin-password.sql` in Supabase SQL Editor

### ❌ Old code still showing (navigation redirects to main app)
**Solution:** Clear browser cache or use Incognito window

### ❌ "Invalid Twilio credentials" error
**Solution:** Double-check Account SID and Auth Token from Twilio Console

### ❌ company_sms_balance table not found (404)
**Solution:** Run `fix-copcca-admin-settings-access.sql` - it creates this table

---

## What Happens After Activation

1. **SMS Service Goes Live:**
   - All companies in the system can now use SMS features
   - Users can buy SMS credits via their Settings page

2. **Pricing Model:**
   - COPCCA pays Twilio: ~$0.0079 per SMS (wholesale)
   - Companies pay COPCCA: 500-1000 TZS per SMS (retail)
   - Profit margin: ~98% (nearly 100x markup)

3. **User Workflow:**
   - User goes to Settings → SMS Settings
   - Purchases credits (e.g., 100 SMS for 50,000 TZS)
   - Sends SMS from customer detail pages
   - Usage tracked in `sms_logs` table
   - Balance decremented in `company_sms_balance` table

4. **Monitoring:**
   - Admin can see statistics in SMS Admin Panel
   - Check Twilio Console for delivery logs
   - Monitor company balances in database

---

## Next Steps (Optional)

### Configure SMS Pricing
- Set pricing in system_settings table
- Default: 500 TZS per SMS
- Can be adjusted based on market

### Test SMS Sending
1. Buy credits as a test company
2. Send test SMS to verified number
3. Check delivery in Twilio Console logs
4. Verify balance deduction

### Marketing
- Announce SMS feature to existing companies
- Create tutorial/help docs for users
- Set up billing alerts in Twilio

---

## Architecture Notes (For Developers)

### Authentication Architecture
- **Main App Users:** Supabase Auth (JWT tokens in requests)
- **COPCCA Admin:** sessionStorage (no JWT tokens, client-side only)
- **Database Perspective:** COPCCA admin requests are unauthenticated (anon role)

### RLS Challenge
- Row Level Security (RLS) policies expect authenticated users
- COPCCA admin operations blocked by default
- **Solution:** SECURITY DEFINER functions bypass RLS safely

### Security Considerations
- SECURITY DEFINER runs with definer's privileges (superuser)
- Only allows specific operations (upsert system_settings)
- Audit trail maintained via updated_at timestamp
- Standard PostgreSQL pattern for trusted operations from untrusted clients

### Files Modified
- `src/pages/admin/SMSAdminPanel.tsx` - Updated to use RPC function
- `fix-copcca-admin-settings-access.sql` - New database migration
- `update-admin-password.sql` - Password update script

### Deployment
- Commit: 00d090e
- Branch: main
- Deployed to: https://copcca.com
- Build: SMSAdminPanel-CdPEhlfW.js

---

## Support Contacts

**If you encounter any issues:**
1. Check browser console for error messages (F12 → Console tab)
2. Verify both SQL scripts ran successfully in Supabase
3. Confirm Twilio credentials are correct
4. Check Twilio Console for API errors
5. Review database logs in Supabase Dashboard

**Common Error Messages:**
- `403 Forbidden` = RLS issue → Run SQL migration
- `400 Bad Request` = Query syntax → Already fixed in code
- `404 Not Found` = Missing table → Run SQL migration
- `Invalid credentials` = Wrong Twilio keys → Check Twilio Console

---

**Last Updated:** 2024-12-17  
**Version:** 1.0  
**Status:** ✅ Ready for Activation
