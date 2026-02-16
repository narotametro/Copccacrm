# COPCCA Admin Subscription Management

## Overview

This document describes the subscription management and payment popup activation features available to COPCCA administrators.

## Features Added

### 1. Payment Popup Activation/Deactivation

COPCCA administrators can now control whether users see payment popups through two admin panels:

#### Platform Admin (`/platform-admin`)
- **Location**: Payment popup toggle button in the subscriptions table
- **Icon**: Bell icon (BellOff when active)
- **Functionality**: 
  - Toggles `show_payment_popup` field in the `companies` table
  - Persists to database immediately
  - Shows success toast notification
  - Updates UI in real-time

#### Admin Subscriptions (`/admin/subscriptions`)
- **Location**: Banknote icon button in the Actions column
- **Functionality**:
  - Reads current payment popup status from company
  - Toggles the setting in the database
  - Shows confirmation message
  - Refreshes subscription data

### 2. Trial Extension

Administrators can extend trial periods for users directly from the Admin Subscriptions panel.

- **Location**: Clock icon button in the Actions column (only visible for trial subscriptions)
- **Functionality**:
  - Extends trial by 7 days from current trial end date
  - Updates `trial_end_date` in `user_subscriptions` table
  - Shows success notification
  - Automatically refreshes subscription list

### 3. Subscription Plan Management

Existing functionality enhanced with better UI:

- **Status Changes**: Update subscription status (active, expired, trial, suspended, past_due)
- **Plan Changes**: Upgrade or downgrade subscription plans
- **Details View**: Comprehensive subscription information modal

## Database Schema

### Required Columns

#### `companies` table
```sql
show_payment_popup BOOLEAN DEFAULT false
```

#### `user_subscriptions` table
```sql
trial_end_date TIMESTAMPTZ
status TEXT CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired'))
plan_id UUID REFERENCES subscription_plans(id)
```

## How to Use

### Activate Payment Popup for a Company

1. Navigate to **COPCCA Admin** → **Platform Admin** or **Admin Subscriptions**
2. Locate the company/subscription in the table
3. Click the **Bell icon** (Platform Admin) or **Banknote icon** (Admin Subscriptions)
4. Confirmation toast will appear
5. Users from that company will now see payment popup when they log in

### Deactivate Payment Popup

Follow the same steps above. The icon will change to indicate the payment popup is deactivated.

### Extend Trial Period

1. Navigate to **COPCCA Admin** → **Admin Subscriptions**
2. Find a subscription with **Trial** status
3. Click the **Clock icon** in the Actions column
4. Trial will be extended by 7 days
5. User will receive additional time before payment is required

### Change Subscription Plan

1. Navigate to **COPCCA Admin** → **Admin Subscriptions**
2. Click the **Edit icon** (pencil) in the Actions column
3. Select new plan from the modal
4. Plan will be updated immediately
5. User will see new limits on their next login

### View Subscription Details

1. Click the **Settings icon** (gear) in the Actions column
2. Modal will show:
   - User information (name, email, company, phone)
   - Plan details (name, price, status)
   - Plan limits (users, products, invoices, POS locations)
3. Can activate/deactivate subscription from this modal

## Technical Implementation

### Payment Popup Toggle (PlatformAdmin.tsx)

```typescript
const handleTogglePaymentPopup = async (id: string) => {
  // Gets company ID and toggles show_payment_popup in companies table
  const { error } = await supabase
    .from('companies')
    .update({ show_payment_popup: newShowPaymentPopup })
    .eq('id', id);
  // Updates local state and shows toast
};
```

### Payment Popup Toggle (AdminSubscriptions.tsx)

```typescript
const handleTogglePaymentPopup = async (userId: string) => {
  // Finds company associated with user's subscription
  // Toggles show_payment_popup field
  const { error } = await supabase
    .from('companies')
    .update({ show_payment_popup: newShowPaymentPopup })
    .eq('id', subscription.user.company_id);
};
```

### Trial Extension

```typescript
const handleExtendTrial = async (subscriptionId: string, daysToExtend: number = 7) => {
  // Calculates new trial end date (current + 7 days)
  // Updates user_subscriptions.trial_end_date
  const { error } = await supabase
    .from('user_subscriptions')
    .update({ trial_end_date: newTrialEnd.toISOString() })
    .eq('id', subscriptionId);
};
```

## User Experience

### When Payment Popup is Activated

1. User logs into the CRM
2. System checks `companies.show_payment_popup` for their company
3. If `true`, payment popup modal is displayed
4. User cannot dismiss popup until admin deactivates or payment is confirmed
5. Popup shows payment instructions and contact information

### When Trial is Extended

1. Admin extends trial by 7 days
2. User can continue using the system without payment
3. Trial end date is updated in their subscription
4. User sees updated trial expiration date in their account

## API Integration Points

### Supabase Tables Modified

- `companies.show_payment_popup` - Controls payment popup visibility
- `user_subscriptions.trial_end_date` - Controls trial expiration
- `user_subscriptions.status` - Subscription status
- `user_subscriptions.plan_id` - Subscription plan

### Real-time Updates

Both admin panels automatically refresh data after changes to ensure administrators see the latest subscription status.

## Future Enhancements

Potential improvements for future releases:

1. **Custom Trial Extension**: Allow admins to specify custom number of days
2. **Bulk Operations**: Enable/disable payment popup for multiple companies at once
3. **Scheduled Popup**: Set future date for payment popup activation
4. **Payment Reminders**: Automate reminder emails before trial expiration
5. **Audit Log**: Track which admin made which subscription changes and when
6. **Notification System**: Alert company admins when their subscription is modified

## Troubleshooting

### Payment Popup Not Showing

- Verify `show_payment_popup = true` in companies table
- Check user's `company_id` matches the company
- Clear browser cache and localStorage
- Check browser console for errors

### Trial Extension Not Working

- Verify subscription status is 'trial'
- Check `trial_end_date` is not null in database
- Ensure COPCCA admin has proper permissions
- Review Supabase RLS policies

### Database Permissions

Ensure COPCCA admin role has permissions to:
- UPDATE companies.show_payment_popup
- UPDATE user_subscriptions.trial_end_date
- UPDATE user_subscriptions.status
- UPDATE user_subscriptions.plan_id

## Support

For technical support or questions about subscription management features:

1. Check the main [README.md](README.md) for general setup
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) for production environment
3. Contact the development team for database schema issues
4. Refer to Supabase documentation for RLS policy modifications

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Commit**: 4fa595c
