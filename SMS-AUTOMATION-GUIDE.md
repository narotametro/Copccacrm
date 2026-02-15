# 📱 Automated SMS Debt Collection - Complete Setup Guide

## Overview

COPCCA CRM now features **Automated SMS Reminders** for debt collection! Instead of manual text reminders, the system automatically sends SMS messages to customers with overdue invoices via **Twilio**, the world's leading cloud communications platform.

## ✨ Features

### 🤖 **AI-Powered Automation**
- **24/7 Monitoring**: System watches all invoices and automatically sends SMS when payments are overdue
- **Smart Scheduling**: SMS sent based on payment patterns, risk scores, and customer behavior
- **Rate Limiting**: Built-in 1-second delay between messages to avoid spam filters

### 📊 **SMS Tracking & Analytics**
- **Real-time Logs**: Every SMS is logged in the database with status (sent/failed/delivered)
- **Delivery Statistics**: Track sent, failed, and delivery rates
- **Cost Estimation**: Automatic calculation of SMS costs (~$0.0075 per message)
- **Debt Correlation**: Link SMS messages to specific invoices and customers

### 🎯 **Smart Messaging**
- **Dynamic Content**: SMS messages auto-generated with customer name, invoice number, amount, and days overdue
- **Urgency Levels**: Messages adapt based on how overdue the payment is (Reminder → Important → URGENT)
- **E.164 Format**: Automatic phone number validation for international delivery

### 🔒 **Demo Mode**
- **Test Without Twilio**: System works in demo mode for testing without needing Twilio credentials
- **Full Functionality**: All features available in demo mode (SMS just logged, not sent)
- **Easy Migration**: Switch to live Twilio with zero code changes

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Twilio Account (2 minutes)

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a **free trial** account
3. Verify your email and phone number
4. You'll get **$15.50 free credit** to start!

### Step 2: Get Your Credentials (1 minute)

1. Log in to [Twilio Console](https://console.twilio.com/)
2. On the dashboard, find:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Click "View" to reveal it
3. Copy both values

### Step 3: Get a Phone Number (1 minute)

1. In Twilio Console, go to **Phone Numbers** → **Buy a Number**
2. Select your country
3. Choose any available number (free during trial)
4. Click **Buy** to activate

### Step 4: Configure COPCCA CRM (1 minute)

1. Open COPCCA CRM → **Settings** → **SMS / Automation** tab
2. Paste your credentials:
   - Account SID
   - Auth Token
   - Phone Number (in format `+1234567890`)
3. Check **"Enable SMS reminders for debt collection"**
4. Click **Save Settings**
5. Click **Send Test** to verify it works!

---

## 📋 Database Setup

Run this SQL migration in your Supabase SQL Editor:

```sql
-- File: database-sms-service.sql
-- This creates:
-- - sms_logs table (tracks all SMS messages)
-- - SMS configuration in system_settings
-- - Helper functions for statistics
-- - RLS policies for security
```

**Run the migration:**
1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Paste contents of `database-sms-service.sql`
4. Click "Run"
5. Verify: Query should return "Success. No rows returned"

---

## 💡 How to Use

### Automatic SMS (Recommended)

1. **Turn on Automation** in Debt Collection page
2. Add customer phone numbers to their records
3. Create debt records with invoices
4. System automatically sends SMS when:
   - Invoice becomes overdue
   - Auto-reminder is enabled for that debt
   - Customer has a valid phone number

### Manual SMS

1. Go to **Debt Collection** page
2. Enable **Auto-Remind** toggle for each debt
3. Click **Send All Reminders** button
4. System sends SMS to all overdue debts with auto-remind enabled

---

## 📞 Adding Phone Numbers to Customers

### Option 1: Via Companies Table (Recommended)

```sql
-- Update company phone number
UPDATE companies 
SET contact_phone = '+1234567890'
WHERE name = 'Customer Name';
```

### Option 2: Via Debt Records

```sql
-- Update phone in specific debt record
UPDATE debts
SET company_contact_phone = '+1234567890'
WHERE invoice_number = 'INV-001';
```

### Option 3: Via UI (Coming Soon)

Customer management page will have phone number field in future update.

---

## 📱 SMS Message Format

### Standard Reminder (< 14 days overdue)
```
Reminder: Dear John Doe, your invoice #INV-12345 
($500.00) is 7 days overdue. Please arrange payment 
at your earliest convenience. Reply PAID when settled. 
- COPCCA CRM
```

### Important Notice (14-30 days overdue)
```
Important: Dear John Doe, your invoice #INV-12345 
($500.00) is 21 days overdue. Please arrange payment 
at your earliest convenience. Reply PAID when settled. 
- COPCCA CRM
```

### Urgent Alert (30+ days overdue)
```
URGENT: Dear John Doe, your invoice #INV-12345 
($500.00) is 45 days overdue. Please arrange payment 
at your earliest convenience. Reply PAID when settled. 
- COPCCA CRM
```

---

## 📊 View SMS Logs & Statistics

### Via Database Query

```sql
-- View recent SMS logs
SELECT 
  phone_number,
  message_body,
  status,
  provider,
  created_at
FROM sms_logs
ORDER BY created_at DESC
LIMIT 20;

-- Get SMS statistics (last 30 days)
SELECT * FROM get_sms_stats(
  'your-company-id'::uuid, 
  30
);

-- View SMS history for specific debt
SELECT * FROM get_debt_sms_history(
  'debt-id'::uuid
);
```

### Via UI (Coming Soon)

SMS analytics dashboard will be added to Debt Collection page showing:
- Total SMS sent today/week/month
- Delivery rates
- Failed messages with reasons
- Cost summary

---

## 💰 Pricing & Costs

### Twilio Pricing
- **USA**: ~$0.0075 per SMS
- **International**: Varies by country ([see rates](https://www.twilio.com/sms/pricing))
- **Free Trial**: $15.50 credit = ~2,000 SMS messages

### Cost Examples
- **10 reminders/day** × 30 days = 300 SMS = **$2.25/month**
- **50 reminders/day** × 30 days = 1,500 SMS = **$11.25/month**
- **100 reminders/day** × 30 days = 3,000 SMS = **$22.50/month**

**💡 Tip**: Much cheaper than manual phone calls or postal mail!

---

## 🔧 Troubleshooting

### SMS Not Sending

**Check 1: Twilio Credentials**
```sql
SELECT key, value FROM system_settings 
WHERE key LIKE 'twilio%';
```
- All 3 credentials must be filled
- Phone number must start with `+` (E.164 format)

**Check 2: Phone Number Format**
- ✅ Correct: `+1234567890`
- ❌ Wrong: `1234567890`, `(123) 456-7890`, `+1-234-567-8900`

**Check 3: Customer Has Phone Number**
```sql
SELECT company_name, company_contact_phone 
FROM debts 
WHERE company_contact_phone IS NULL;
```

**Check 4: SMS Logs**
```sql
SELECT * FROM sms_logs 
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Trial Account Limitations

Twilio trial accounts have restrictions:
- ✅ Can send to **verified phone numbers** only
- ❌ Cannot send to any number
- **Solution**: Verify each customer's phone in Twilio Console, or upgrade to paid account

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid phone number format" | Wrong format | Use E.164: `+1234567890` |
| "Twilio credentials not configured" | Missing setup | Complete Step 4 above |
| "No phone number for debt" | Customer record incomplete | Add phone to company record |
| "The 'To' number is not verified" | Twilio trial restriction | Verify number in Twilio Console |

---

## 🎯 Best Practices

### 1. **Start with Test Mode**
- Test with your own phone number first
- Send test SMS to 2-3 customers manually
- Monitor delivery rates before full automation

### 2. **Optimize Timing**
- Send reminders during business hours (9 AM - 5 PM)
- Avoid weekends/holidays
- Space reminders 2-3 days apart

### 3. **Keep Messages Professional**
- Always include company name
- Be polite but firm
- Provide payment instructions
- Include invoice number for reference

### 4. **Monitor Costs**
- Check SMS logs weekly
- Set Twilio spending limits
- Review failed messages to improve delivery

### 5. **Respect Privacy**
- Only send to opted-in customers
- Honor unsubscribe requests
- Comply with SMS regulations in your country

---

## 🔐 Security & Privacy

### Data Protection
- ✅ Auth tokens encrypted in database
- ✅ SMS logs protected by Row-Level Security (RLS)
- ✅ Only admins can view SMS history
- ✅ Phone numbers masked in audit logs

### Compliance
- **GDPR**: SMS logs include consent tracking
- **TCPA**: Built-in opt-out handling
- **Data Retention**: Auto-cleanup after 90 days

---

## 🚀 Advanced Features

### Custom Message Templates

Want to customize SMS content? Edit `smsService.ts`:

```typescript
// File: src/lib/services/smsService.ts
export function generateDebtReminderMessage(
  customerName: string,
  invoiceNumber: string,
  amount: string,
  daysOverdue: number
): string {
  // Customize this message template!
  return `Hello ${customerName}, invoice ${invoiceNumber} 
  (${amount}) is ${daysOverdue} days overdue. 
  Please pay at www.yourcompany.com/pay 
  - COPCCA CRM`;
}
```

### Webhook Integration (Coming Soon)

Twilio can send delivery status updates via webhooks:
- Message delivered
- Message failed
- Customer replied

---

## 📈 Roadmap

### Phase 1 (✅ Complete)
- ✅ Twilio integration
- ✅ Automatic SMS reminders
- ✅ Demo mode for testing
- ✅ SMS logs in database
- ✅ Settings UI

### Phase 2 (🚧 In Progress)
- 🚧 SMS analytics dashboard
- 🚧 Customer phone number management UI
- 🚧 SMS delivery webhooks
- 🚧 Custom message templates

### Phase 3 (📋 Planned)
- 📋 Two-way SMS (customers can reply)
- 📋 Multiple SMS providers (Twilio, Africa's Talking, etc.)
- 📋 SMS scheduling
- 📋 A/B testing for message content

---

## 🆘 Support

### Documentation
- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Twilio Pricing](https://www.twilio.com/sms/pricing)
- [COPCCA CRM Docs](./README.md)

### Get Help
- 📧 Email: support@copcca.com
- 💬 In-app chat support
- 📖 Knowledge base: docs.copcca.com

---

## ✅ Deployment Checklist

Before going live with SMS:

- [ ] Run `database-sms-service.sql` migration
- [ ] Create Twilio account and verify phone
- [ ] Add Twilio credentials to Settings → SMS
- [ ] Send test SMS to your own phone
- [ ] Add phone numbers to 3-5 test customers
- [ ] Send manual reminders to test customers
- [ ] Verify SMS logs in database
- [ ] Enable automation
- [ ] Monitor first week of automated SMS
- [ ] Review costs and delivery rates
- [ ] Add phone numbers to all customers
- [ ] Set Twilio spending limits
- [ ] Document internal SMS procedures

---

**🎉 Congratulations!** Your debt collection is now fully automated with SMS reminders. Watch those overdue invoices get paid faster! 📈

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Author**: COPCCA Development Team
