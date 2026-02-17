# 📱 COPCCA Branded SMS Setup Guide

## 🎉 Feature Overview

Your SMS platform now supports **branded messaging** with:

1. **Alphanumeric Sender ID**: Messages show "COPCCA" instead of +18288131199
2. **Automatic Tagline**: "Simamia biashara yako na COPCCA" appended to every message
3. **Smart Sender Detection**: Uses branded ID for international, phone number for US/Canada

---

## ✨ What Your Customers Will See

### Before (Generic)
```
From: +18288131199

Your appointment is confirmed for tomorrow at 10 AM.
```

### After (Branded) ⭐
```
From: COPCCA

Your appointment is confirmed for tomorrow at 10 AM.

- Simamia biashara yako na COPCCA
```

---

## 🔧 Setup Instructions

### Step 1: Run Database Migration

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Go to SQL Editor**
3. **Run this script**: [add-branded-sms-settings.sql]
4. ✅ Verify: You should see confirmation message

This adds:
- `sms_branded_sender_id` = "COPCCA"
- `sms_tagline` = "Simamia biashara yako na COPCCA"

---

### Step 2: Configure in Admin Panel

1. **Login to COPCCA Admin**: https://copcca.com/copcca-admin
   - Email: admin@copcca.com
   - Password: COPCCA@2026#Secure2

2. **Navigate to SMS Service** tab

3. **You'll see new fields:**
   - **Branded Sender ID**: Default "COPCCA" (max 11 characters)
   - **SMS Tagline**: Default "Simamia biashara yako na COPCCA"

4. **Customize (Optional):**
   - Change sender ID (must be alphanumeric, no spaces)
   - Edit tagline to match your brand voice
   - Leave tagline blank to disable

5. **Click "Test & Activate Instantly"** or **"Save Configuration"**

---

### Step 3: Enable Alphanumeric Sender in Twilio

**Important**: Twilio requires you to enable this feature for your account.

#### 3.1 Request Alpha Sender Access
1. Go to: https://console.twilio.com/us1/develop/sms/settings/alpha-sender
2. Click **"Request Access to Alpha Sender"**
3. Fill out form with COPCCA business details
4. Wait for approval (usually 1-3 business days)

#### 3.2 Enable Geographic Permissions
1. Go to: https://console.twilio.com/us1/develop/sms/settings/geo-permissions
2. Find **Tanzania** (and other countries you serve)
3. Check the box to enable
4. Click **Save**

#### 3.3 Register Sender ID (If Required)
Some countries require pre-registration. Check if Tanzania requires it:

1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/branded-sender-ids
2. Click **"Register a Sender ID"**
3. Enter:
   - **Sender ID**: COPCCA
   - **Country**: Tanzania
   - **Use Case**: Business notifications
   - **Company Info**: COPCCA details
4. Submit and wait for approval (1-4 weeks)

**Check requirements**: https://support.twilio.com/hc/en-us/articles/223133767

---

## 🌍 How It Works

### Smart Sender Detection

The system automatically chooses the best sender based on recipient location:

```typescript
// For US/Canada numbers (+1)
From: +18288131199  // Phone number required
Body: Your message

// For International (Tanzania +255, Kenya +254, etc.)
From: COPCCA  // Branded sender ID
Body: Your message

- Simamia biashara yako na COPCCA
```

**Why?**
- US & Canada don't support alphanumeric sender IDs
- International recipients prefer branded sender names
- Automatic detection = no manual configuration

---

## 📝 Customization Options

### Change Sender ID

**Admin Panel** → SMS Service → **Branded Sender ID**

Rules:
- Max 11 characters
- Alphanumeric only (A-Z, 0-9)
- No spaces or special characters
- Case-insensitive (displays as uppercase)

**Examples:**
- ✅ COPCCA
- ✅ COPCCA2026
- ✅ COPCCAPay
- ❌ COPCCA-CRM (hyphen not allowed)
- ❌ COPCCA CRM (space not allowed)

---

### Change Tagline

**Admin Panel** → SMS Service → **SMS Tagline**

This text is automatically added to **every** SMS message sent through the platform.

**Default**: "Simamia biashara yako na COPCCA"

**Custom Examples:**
- "Powered by COPCCA - Your Business Partner"
- "COPCCA: Simamia, Ongeza, Faulu"
- "Visit copcca.com for more tools"

**Disable Tagline**: Leave field blank

---

## 🧪 Testing Branded SMS

### Test with Phone Number

1. In COPCCA Admin Panel
2. Scroll to **"Test SMS"** section
3. Enter recipient number (E.164 format: +255...)
4. Click **"Send Test SMS"**

### Expected Result

**For Tanzanian number (+255...):**
```
From: COPCCA

This is a test SMS from your COPCCA CRM platform. If you received this, SMS is working!

- Simamia biashara yako na COPCCA
```

**For US number (+1...):**
```
From: +18288131199

This is a test SMS from your COPCCA CRM platform. If you received this, SMS is working!

- Simamia biashara yako na COPCCA
```

---

## 🚨 Troubleshooting

### ❌ Still showing phone number instead of "COPCCA"

**Possible Causes:**
1. **Twilio Alpha Sender not enabled** → Request access in Twilio Console
2. **Geographic permissions not set** → Enable Tanzania in geo-permissions
3. **Sender ID registration pending** → Wait for Twilio approval (if required)
4. **Recipient in US/Canada** → Expected behavior (alphanumeric not supported)

**Solution:**
- Complete Twilio setup steps above
- Wait for approval (can take 1-3 business days)
- Test with international number after approval

---

### ❌ Tagline not appearing in messages

**Possible Causes:**
1. **Field left empty** → Check Admin Panel configuration
2. **Old cached code** → Hard refresh browser (Ctrl + Shift + R)
3. **Not saved** → Click "Save Configuration" after editing

**Solution:**
1. Go to Admin Panel → SMS Service
2. Verify "SMS Tagline" field has text
3. Click "Save Configuration"
4. Send test SMS to confirm

---

### ❌ Error: "Alpha Sender not supported in this region"

Some countries don't support alphanumeric sender IDs. System automatically falls back to phone number.

**Supported Countries** (Partial List):
- ✅ Tanzania
- ✅ Kenya
- ✅ Uganda
- ✅ Rwanda
- ✅ Most of Europe
- ✅ Most of Asia
- ❌ United States
- ❌ Canada

**Full List**: https://support.twilio.com/hc/en-us/articles/223133767

---

## 💡 Best Practices

### 1. Keep Sender ID Short
- Shorter = more recognizable
- "COPCCA" is better than "COPCCACRM2026"

### 2. Make Tagline Actionable
- Include website or value proposition
- Keep under 50 characters
- Test readability on mobile

### 3. Brand Consistency
- Use same sender ID everywhere
- Match tagline with marketing materials
- Professional tone

### 4. Monitor Delivery
- Check Twilio Console for failed messages
- Regional restrictions may apply
- Test in target markets first

---

## 📊 Current Configuration

After setup, your SMS configuration in database:

| Key | Value | Purpose |
|-----|-------|---------|
| `sms_branded_sender_id` | COPCCA | Shows as sender name |
| `sms_tagline` | Simamia biashara yako na COPCCA | Footer text |
| `twilio_account_sid` | AC... | Twilio credentials |
| `twilio_auth_token` | [hidden] | Twilio credentials |
| `twilio_phone_number` | +18288131199 | Fallback for US/CA |
| `sms_enabled` | true | Service active |

---

## 🔄 How to Update Settings

### Method 1: Admin Panel (Recommended)
1. Login to COPCCA Admin
2. SMS Service tab
3. Edit fields
4. Click "Save Configuration"

### Method 2: Direct Database (Advanced)
```sql
-- Update sender ID
UPDATE system_settings 
SET value = 'NEWNAME' 
WHERE key = 'sms_branded_sender_id';

-- Update tagline
UPDATE system_settings 
SET value = 'Your new tagline here' 
WHERE key = 'sms_tagline';
```

---

## 📈 Impact on Business

### Customer Perception
- **Before**: "Who is +18288131199?"
- **After**: "Oh, it's from COPCCA!"

### Branding
- Every SMS = brand touchpoint
- Reinforces company name
- Professional appearance

### Marketing
- Tagline promotes services
- Drives website traffic
- Builds trust

---

## 📋 Quick Reference

**Files Modified:**
- `src/lib/services/smsService.ts` - Smart sender logic
- `src/pages/admin/SMSAdminPanel.tsx` - UI configuration
- `add-branded-sms-settings.sql` - Database migration

**Database Tables:**
- `system_settings` - Stores configuration
- `sms_logs` - Tracks all sent messages

**External Links:**
- Twilio Alpha Sender: https://console.twilio.com/us1/develop/sms/settings/alpha-sender
- Geo Permissions: https://console.twilio.com/us1/develop/sms/settings/geo-permissions
- Supported Countries: https://support.twilio.com/hc/en-us/articles/223133767

---

## ✅ Next Steps

1. ✅ Run [add-branded-sms-settings.sql] in Supabase
2. ✅ Enable Alpha Sender in Twilio Console
3. ✅ Set geographic permissions for Tanzania
4. ✅ Customize sender ID and tagline in Admin Panel
5. ✅ Send test SMS to verify branding
6. ✅ Monitor delivery and adjust as needed

---

**Questions?** Check console logs or Twilio documentation for detailed error messages.

**Last Updated:** 2024-12-17  
**Version:** 1.1  
**Status:** ✅ Deployed to Production
