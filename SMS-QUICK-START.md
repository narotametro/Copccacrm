# 🚀 SMS Service Quick Start Guide

## For Users: How to Send SMS

### 1️⃣ Buy Credits (2 minutes)

```
Settings → SMS / Automation → Credits & Balance tab
↓
Click "Buy Business Pack" (500 SMS @ TSh 20,000)
↓
Choose Payment: M-Pesa / Card / Bank Transfer
↓
✅ Balance Updated: TSh 20,000 (1,000 SMS available)
```

### 2️⃣ Send SMS Reminder (30 seconds)

```
Debt Collection page
↓
Add debt with customer phone: +255754123456
↓
Click "Send All Reminders"
↓
✅ SMS Sent! Balance deducted: TSh 20,000 → TSh 19,950
```

---

## For COPCCA Admin: Setup Twilio (10 minutes)

### Step 1: Get Twilio Account
- Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
- Sign up (free trial available)
- Get your credentials:
  - **Account SID**: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  - **Auth Token**: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  - **Phone Number**: +255754123456 (buy Tanzania number)

### Step 2: Configure in Database

Open **Supabase SQL Editor**, run:

```sql
INSERT INTO system_settings (key, value, description, category)
VALUES 
  ('twilio_account_sid', 'ACxxxxxxxxxxxxxxxx', 'Twilio Account SID', 'sms'),
  ('twilio_auth_token', 'xxxxxxxxxxxxxxxxxx', 'Twilio Auth Token', 'sms'),
  ('twilio_phone_number', '+255754123456', 'Twilio Sender Number', 'sms'),
  ('sms_enabled', 'true', 'Enable SMS globally', 'sms')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Step 3: Test SMS

```
1. Add test debt with YOUR phone number
2. Click "Send Reminder"
3. Check your phone for SMS ✅
```

---

## Architecture Diagram

```
┌──────────────────┐
│  COPCCA Admin    │  → Sets up ONE Twilio account
└────────┬─────────┘
         │
         ↓
┌─────────────────────────┐
│  system_settings table  │  → Stores Twilio credentials
│  (Supabase Database)    │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  All User Companies     │  → Buy credits, send SMS
│  (Multi-tenant)         │     using COPCCA's Twilio
└─────────────────────────┘
```

---

## Payment Flow

```
User → Buy Package → Payment Gateway → Credits Added → Send SMS → Balance Deducted
  ↓         ↓             ↓                ↓              ↓             ↓
Balance  Selects      M-Pesa/         Database       Twilio API    Transaction
TSh 0    Business     Stripe          Function       Sends SMS     Logged
         Pack         Payment         add_sms_       To Customer   -TSh 50
         TSh 20k      Confirmed       credits()      Phone
```

---

## Cost Breakdown

**For COPCCA (Business Model):**
- **Buy from Twilio:** $0.01/SMS (Tanzania number)
- **Sell to Users:** TSh 50/SMS ($0.02)
- **Profit:** $0.01 per SMS = **100% markup**

**For Users:**
| Package | SMS Count | Price (TZS) | Per SMS Cost |
|---------|-----------|-------------|--------------|
| Starter | 100 | 5,000 | 50 |
| Business | 500 | 20,000 | 40 (-20%) |
| Pro | 1,000 | 35,000 | 35 (-30%) |
| Enterprise | 5,000 | 150,000 | 30 (-40%) |

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/components/sms/SMSCredits.tsx` | Credits UI, payment modal |
| `src/lib/services/smsService.ts` | Twilio integration, SMS sending |
| `database-sms-credits-system.sql` | Database schema, functions |
| `SMS-PAYMENT-AND-TWILIO-SETUP.md` | Full documentation (this file) |

---

## Quick Troubleshooting

**Problem:** SMS not sending  
**Solution:** Check if Twilio configured in database

**Problem:** "Insufficient balance"  
**Solution:** User needs to buy credits first

**Problem:** "Invalid phone number"  
**Solution:** Use +255754123456 format (not 0754123456)

---

## Support

- **Full Guide:** [SMS-PAYMENT-AND-TWILIO-SETUP.md](SMS-PAYMENT-AND-TWILIO-SETUP.md)
- **Twilio Docs:** [twilio.com/docs/sms](https://www.twilio.com/docs/sms)
- **COPCCA Support:** support@copcca.com

**Ready to send SMS? Buy credits now! 🚀**
