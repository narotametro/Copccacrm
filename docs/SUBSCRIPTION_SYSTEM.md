# COPCCA CRM Subscription System

## Overview

This document explains the subscription and payment management system implemented in COPCCA CRM.

## Key Features

### 1. **Mandatory Subscription System**
- **Pricing**: TSH 30,000 per user per month
- **Billing**: Annual billing only (TSH 360,000 per user per year)
- **Enforcement**: Non-cancellable popup blocks access until payment is completed
- **User-based**: Admin pays for all team members

### 2. **Payment Methods**
- **M-Pesa** (Mobile Money)
- **Credit/Debit Cards** (Visa, Mastercard)
- **Bank Transfer** (with account details provided)

### 3. **User Roles**
- **Admin**: Main user who manages subscription and payments
- **Team Members**: Normal users who belong to an admin's team
- Admin pays for all team members under their account

## System Components

### Frontend Components

#### 1. SubscriptionModal (`/components/SubscriptionModal.tsx`)
- Non-cancellable payment modal
- Shows pricing breakdown (monthly and annual)
- Lists all included features
- Payment method selection
- Payment form submission

#### 2. SubscriptionGate (`/components/SubscriptionGate.tsx`)
- Wrapper component that checks subscription status
- Blocks access for unpaid admins
- Shows warning banner for team members with unpaid admin
- Automatically initializes subscription for new admins

#### 3. AdminManagementDashboard (`/components/AdminManagementDashboard.tsx`)
- **For COPCCA CRM office only**
- Manages all customer subscriptions
- View paid/unpaid status
- Activate/deactivate subscriptions
- Mark payments as paid/unpaid
- View payment history
- Analytics dashboard with revenue metrics

### Backend Routes

All routes are in `/supabase/functions/server/subscription.tsx`:

#### Public Routes
- `POST /subscription/initialize` - Create new subscription
- `GET /subscription/status?adminEmail={email}` - Check subscription status
- `POST /subscription/payment` - Process payment
- `GET /subscription/payments?adminEmail={email}` - Get payment history

#### Admin-Only Routes (COPCCA CRM Office)
- `GET /admin/subscriptions` - Get all subscriptions
- `PUT /admin/subscription/status` - Update subscription status
- `PUT /admin/payment/status` - Update payment status

## How It Works

### For End Users (Admins)

1. **First Login**:
   - Admin logs in for the first time
   - System automatically creates a pending subscription
   - Subscription modal appears (non-cancellable)

2. **Payment**:
   - Admin sees pricing: TSH 30,000/user/month × number of users × 12 months
   - Selects payment method
   - Enters payment details
   - Submits payment

3. **Access Granted**:
   - Upon successful payment, subscription status changes to "active"
   - Modal closes automatically
   - Full system access is granted for 12 months

4. **Expiration**:
   - After 12 months, subscription expires
   - Modal appears again requiring renewal
   - Access is blocked until payment

### For Team Members

- Team members automatically inherit their admin's subscription status
- If admin hasn't paid, team members see a warning banner but can still access the system
- Only admins can make payments

### For COPCCA CRM Office

1. **Access Admin Dashboard**:
   - Navigate to: `https://your-domain.com/#/copcca-admin`
   - Or: `https://your-domain.com/copcca-admin`
   - Enter admin password: `COPCCA_ADMIN_2024`

2. **Dashboard Features**:
   - **Statistics**: Total admins, active/expired subscriptions, paid/unpaid, revenue
   - **Search & Filter**: By email, name, subscription status, payment status
   - **User Management**:
     - View all admin accounts
     - See team size for each admin
     - Check subscription dates
     - View payment history
   - **Actions**:
     - Activate/Deactivate subscriptions
     - Mark payments as paid/unpaid
     - View detailed subscription info

## Database Structure

### Subscription Object
```javascript
{
  id: string,
  adminEmail: string,
  adminName: string,
  totalUsers: number,
  subscriptionStatus: 'active' | 'expired' | 'pending',
  paymentStatus: 'paid' | 'unpaid',
  subscriptionStart: ISO date string,
  subscriptionEnd: ISO date string,
  lastPaymentDate: ISO date string,
  lastPaymentAmount: number,
  paymentMethod: 'mpesa' | 'card' | 'bank',
  createdAt: ISO date string,
  updatedAt: ISO date string
}
```

### Payment Record
```javascript
{
  id: string,
  adminEmail: string,
  amount: number,
  paymentMethod: string,
  paymentDate: ISO date string,
  status: 'completed' | 'pending' | 'failed',
  transactionId: string
}
```

## Configuration

### Admin Password
Located in `/AdminDashboard.tsx`:
```javascript
const ADMIN_PASSWORD = 'COPCCA_ADMIN_2024';
```
**⚠️ Change this password in production!**

### Pricing
Located in `/components/SubscriptionModal.tsx`:
```javascript
const pricePerUser = 30000; // TSH per user per month
const annualMultiplier = 12;
```

## Integration with Payment Gateways

### Current Status
The system currently has **payment UI only**. You need to integrate with actual payment gateways:

### M-Pesa Integration
```javascript
// In /supabase/functions/server/subscription.tsx
// Add M-Pesa API integration in processPayment function
```

### Card Payment Integration
Recommended: Use **Stripe** or **PayStack**
```javascript
// Add Stripe/PayStack SDK
// Process card payments securely
```

### Bank Transfer
- Currently shows static bank details
- Consider adding automated reconciliation system

## Security Considerations

1. **Admin Dashboard**:
   - Password-protected
   - Access logged
   - Should be enhanced with proper authentication

2. **Payment Processing**:
   - Currently simulated
   - Must integrate with secure payment gateways
   - Use HTTPS in production
   - Never store card details directly

3. **Subscription Data**:
   - Stored in Supabase KV store
   - Consider encrypting sensitive data
   - Regular backups recommended

## Testing

### Test Scenarios

1. **New Admin Signup**:
   - Sign up as admin
   - Verify subscription modal appears
   - Cannot access app without payment

2. **Payment Flow**:
   - Select payment method
   - Fill payment details
   - Submit payment
   - Verify access granted

3. **Team Member**:
   - Invite team member
   - Team member logs in
   - Verify they can access (if admin paid)
   - Or see warning banner (if admin unpaid)

4. **Admin Dashboard**:
   - Access admin dashboard
   - Verify all subscriptions visible
   - Test activate/deactivate
   - Test payment status updates

## Troubleshooting

### Issue: Subscription modal doesn't appear
**Solution**: Check browser console for errors, verify subscription routes are working

### Issue: Payment not processing
**Solution**: Payment gateways not integrated yet - implement actual payment processing

### Issue: Can't access admin dashboard
**Solution**: Check URL hash or password, clear browser cache

### Issue: Team member blocked from access
**Solution**: Check admin's subscription status, activate if needed

## Revenue Metrics

The admin dashboard shows:
- **Total Revenue**: Sum of all paid subscriptions
- **Monthly Recurring Revenue (MRR)**: Total revenue / 12
- **Average Users per Admin**: Total users / Total admins
- **Total Users in System**: Sum of all users across all teams

## Future Enhancements

1. **Automatic Renewal**: Send reminders before expiration
2. **Payment Gateway Integration**: Integrate M-Pesa, Stripe, PayStack
3. **Invoicing System**: Generate PDF invoices
4. **Email Notifications**: Send payment confirmations
5. **Proration**: Handle mid-cycle team member additions
6. **Multiple Payment Plans**: Add monthly, quarterly options
7. **Discount Codes**: Support promotional codes
8. **Payment History**: Detailed transaction logs for customers

## Support

For technical support or questions:
- Email: support@copcca-crm.com
- Admin Dashboard: https://your-domain.com/#/copcca-admin

---

**Important**: Remember to integrate actual payment gateways before going to production. The current implementation provides the UI and flow, but payment processing needs to be connected to real payment providers.
