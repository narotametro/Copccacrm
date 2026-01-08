# 🔐 Google OAuth Setup Guide

## Complete Setup Instructions

### ✅ STEP 1: Configure Google OAuth in Supabase

1. **Go to your Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your "POCKET" project

2. **Enable Google Provider**
   - Navigate to: **Authentication** → **Providers**
   - Find **Google** in the list
   - Toggle it to **Enabled**

3. **Get Redirect URL**
   - Copy the redirect URL shown: `https://bpydcrdvytnnjzytkptd.supabase.co/auth/v1/callback`
   - You'll need this for Google Console

---

### ✅ STEP 2: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select Project**
   - Click the project dropdown (top left)
   - Click **"New Project"** or select existing
   - Name it: `COPCCA CRM` (or any name)
   - Click **Create**

3. **Enable OAuth Consent Screen**
   - Go to: **APIs & Services** → **OAuth consent screen**
   - Choose **External** (for public access)
   - Click **Create**

4. **Fill OAuth Consent Form**
   - **App name**: `COPCCA CRM`
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **Save and Continue**
   - Skip Scopes (click **Save and Continue**)
   - Skip Test Users (click **Save and Continue**)
   - Click **Back to Dashboard**

5. **Create OAuth Credentials**
   - Go to: **APIs & Services** → **Credentials**
   - Click **+ Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `COPCCA CRM Web`
   
6. **Add Authorized Redirect URIs**
   - Click **+ Add URI**
   - Paste: `https://bpydcrdvytnnjzytkptd.supabase.co/auth/v1/callback`
   - For local testing, also add: `http://localhost:5179`
   - Click **Create**

7. **Copy Credentials**
   - You'll see **Client ID** and **Client Secret**
   - **IMPORTANT**: Copy both immediately!

---

### ✅ STEP 3: Add Credentials to Supabase

1. **Return to Supabase Dashboard**
   - Go to: **Authentication** → **Providers** → **Google**

2. **Paste Google Credentials**
   - **Client ID**: Paste from Google Console
   - **Client Secret**: Paste from Google Console
   - Click **Save**

---

### ✅ STEP 4: Enable Email Confirmations (Optional)

1. **Go to Supabase Dashboard**
   - Navigate to: **Authentication** → **Email Templates**

2. **Configure Email Settings**
   - **Confirm signup**: Enable/Disable as needed
   - **Magic Link**: Enable for passwordless login
   - **Reset Password**: Already configured ✅

3. **Customize Email Templates** (Optional)
   - Edit templates to match your brand
   - Add your logo and colors

---

### ✅ STEP 5: Test Everything

1. **Test Google Sign-In**
   - Go to: http://localhost:5179/login
   - Click **"Continue with Google"**
   - Sign in with Google account
   - You should be redirected to dashboard

2. **Test Password Reset**
   - Click **"Forgot password?"** on login
   - Enter your email
   - Check inbox for reset email
   - Click link and set new password

3. **Verify in Supabase**
   - Check: **Authentication** → **Users**
   - You should see your Google account
   - Check: **Table Editor** → **users**
   - Your profile should be created automatically

---

## 🎯 What's Now Working

### ✅ Google OAuth (Gmail Sign In/Up)
- ✅ Sign in with Google account
- ✅ Sign up with Google account
- ✅ Auto-create user profile on first login
- ✅ Sync Google avatar automatically

### ✅ Email/Password Authentication
- ✅ Sign up with email/password
- ✅ Sign in with email/password
- ✅ Email verification (if enabled)

### ✅ Password Reset
- ✅ Request password reset via email
- ✅ Receive reset link in inbox
- ✅ Reset password securely
- ✅ Automatic redirect to login

---

## 🔧 Troubleshooting

### Google Sign-In Not Working?

**Error: "redirect_uri_mismatch"**
- Make sure the redirect URI in Google Console EXACTLY matches:
  `https://bpydcrdvytnnjzytkptd.supabase.co/auth/v1/callback`

**Error: "Access blocked"**
- Your OAuth consent screen needs to be published
- Go to Google Console → OAuth consent screen → Publish App

**Error: "Invalid client"**
- Check Client ID and Secret are correct in Supabase
- Make sure you copied them completely (no spaces)

### Password Reset Not Working?

**Not receiving email?**
- Check spam/junk folder
- Verify email settings in Supabase: Authentication → Settings
- Enable SMTP (custom email) if needed

**Reset link expired?**
- Links expire after 1 hour
- Request a new reset link

---

## 📧 Custom Email Configuration (Optional)

For production, configure custom SMTP:

1. **Go to Supabase Dashboard**
   - Navigate to: **Project Settings** → **Auth**

2. **Enable Custom SMTP**
   - Provider: Choose (Gmail, SendGrid, etc.)
   - SMTP Host: Your mail server
   - Port: Usually 587 or 465
   - Username: Your email
   - Password: App-specific password

3. **Test Email Delivery**
   - Send test reset password email
   - Verify delivery and formatting

---

## 🚀 Production Checklist

Before going live:

- [ ] Publish OAuth consent screen in Google Console
- [ ] Add production domain to Authorized Redirect URIs
- [ ] Configure custom SMTP for emails
- [ ] Update redirect URLs in Supabase settings
- [ ] Test all auth flows in production environment
- [ ] Enable email verification for new signups
- [ ] Set up rate limiting in Supabase

---

## 📝 Security Best Practices

1. **Never commit credentials** - Keep Client ID/Secret secure
2. **Use environment variables** - Already configured in `.env`
3. **Enable RLS policies** - Already configured ✅
4. **Require email verification** - Recommended for production
5. **Set password requirements** - Minimum 6 characters enforced
6. **Monitor auth logs** - Check Supabase Auth Logs regularly

---

## 🎉 You're All Set!

Your COPCCA CRM now has:
- ✅ Google OAuth (Gmail) authentication
- ✅ Email/password authentication  
- ✅ Password reset via email
- ✅ Automatic user profile creation
- ✅ Secure session management

Users can now sign in with:
1. **Google account** (one-click)
2. **Email & password** (traditional)
3. **Password recovery** (if forgotten)

All authentication is handled securely by Supabase! 🔒
