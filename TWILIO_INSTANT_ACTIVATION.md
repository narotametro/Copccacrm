# Twilio Instant Activation Guide

## 🎯 Quick Setup (5 minutes)

Since you already have a Twilio trial account, follow these steps to activate SMS instantly:

### Step 1: Get Your Twilio Credentials

1. **Log in to Twilio Console**: https://console.twilio.com
2. **Find your credentials** on the dashboard:
   - **Account SID**: Starts with `AC` (e.g., `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token**: Click "Show" to reveal it (32-character string)

### Step 2: Get Your Twilio Phone Number

1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. If you don't have a number yet:
   - Click **Buy a number**
   - Choose your country (Tanzania recommended: +255)
   - Select **SMS capable** number
   - Click **Buy** (trial accounts get $15 credit)
3. Copy your phone number in **E.164 format**: `+255XXXXXXXXX`

### Step 3: Activate in COPCCA Admin Panel

1. **Log in to COPCCA** as admin: https://copcca.com/copcca-admin
2. **Navigate to**: Admin → SMS Admin Panel
3. **Enter your credentials**:
   - Twilio Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Twilio Auth Token: `your-auth-token-here`
   - Twilio Phone Number: `+255XXXXXXXXX`

4. **Click**: "Test & Activate Instantly" 🚀
   - System will verify your credentials
   - Auto-enable SMS for all companies
   - Show activation success message

**That's it!** SMS is now active across the entire COPCCA platform.

---

## 📱 Trial Account Limitations

**Important**: Twilio trial accounts can only send SMS to **verified phone numbers**.

### To Send Test SMS:

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click **"Add new caller ID"**
3. Enter your phone number → Receive verification code → Verify
4. Now you can send test SMS to that number

### To Remove Limitations (Optional):

- **Upgrade to paid account**: https://www.twilio.com/console/billing
- Cost: ~$20/month minimum
- Benefit: Send SMS to ANY number without verification
- Recommended for production use

---

## 💰 Business Model

**COPCCA owns one central Twilio account**:
- **COPCCA buys**: $0.0079 per SMS (wholesale from Twilio)
- **Users buy**: 500-1000 TZS per SMS (retail from COPCCA)
- **Profit margin**: ~$0.25-0.50 per SMS

**Users never:**
- Sign up for Twilio
- See Twilio credentials
- Pay Twilio directly

**Users only:**
- Buy SMS credits from COPCCA platform
- Send SMS through COPCCA CRM interface
- Get charged from their credit balance

---

## ✅ Activation Checklist

- [ ] Log in to Twilio Console
- [ ] Copy Account SID
- [ ] Copy Auth Token (click "Show")
- [ ] Copy Phone Number (E.164 format)
- [ ] Paste credentials in COPCCA Admin Panel
- [ ] Click "Test & Activate Instantly"
- [ ] See green success message: "🎉 SMS Service Activated!"
- [ ] Verify status shows: "✅ SMS Service Active"

**Status**: Once activated, all companies can immediately purchase SMS credits and send messages.

---

## 🔧 Troubleshooting

### Error: "Invalid Twilio credentials"
- **Solution**: Double-check Account SID and Auth Token (no extra spaces)
- **Check**: Make sure Auth Token is the primary token, not a secondary one

### Error: "Test SMS failed - 21608: Unverified number"
- **Solution**: Verify the recipient number in Twilio Console first
- **Link**: https://console.twilio.com/us1/develop/phone-numbers/manage/verified

### SMS not sending after activation
- **Check**: System Settings table has your credentials
- **Verify**: SMS enabled = true in database
- **Test**: Send test SMS from Admin Panel to verified number

---

## 📞 Support

- **Twilio Support**: https://support.twilio.com/hc/en-us
- **Twilio Docs**: https://www.twilio.com/docs/sms
- **COPCCA Admin**: Contact your platform administrator

---

**Last Updated**: February 17, 2026
