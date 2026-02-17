# 🚀 Twilio SMS Quick Setup Guide

## ✅ Complete Setup in 15 Minutes

Your SMS Admin Panel now has a **guided setup wizard** that walks you through everything step-by-step!

### 📍 Where to Start

1. **Login to COPCCA-CRM**
2. Navigate to: **Admin** → **SMS Admin Panel**
   - URL: `https://copcca.com/app/admin/sms`
3. Follow the **4-step wizard** at the top of the page

---

## 🎯 Quick Start Checklist

### Step 1: Create Twilio Account (5 min)
- [ ] Click **"Sign Up for Twilio"** button in the wizard
- [ ] Create account at https://www.twilio.com/try-twilio
- [ ] Verify your email address
- [ ] You'll get **$15.50 in free credits** (~150-200 SMS)

### Step 2: Get Trial Phone Number (2 min)
- [ ] In Twilio Console, click **"Get trial phone number"**
- [ ] Accept the suggested number (or search by area code)
- [ ] **Copy the number** (format: `+1234567890`)
- [ ] Click "Choose this number"

### Step 3: Copy API Credentials (3 min)
- [ ] Go to Twilio Console Dashboard
- [ ] Find **"Account Info"** section
- [ ] Copy **Account SID** (starts with `AC...`)
- [ ] Click eye icon to reveal **Auth Token**
- [ ] Copy **Auth Token** (keep this secret!)

### Step 4: Configure COPCCA-CRM (5 min)
- [ ] Scroll to **"Twilio Configuration"** section in CRM
- [ ] Paste **Account SID**
- [ ] Paste **Auth Token**
- [ ] Paste **Phone Number**
- [ ] Click **"Save Configuration"**
- [ ] **Verify your phone** in Twilio (for testing)
- [ ] Click **"Send Test SMS"** in CRM

---

## ⚠️ Important: Trial Account Limitations

**Twilio trial accounts can only send SMS to VERIFIED numbers.**

### How to Verify Your Phone
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click **"Add new caller ID"**
3. Enter your phone number (e.g., `+255754123456`)
4. Receive verification code via SMS
5. Enter code → Click "Verify"

**Now you can test SMS to that number!**

### Remove Limitations
To send to ANY number without verification:
- **Upgrade Twilio:** https://www.twilio.com/console/billing
- **Cost:** ~$20/month minimum
- **Benefits:** No verification needed, remove "trial account" message

---

## 💰 SMS Costs (After Trial)

### Twilio Pricing
| Region | Price per SMS | Phone Number |
|--------|---------------|--------------|
| US/Canada | $0.0079 | $1.15/month |
| Tanzania | $0.05-0.10 | $1.15/month |
| Kenya | $0.04-0.08 | $1.15/month |

### Budget Calculator
**Example: 150 SMS/month to Tanzania**
- SMS: 150 × $0.075 = **$11.25**
- Number rental = **$1.15**
- **Total: ~$12.40/month**

---

## 🎯 What You Can Do With SMS

### Already Built Into COPCCA-CRM:

**1. Debt Collection Reminders** 📊
- Automatic payment reminders
- Overdue notices
- Manual reminder sending

**2. Sales Notifications** 📦
- Order confirmations
- Delivery updates
- Invoice notifications

**3. Marketing Campaigns** 📢
- Promotional SMS blasts
- Seasonal offers
- Product announcements

**4. Customer Communication** 💬
- Support ticket updates
- Appointment reminders
- Two-way messaging

---

## 📖 Step-by-Step Visual Guide

### 1. Access SMS Admin Panel
```
Login → Admin Menu → SMS Admin Panel
```

### 2. You'll See the Setup Wizard
```
┌──────────────────────────────────────────┐
│ ⚡ Get Started with Twilio SMS           │
│                                          │
│ [1] Create Twilio Account                │
│     ► Sign Up for Twilio                 │
│                                          │
│ [2] Get Trial Phone Number               │
│     ► Go to Phone Numbers                │
│                                          │
│ [3] Copy API Credentials                 │
│     ► Open Twilio Console                │
│                                          │
│ [4] Configure COPCCA-CRM                 │
│     ► Complete form below ⬇️              │
└──────────────────────────────────────────┘
```

### 3. Fill Configuration Form
```
Twilio Account SID:    ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Twilio Auth Token:     ••••••••••••••••••••••••••••••••
Twilio Phone Number:   +1234567890

[✓] Enable SMS service for all companies

[Save Configuration]  [Enable SMS Globally]
```

### 4. Test Connection
```
Send test SMS to:  +255754123456  [Send Test SMS]

⚠️ Remember to verify this number in Twilio first!
```

---

## 🛠️ Troubleshooting

### "Test SMS Failed"
**Possible causes:**
1. ❌ Phone number not verified (trial accounts only)
   - **Fix:** Verify phone in Twilio Console
2. ❌ Wrong credentials (SID or Token)
   - **Fix:** Re-copy from Twilio Console
3. ❌ Invalid phone number format
   - **Fix:** Use E.164 format: `+[country][number]`
4. ❌ Trial credits depleted
   - **Fix:** Check Twilio balance, upgrade if needed

### "SMS Not Sending from CRM"
**Check:**
1. Is SMS enabled globally? (Admin Panel toggle)
2. Does company have SMS credits? (SMS Credits section)
3. Are Twilio credentials still valid?
4. Check Twilio logs: https://console.twilio.com/us1/monitor/logs/sms

### "Messages Have Trial Disclaimer"
**Message includes:** *"Sent from a Twilio trial account"*

**Fix:** Upgrade Twilio account
- Go to: https://www.twilio.com/console/billing
- Add payment method
- Upgrade account
- Disclaimer will be removed

---

## 📚 Helpful Resources

### Twilio Documentation
- **SMS Quickstart:** https://www.twilio.com/docs/sms/quickstart
- **Trial Account Guide:** https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account
- **Pricing Calculator:** https://www.twilio.com/sms/pricing
- **Support Center:** https://support.twilio.com/hc/en-us

### COPCCA-CRM SMS Features
- **SMS Admin Panel:** `/app/admin/sms`
- **SMS Settings:** `/app/settings` → SMS tab
- **Debt Collection SMS:** `/app/debt-collection` → Send Reminder
- **SMS Credits:** Managed in Admin Panel

---

## 🚀 Next Steps After Setup

### 1. Allocate SMS Credits (Admin Only)
```
Admin Panel → SMS Credits
- Set price per SMS (e.g., 500 TZS)
- Allocate credits to companies
- Monitor usage and revenue
```

### 2. Enable for Users
```
Settings → SMS
- Enable SMS notifications
- Configure preferred language (English/Swahili)
- Set reminder intervals
```

### 3. Create First Campaign
```
Marketing → Campaigns
- Create SMS campaign
- Select customer segment
- Write message (160 chars max)
- Schedule or send now
```

### 4. Test Debt Collection
```
Debt Collection → Select overdue debt
- Click "Send Reminder"
- Message auto-generated
- SMS sent via Twilio
```

---

## 💡 Pro Tips

**1. Use Templates**
- Save common messages as templates
- Variables: `{customer_name}`, `{amount}`, `{due_date}`
- Faster sending, consistent messaging

**2. Monitor Costs**
- Check SMS Admin Panel daily
- Set budget alerts in Twilio
- Track ROI (revenue vs SMS cost)

**3. Optimize Message Length**
- Keep under 160 characters (1 SMS credit)
- 161-320 chars = 2 credits!
- Use URL shorteners for links

**4. Best Times to Send**
- Promotional: 10AM-12PM, 6PM-8PM
- Reminders: 9AM-11AM
- Urgent: Anytime (within reason)
- Avoid: Before 8AM, after 9PM

**5. Compliance**
- Get customer consent before sending
- Include opt-out instructions
- Follow local SMS regulations
- Keep records of consent

---

## ✅ Setup Complete Checklist

Before you finish, confirm:

- [x] Twilio account created
- [x] Trial phone number claimed
- [x] API credentials copied to COPCCA-CRM
- [x] Configuration saved successfully
- [x] Test SMS sent and received
- [x] Your phone verified in Twilio
- [x] SMS enabled globally in CRM
- [x] Understanding of trial limitations
- [x] Know how to upgrade when ready

---

## 🎉 You're Ready!

Your SMS system is now live! You can:
- ✅ Send payment reminders automatically
- ✅ Notify customers of orders via SMS
- ✅ Run marketing campaigns
- ✅ Improve customer communication

**Need help?** Contact COPCCA Support or check Twilio documentation.

---

**Last Updated:** February 17, 2026  
**Version:** 1.0  
**Estimated Setup Time:** 15 minutes
