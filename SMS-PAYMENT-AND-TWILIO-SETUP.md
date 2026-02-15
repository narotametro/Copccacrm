# 📱 SMS Credits Payment Flow & Twilio Integration Guide

## 🎯 Overview

COPCCA CRM uses a **centralized SMS service** where:
- **COPCCA** manages ONE Twilio account (admin)
- **Users** buy SMS credits (pay-as-you-go)
- **System** automatically sends SMS using COPCCA's Twilio

---

## 💳 PART 1: How Users Pay for SMS Credits

### Step-by-Step Payment Flow

```
User Journey:
1. User goes to Settings → SMS / Automation → Credits & Balance
2. Sees current balance: "TSh 0" (empty account)
3. Clicks "Buy Business Pack" (500 SMS @ TSh 20,000)
4. Selects payment method:
   ├── M-Pesa (Tanzania/Kenya)
   ├── Credit Card (International)
   └── Bank Transfer (Manual verification)
5. Completes payment
6. Credits added instantly
7. Balance updates: "TSh 20,000" (1,000 SMS available)
```

### Current Implementation Status

#### ✅ What's Working (Demo Mode):
- **UI**: Full payment modal with 3 payment methods
- **Database**: Credits system ready (company_sms_balance, sms_transactions)
- **Functions**: `add_sms_credits()`, `deduct_sms_credits()`, `get_company_sms_balance()`
- **Simulation**: 2-second delay, then credits added

#### 🚧 What Needs Integration (Production):

**File**: `src/components/sms/SMSCredits.tsx` (Lines 240-300)

```typescript
// CURRENT CODE (Demo):
const handlePayment = async () => {
  setProcessing(true);
  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production, integrate with:
    // - M-Pesa API (for Tanzania/Kenya)
    // - Stripe/PayPal (for cards)
    // - Bank transfer verification
    
    // Add credits via DB function
    const { error } = await supabase.rpc('add_sms_credits', {
      p_company_id: userData.company_id,
      p_credits_amount: pkg.price_usd,
      p_payment_method: paymentMethod,
      p_payment_reference: `PAY-${Date.now()}`,
      p_package_id: pkg.id
    });
  } catch (error) {
    toast.error('Payment failed');
  }
};
```

---

### Production Payment Integration

#### Option 1: M-Pesa Integration (Tanzania/Kenya)

**Requirements:**
- Safaricom/Vodacom M-Pesa API credentials
- STK Push (Lipa na M-Pesa) integration
- Callback URL for payment confirmation

**Code to Add:**
```typescript
// src/lib/services/mpesaService.ts
export async function initiateMpesaPayment(
  phoneNumber: string,
  amount: number,
  accountReference: string
) {
  const response = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MPESA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BusinessShortCode: '174379',
      Password: generateMpesaPassword(),
      Timestamp: getTimestamp(),
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: '174379',
      PhoneNumber: phoneNumber,
      CallBackURL: 'https://your-domain.com/api/mpesa/callback',
      AccountReference: accountReference,
      TransactionDesc: 'SMS Credits Purchase'
    })
  });
  
  return response.json();
}
```

#### Option 2: Stripe Integration (International Cards)

**Requirements:**
- Stripe account (sign up at stripe.com)
- Stripe publishable + secret keys

**Installation:**
```bash
npm install @stripe/stripe-js stripe
```

**Code to Add:**
```typescript
// src/lib/services/stripeService.ts
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_live_YOUR_PUBLISHABLE_KEY');

export async function createCheckoutSession(
  packageId: string,
  amount: number,
  companyId: string
) {
  const response = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packageId,
      amount,
      companyId,
      successUrl: `${window.location.origin}/settings/sms?payment=success`,
      cancelUrl: `${window.location.origin}/settings/sms?payment=cancel`
    })
  });
  
  const { sessionId } = await response.json();
  const stripe = await stripePromise;
  await stripe.redirectToCheckout({ sessionId });
}
```

**Backend (Supabase Edge Function):**
```typescript
// supabase/functions/stripe-create-checkout/index.ts
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  const { packageId, amount, companyId } = await req.json();
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'SMS Credits' },
        unit_amount: amount * 100, // Convert to cents
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: req.headers.get('origin') + '/settings/sms?payment=success',
    cancel_url: req.headers.get('origin') + '/settings/sms?payment=cancel',
    metadata: { companyId, packageId }
  });
  
  return new Response(JSON.stringify({ sessionId: session.id }));
});
```

#### Option 3: Bank Transfer (Manual Verification)

**Flow:**
1. User selects "Bank Transfer"
2. System shows bank details:
   ```
   Bank: CRDB Bank Tanzania
   Account: COPCCA SMS Services
   Account Number: 0150-XXXX-XXXX
   Reference: SMS-{COMPANY_ID}-{TIMESTAMP}
   ```
3. User makes transfer
4. Admin verifies payment manually
5. Admin approves → Credits added via admin panel

---

## 🔧 PART 2: How COPCCA Enables Twilio SMS

### Centralized Architecture

```
┌─────────────────────────────────────────┐
│         COPCCA Admin Panel              │
│  (Only COPCCA Super Admin Access)       │
└────────────────┬────────────────────────┘
                 │
                 │ Configures ONE Twilio Account
                 ↓
┌─────────────────────────────────────────┐
│       system_settings table             │
│  twilio_account_sid: "ACxxxxxxxxxxxx"   │
│  twilio_auth_token: "xxxxxxxxxxxxx"     │
│  twilio_phone_number: "+1234567890"     │
└────────────────┬────────────────────────┘
                 │
                 │ Used by ALL companies
                 ↓
┌─────────────────────────────────────────┐
│      User Companies (Tenant A, B, C)    │
│  - Buy SMS credits                      │
│  - Send SMS to customers                │
│  - System uses COPCCA's Twilio          │
└─────────────────────────────────────────┘
```

### Setup Steps for COPCCA Admin

#### Step 1: Create Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up (Business account recommended)
3. Verify your email and phone

#### Step 2: Get Twilio Credentials

After login, you'll see:
```
Account SID:    ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token:     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Click "Get a Trial Phone Number" or buy a number:
```
Phone Number:   +1 234-567-8900  (US number)
                +255 XXX XXX XXX (Tanzania number - better for Africa)
```

**💡 Recommendation for Africa:**
- Buy a **local phone number** in Tanzania (+255) or Kenya (+254)
- Better delivery rates for African recipients
- Lower costs (local rates)
- Higher trust (local number)

#### Step 3: Configure in Supabase

**Option A: Via SQL Editor (Supabase Dashboard)**

```sql
-- Insert Twilio credentials into system_settings
INSERT INTO system_settings (key, value, description, category)
VALUES 
  ('twilio_account_sid', 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Twilio Account SID', 'sms'),
  ('twilio_auth_token', 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Twilio Auth Token', 'sms'),
  ('twilio_phone_number', '+255754123456', 'Twilio Phone Number (Tanzania)', 'sms'),
  ('sms_enabled', 'true', 'Enable SMS globally', 'sms')
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();
```

**Option B: Via Admin Panel (Future Feature)**

Create an admin-only page: `src/pages/admin/SMSConfiguration.tsx`

```typescript
// Admin Panel - Only accessible by super_admin role
export const SMSConfiguration: React.FC = () => {
  const [config, setConfig] = useState({
    accountSid: '',
    authToken: '',
    phoneNumber: ''
  });
  
  const saveTwilioConfig = async () => {
    // Verify user is super admin
    const { data: user } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'super_admin') {
      toast.error('Unauthorized');
      return;
    }
    
    // Save to system_settings
    await supabase.from('system_settings').upsert([
      { key: 'twilio_account_sid', value: config.accountSid },
      { key: 'twilio_auth_token', value: config.authToken },
      { key: 'twilio_phone_number', value: config.phoneNumber }
    ]);
    
    toast.success('Twilio configured successfully');
  };
  
  return (
    <Card>
      <h2>Twilio Configuration (Admin Only)</h2>
      <Input 
        label="Account SID" 
        value={config.accountSid}
        onChange={(e) => setConfig({...config, accountSid: e.target.value})}
      />
      <Input 
        label="Auth Token" 
        type="password"
        value={config.authToken}
        onChange={(e) => setConfig({...config, authToken: e.target.value})}
      />
      <Input 
        label="Phone Number" 
        value={config.phoneNumber}
        onChange={(e) => setConfig({...config, phoneNumber: e.target.value})}
      />
      <Button onClick={saveTwilioConfig}>Save Configuration</Button>
    </Card>
  );
};
```

#### Step 4: How SMS Sending Works

**File**: `src/lib/services/smsService.ts`

```typescript
/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(message: SMSMessage, config: SMSConfig): Promise<SMSResult> {
  try {
    // Get COPCCA's centralized Twilio credentials from database
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`;
    
    // Create auth header
    const auth = btoa(`${config.twilioAccountSid}:${config.twilioAuthToken}`);
    
    // Send SMS via Twilio API
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: message.to,
        From: config.twilioPhoneNumber || '',
        Body: message.body,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Twilio API error');
    }

    const result = await response.json();
    
    // Log SMS to database
    await logSMSToDatabase(message, result.sid, 'sent', config.twilioPhoneNumber);

    return {
      success: true,
      messageId: result.sid,
      to: message.to,
      provider: 'twilio'
    };
  } catch (error) {
    console.error('Twilio SMS failed:', error);
    
    // Log failure
    await logSMSToDatabase(message, null, 'failed', config.twilioPhoneNumber, error.message);
    
    return {
      success: false,
      error: error.message,
      to: message.to,
      provider: 'twilio'
    };
  }
}

/**
 * Log SMS to database for tracking
 */
async function logSMSToDatabase(
  message: SMSMessage,
  messageId: string | null,
  status: string,
  fromNumber: string,
  errorMessage?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user?.id)
    .single();

  await supabase.from('sms_logs').insert({
    phone_number: message.to,
    message_body: message.body,
    status: status,
    provider: 'twilio',
    message_id: messageId,
    error_message: errorMessage,
    debt_id: message.debtId,
    invoice_number: message.invoiceNumber,
    company_id: userData?.company_id,
    sent_by: user?.id
  });
}
```

---

## 📊 Complete SMS Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     USER SENDS SMS REMINDER                     │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │  Check SMS Balance    │
         │  (company_sms_balance)│
         └──────────┬────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ↓                       ↓
   ❌ Balance = 0          ✅ Balance > 0
   Show error              Continue
   "Buy credits"               │
                               ↓
                  ┌─────────────────────────┐
                  │ Load Twilio Config      │
                  │ (from system_settings)  │
                  │ - Account SID           │
                  │ - Auth Token            │
                  │ - Phone Number          │
                  └──────────┬──────────────┘
                             │
                             ↓
                  ┌─────────────────────────┐
                  │ Send via Twilio API     │
                  │ POST /Messages.json     │
                  │ From: +255754123456     │
                  │ To: Customer phone      │
                  └──────────┬──────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ↓                       ↓
            ✅ Success              ❌ Failed
            SID: SMxxxx             Error logged
                 │                       │
                 ↓                       ↓
    ┌────────────────────────┐   ┌──────────────┐
    │ Deduct Credits         │   │ Credits NOT  │
    │ Balance: 20→19.98      │   │ deducted     │
    └────────────┬───────────┘   └──────────────┘
                 │
                 ↓
    ┌────────────────────────┐
    │ Log to sms_logs        │
    │ - message_id: SMxxxx   │
    │ - status: sent         │
    │ - cost: $0.02          │
    └────────────────────────┘
```

---

## 🔒 Security Best Practices

### 1. Protect Twilio Credentials

**✅ DO:**
- Store in `system_settings` table with RLS policies
- Only admin can read/write Twilio credentials
- Use environment variables in production
- Rotate auth tokens every 90 days

**❌ DON'T:**
- Never commit credentials to Git
- Don't expose in frontend code
- Don't send in API responses to users

### 2. RLS Policy for system_settings

```sql
-- Only super admins can view/edit Twilio credentials
CREATE POLICY "Only super admins manage Twilio config"
ON system_settings
FOR ALL
USING (
  key NOT LIKE 'twilio_%' OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
);
```

### 3. Rate Limiting

Add to `src/lib/services/smsService.ts`:

```typescript
// Prevent SMS spam
const SMS_RATE_LIMIT = 100; // Max 100 SMS per hour per company

async function checkRateLimit(companyId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const { count } = await supabase
    .from('sms_logs')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', oneHourAgo.toISOString());
  
  return (count || 0) < SMS_RATE_LIMIT;
}
```

---

## 💰 Pricing & Revenue Model

### For COPCCA (Business Model)

**Cost from Twilio:**
- $0.0075 per SMS (US number)
- $0.01 per SMS (Tanzania number)

**Sell to Users:**
- $0.02 per SMS (pay-as-you-go)

**Profit Margin:**
- $0.0125 per SMS = **166% markup**
- At 10,000 SMS/month = $125 profit/month

### Bulk Pricing Tiers

| Package | SMS Count | User Price | COPCCA Cost | Profit |
|---------|-----------|------------|-------------|--------|
| Starter | 100 | $2.00 | $0.75 | $1.25 |
| Business | 500 | $8.00 | $3.75 | $4.25 |
| Pro | 1,000 | $14.00 | $7.50 | $6.50 |
| Enterprise | 5,000 | $60.00 | $37.50 | $22.50 |
| Mega | 10,000 | $100.00 | $75.00 | $25.00 |

---

## 🧪 Testing Guide

### Test in Demo Mode (No Twilio)

1. Go to Settings → SMS / Automation
2. Click "Buy Starter Pack"
3. Select any payment method
4. Wait 2 seconds (simulated payment)
5. See balance updated
6. Go to Debt Collection → Send reminder
7. SMS logged but not actually sent

### Test with Real Twilio (Production)

1. **Admin** configures Twilio credentials in database
2. Add test debt with YOUR phone number
3. Click "Send Reminder"
4. Should receive actual SMS on your phone
5. Check `sms_logs` table for message_id (starts with "SM")

### Verify Twilio Integration

```sql
-- Check if Twilio is configured
SELECT key, value, created_at 
FROM system_settings 
WHERE key LIKE 'twilio_%';

-- Check SMS logs
SELECT 
  phone_number,
  message_body,
  status,
  provider,
  message_id,
  created_at
FROM sms_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check company balance
SELECT 
  companies.name,
  company_sms_balance.balance,
  company_sms_balance.total_sms_sent,
  company_sms_balance.total_spent
FROM company_sms_balance
JOIN companies ON companies.id = company_sms_balance.company_id;
```

---

## 🚀 Production Deployment Checklist

- [ ] Twilio account created (business plan)
- [ ] Local phone number purchased (+255 or +254)
- [ ] Twilio credentials added to system_settings
- [ ] M-Pesa/Stripe payment integration completed
- [ ] Webhook endpoints configured
- [ ] Rate limiting enabled
- [ ] Admin panel for Twilio config created
- [ ] RLS policies verified
- [ ] SMS templates tested (English + Swahili)
- [ ] Balance deduction working correctly
- [ ] Error logging functional
- [ ] Customer support ready for SMS issues

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: "Insufficient balance" error**
- **Cause:** User has $0 credits
- **Fix:** User must buy SMS credits first

**Issue: SMS not sending (demo mode)**
- **Cause:** Twilio not configured
- **Fix:** Admin must add Twilio credentials to database

**Issue: "Invalid phone number" error**
- **Cause:** Phone number format incorrect
- **Fix:** Use E.164 format: +255754123456 (not 0754123456)

**Issue: Credits deducted but SMS failed**
- **Cause:** Twilio API error
- **Fix:** Check `sms_logs.error_message`, credits will be refunded

### Support Contacts

- **Twilio Support:** https://www.twilio.com/help
- **M-Pesa Integration:** https://developer.safaricom.co.ke
- **COPCCA CRM:** support@copcca.com

---

## 📚 Additional Resources

- [Twilio SMS API Docs](https://www.twilio.com/docs/sms)
- [M-Pesa Daraja API](https://developer.safaricom.co.ke/APIs)
- [Stripe Integration Guide](https://stripe.com/docs/payments)
- [SMS Best Practices](https://www.twilio.com/docs/sms/best-practices)

---

**Last Updated:** February 16, 2026  
**Version:** 1.0  
**Maintained by:** COPCCA Development Team
