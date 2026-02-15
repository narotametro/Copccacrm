# 🚀 COPCCA SMS Service Activation Guide

## ✅ What We've Built

Your COPCCA CRM now has a **complete centralized SMS service**:

1. ✅ **Admin Panel** - Configure Twilio once for ALL users
2. ✅ **User Credits System** - Users buy SMS credits, no Twilio account needed
3. ✅ **Automatic Balance Check** - Prevents sending when credits run out
4. ✅ **Bilingual SMS** - English + Swahili support
5. ✅ **Analytics Dashboard** - Track usage, revenue, and profit

---

## 🎯 Step-by-Step Activation Guide

### For COPCCA Admin: Setup (15 minutes)

#### Step 1: Access Admin Panel

```
1. Go to: http://localhost:5177/copcca-admin/login
2. Login with admin credentials
3. Click "SMS Service" tab in top navigation
```

#### Step 2: Create Twilio Account

```
1. Visit: https://www.twilio.com/try-twilio
2. Sign up (free trial includes $15 credit)
3. Verify your email and phone
```

#### Step 3: Get Phone Number

```
Go to: Twilio Console → Phone Numbers → Buy a Number

Recommended:
- For Tanzania: +255 number (~$1/month)
- For Kenya: +254 number (~$1/month)
- For US (testing): +1 number (~$1/month)

Why local? Better delivery rates + lower costs
```

#### Step 4: Copy Credentials

```
From Twilio Console Dashboard:

Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: Click "Show" → Copy the token
Phone Number: +255754123456 (or whatever you bought)
```

#### Step 5: Configure in COPCCA

```
1. Open: http://localhost:5177/copcca-admin/sms
2. Paste:
   - Account SID: ACxxxxxxxxxx
   - Auth Token: xxxxxxxxxx  
   - Phone Number: +255754123456
3. Check: ☑ Enable SMS service for all companies
4. Click: "Save Configuration"
```

#### Step 6: Test SMS

```
1. Enter YOUR phone number: +255754123456
2. Click: "Send Test SMS"
3. Wait 5 seconds → Check your phone ✅
4. If received → SMS is working!
```

#### Step 7: Enable for All Users

```
1. After successful test
2. Toggle: "Enable SMS Globally" button ON
3. ✅ All companies can now send SMS!
```

---

### For Users: How to Use SMS (2 minutes)

#### Step 1: Buy SMS Credits

```
1. Settings → SMS / Automation → "Credits & Balance" tab
2. Current Balance: TSh 0
3. Click "Buy Business Pack" (500 SMS @ TSh 20,000)
4. Select payment method:
   - M-Pesa (instant - Tanzania/Kenya)
   - Credit Card (Stripe - coming soon)
   - Bank Transfer (manual verification)
5. Complete payment → Balance updated!
```

#### Step 2: Send SMS Reminder

```
1. Debt Collection page
2. Add debt with customer info:
   - Customer name: John Doe
   - Amount: TSh 50,000
   - Phone: +255754123456 ← IMPORTANT!
   - Due date: Today
3. Click "Send All Reminders"
4. ✅ SMS sent! Balance deducted: TSh 20,000 → TSh 19,950
```

---

## 📊 Admin Monitoring Dashboard

### What You Can See:

**Statistics (Auto-updated):**
- Total SMS Sent: 1,234
- Total Revenue: $24.68 (from user credits)
- Net Profit: $12.34 (after Twilio costs)
- Active Companies: 15 (companies sending SMS)
- SMS Today: 45
- Revenue Today: $0.90

**Cost Breakdown:**
- Twilio charges: $0.01 per SMS
- You charge users: TSh 50 ($0.02) per SMS
- Profit per SMS: $0.01 (100% markup)

---

## 🔒 Security & Best Practices

### ✅ DO:
- **Rotate** Twilio auth token every 90 days
- **Monitor** usage dashboard daily
- **Set up** billing alerts in Twilio Console ($50 threshold)
- **Backup** credentials in secure password manager
- **Test** SMS delivery weekly

### ❌ DON'T:
- Never share Twilio credentials with users
- Never commit credentials to Git
- Never expose in frontend code
- Don't ignore failed SMS logs
- Don't let users bypass balance checks

---

## 🎯 User Management

### Give Users Free Trial Credits

```sql
-- Run in Supabase SQL Editor
-- Give specific company 100 free SMS ($2 value)

UPDATE company_sms_balance
SET 
  balance = balance + 2.00,
  total_purchased = total_purchased + 2.00,
  updated_at = NOW()
WHERE company_id = 'COMPANY_UUID_HERE';

-- Insert transaction record
INSERT INTO sms_transactions (
  company_id,
  transaction_type,
  amount,
  description,
  payment_method
) VALUES (
  'COMPANY_UUID_HERE',
  'bonus',
  2.00,
  'Free trial credits - 100 SMS',
  'admin_grant'
);
```

### Check Company Usage

```sql
-- View company SMS usage
SELECT 
  c.name AS company_name,
  csb.balance AS current_balance,
  csb.total_sms_sent,
  csb.total_spent,
  (SELECT COUNT(*) FROM sms_logs WHERE company_id = c.id AND created_at > NOW() - INTERVAL '30 days') AS sms_last_30d
FROM companies c
LEFT JOIN company_sms_balance csb ON csb.company_id = c.id
ORDER BY csb.total_sms_sent DESC;
```

### Refund Credits (if needed)

```sql
-- Refund $5 to a company
SELECT add_sms_credits(
  p_company_id := 'COMPANY_UUID_HERE',
  p_credits_amount := 5.00,
  p_payment_method := 'refund',
  p_payment_reference := 'REF-REFUND-001',
  p_package_id := NULL
);
```

---

## 🚨 Troubleshooting

### Issue: "SMS not sending"

**Check:**
1. ✅ Twilio configured? (`system_settings` table)
2. ✅ SMS enabled globally? (Admin panel toggle)
3. ✅ User has credits? (Check `company_sms_balance`)
4. ✅ Phone number valid? (Must be +255... format)

**Solution:**
```sql
-- Check system settings
SELECT * FROM system_settings WHERE key LIKE 'twilio%';

-- Check company balance
SELECT * FROM company_sms_balance WHERE company_id = 'UUID';

-- Check recent SMS logs
SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 10;
```

### Issue: "Insufficient balance" error

**Cause:** User has $0 credits or less than $0.02

**Solution:** User must buy credits OR admin can grant free credits (see above)

### Issue: "Invalid phone number format"

**Cause:** Phone number not in E.164 format

**Wrong:** `0754123456`, `754123456`, `255754123456`  
**Correct:** `+255754123456`

**Solution:** Educate users to use + prefix with country code

### Issue: SMS sent but not received

**Check Twilio Console:**
1. Go to: Twilio Console → Monitor → Logs → Messaging
2. Find message by phone number
3. Status shows:
   - `delivered` ✅ Success
   - `undelivered` ❌ Failed (invalid number)
   - `failed` ❌ Error (check error code)

**Common reasons:**
- Phone number deactivated/invalid
- Carrier blocking (rare)
- Country not supported by Twilio number

---

## 💰 Revenue Optimization

### Pricing Strategy

**Current Model:**
- Cost (Twilio): $0.01/SMS
- Price (Users): $0.02/SMS
- Margin: 100%

**Recommended Upgrades:**
- Bulk discounts encourage large purchases
- Starter pack: High visibility (no discount)
- Enterprise pack: Lower margin, higher volume

**Monthly Revenue Projection:**

| Companies | Avg SMS/month | Revenue | Cost | Profit |
|-----------|---------------|---------|------|--------|
| 10 | 100 | $20 | $10 | $10 |
| 50 | 200 | $200 | $100 | $100 |
| 100 | 300 | $600 | $300 | $300 |
| 500 | 500 | $5,000 | $2,500 | $2,500 |

### Set Billing Alerts

1. Go to: Twilio Console → Billing → Alert Settings
2. Add threshold: $50, $100, $200
3. Email notifications to: admin@copcca.com

---

## 📈 Growth Features (Future)

### Phase 2: Payment Integration
- [ ] M-Pesa API (STK Push)
- [ ] Stripe subscriptions
- [ ] Auto-topup (when balance < $1)

### Phase 3: Advanced Features
- [ ] SMS templates library
- [ ] Scheduled SMS campaigns
- [ ] SMS delivery reports
- [ ] WhatsApp integration (Twilio API)
- [ ] Two-way SMS (incoming messages)

### Phase 4: Analytics
- [ ] Delivery rate tracking
- [ ] Best time to send analysis
- [ ] Customer response tracking
- [ ] ROI calculator

---

## 📞 Support Resources

**Twilio Documentation:**
- SMS API: https://www.twilio.com/docs/sms
- Error Codes: https://www.twilio.com/docs/api/errors
- Best Practices: https://www.twilio.com/docs/sms/best-practices

**COPCCA Support:**
- Admin Panel: http://localhost:5177/copcca-admin/sms
- Database: Check `sms_logs`, `company_sms_balance` tables
- Logs: Browser console → Network tab

**Integration Help:**
- M-Pesa Daraja: https://developer.safaricom.co.ke
- Stripe: https://stripe.com/docs

---

## ✅ Activation Checklist

Before going production:

- [ ] Twilio account created and verified
- [ ] Local phone number purchased (+255 or +254)
- [ ] Credentials added to admin panel
- [ ] Test SMS sent successfully
- [ ] SMS enabled globally
- [ ] Billing alerts configured in Twilio
- [ ] At least 3 companies with credits
- [ ] User documentation shared
- [ ] Support email configured
- [ ] Backup of credentials stored securely
- [ ] Admin login credentials secured
- [ ] Database backups enabled
- [ ] Monitoring dashboard bookmarked

---

## 🎉 You're Ready!

Your centralized SMS service is now LIVE! 

**Next Steps:**
1. Announce SMS feature to users
2. Offer free trial credits (100 SMS each)
3. Monitor usage dashboard daily
4. Collect feedback for improvements

**Need help?** Check:
- [SMS-PAYMENT-AND-TWILIO-SETUP.md](SMS-PAYMENT-AND-TWILIO-SETUP.md)
- [SMS-QUICK-START.md](SMS-QUICK-START.md)

---

**Last Updated:** February 16, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
