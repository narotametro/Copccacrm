# COPCCA CRM Office - Admin Dashboard Quick Guide

## 🔐 Accessing the Admin Dashboard

### Step 1: Navigate to Admin URL
**Option 1**: Add hash to your URL
```
https://your-domain.com/#/copcca-admin
```

**Option 2**: Direct path
```
https://your-domain.com/copcca-admin
```

### Step 2: Enter Password
- Password: `COPCCA_ADMIN_2024`
- Click "Access Dashboard"

---

## 📊 Dashboard Overview

### Top Statistics Bar
- **Total Admins**: Number of registered admin accounts
- **Active**: Admins with active subscriptions
- **Expired**: Admins with expired subscriptions
- **Paid**: Admins who have paid
- **Unpaid**: Admins pending payment
- **Total Revenue**: Sum of all payments in TSH

---

## 🔍 Search and Filter

### Search Bar
- Search by admin email or name
- Real-time filtering

### Filters
1. **Subscription Status**:
   - All Status
   - Active
   - Expired
   - Pending

2. **Payment Status**:
   - All Payments
   - Paid
   - Unpaid

---

## 👥 Managing Subscriptions

### View Subscription Details
Each row shows:
- **Admin Info**: Name, email, profile picture
- **Users**: Number of team members
- **Subscription**: Status badge (Active/Expired/Pending)
- **Payment**: Status and amount
- **Dates**: Start date, end date, last payment date

### Action Buttons

#### 1. Activate/Deactivate Subscription
**To Activate**:
- Find admin with "Expired" status
- Click "Activate" button
- Subscription extends for 1 year from today

**To Deactivate**:
- Find admin with "Active" status
- Click "Deactivate" button
- Subscription immediately expires

#### 2. Mark Paid/Unpaid
**Mark as Paid**:
- Find admin with "Unpaid" status
- Click "Mark Paid" button
- Updates payment record

**Mark as Unpaid**:
- Find admin with "Paid" status
- Click "Mark Unpaid" button
- Admin will see payment modal on next login

---

## 💰 Payment Management

### When Customer Pays via Bank Transfer
1. Receive payment confirmation/receipt
2. Search for customer by email
3. Click "Mark Paid" button
4. Click "Activate" button (if subscription was expired)
5. Confirm with customer that access is restored

### When Customer Pays via M-Pesa
1. Verify M-Pesa transaction
2. Note transaction ID
3. Search for customer by email
4. Click "Mark Paid" button
5. Subscription automatically activates

### When Customer Pays via Card
1. Payment processes automatically
2. Verify in dashboard that status updated
3. If not updated, manually mark as paid

---

## 📈 Revenue Analytics

### Bottom Summary Section
Shows three key metrics:
1. **Monthly Recurring Revenue**: Total annual revenue / 12
2. **Average Users per Admin**: Average team size
3. **Total Users in System**: Sum of all users

---

## 🎯 Common Tasks

### Task 1: Onboard New Customer
1. Customer signs up and sees payment modal
2. Customer completes payment
3. Verify payment received
4. Check dashboard - should show as "Paid" and "Active"
5. If not automatic, manually activate

### Task 2: Handle Expired Subscription
1. Customer contact about access issue
2. Search customer in dashboard
3. Check if subscription expired
4. Verify payment received
5. Click "Activate" to restore access

### Task 3: Process Bank Transfer
1. Receive bank transfer receipt
2. Verify amount matches subscription cost
3. Search customer by email in dashboard
4. Click "Mark Paid"
5. Click "Activate"
6. Confirm with customer

### Task 4: Handle Dispute
1. Customer claims they paid but no access
2. Search customer in dashboard
3. Check payment status and dates
4. Verify payment in bank/M-Pesa records
5. If payment confirmed, manually activate
6. Document transaction ID for records

### Task 5: Generate Monthly Report
1. Note total revenue at month start
2. Track new subscriptions throughout month
3. Note total revenue at month end
4. Calculate difference = monthly revenue
5. Check MRR metric for trends

---

## ⚠️ Important Notes

### Subscription Calculation
- **Price per user per month**: TSH 30,000
- **Annual billing**: TSH 30,000 × 12 = TSH 360,000 per user
- **Example**: Admin with 5 users = TSH 360,000 × 5 = TSH 1,800,000/year

### Status Meanings
- **Active**: Customer has valid subscription, can access system
- **Expired**: Subscription period ended, customer blocked
- **Pending**: New signup, payment not completed
- **Paid**: Payment received and recorded
- **Unpaid**: Payment pending or failed

### Best Practices
1. ✅ Always verify payment before activating
2. ✅ Keep transaction IDs for reference
3. ✅ Respond to customer queries within 24 hours
4. ✅ Send payment confirmations to customers
5. ✅ Review expired subscriptions weekly
6. ✅ Follow up with unpaid customers after 7 days

---

## 🆘 Troubleshooting

### Issue: Can't access admin dashboard
**Solutions**:
1. Check URL is correct
2. Try clearing browser cache
3. Verify password is correct
4. Try different browser

### Issue: Customer paid but still blocked
**Solutions**:
1. Search customer in dashboard
2. Check payment status
3. Manually mark as "Paid"
4. Manually "Activate" subscription
5. Ask customer to refresh browser

### Issue: Wrong user count
**Solutions**:
1. Check customer's team management page
2. Count active team members
3. Calculate correct subscription cost
4. Contact customer if discrepancy

### Issue: Payment recorded twice
**Solutions**:
1. Check transaction IDs
2. Verify if duplicate or separate payments
3. If duplicate, note for refund
4. Document in system

---

## 📞 Customer Support Scripts

### Script 1: Payment Confirmation
```
"Thank you for your payment of TSH [AMOUNT]. Your subscription 
has been activated and is valid until [END DATE]. You now have 
full access to all COPCCA CRM features."
```

### Script 2: Expired Subscription
```
"Your subscription expired on [DATE]. To continue using COPCCA CRM, 
please renew your subscription. Current pricing is TSH 30,000 per 
user per month, billed annually. Your team has [X] users, total 
cost: TSH [TOTAL]."
```

### Script 3: Payment Pending
```
"We have not yet received your payment. Please complete payment 
via M-Pesa, bank transfer, or card. Once payment is confirmed, 
your access will be activated immediately."
```

---

## 📋 Daily Checklist

- [ ] Check new signups (Pending status)
- [ ] Review unpaid subscriptions
- [ ] Process any bank transfer confirmations
- [ ] Respond to customer payment queries
- [ ] Check for subscriptions expiring this week
- [ ] Send renewal reminders for upcoming expirations
- [ ] Update revenue tracking spreadsheet
- [ ] Archive old payment records

---

## 🔒 Security Reminders

1. **Never share admin password**
2. **Always verify payment before activating**
3. **Keep customer payment info confidential**
4. **Log out when leaving computer**
5. **Use secure connection (HTTPS)**
6. **Change password regularly**

---

## 📧 Contact Information

**For technical support**:
- Developer: [Your Tech Team]
- Emergency: [Emergency Contact]

**For payment issues**:
- Finance Team: [Finance Contact]
- Bank Details: [Bank Info]

---

**Last Updated**: December 2024
**Version**: 1.0
**For**: COPCCA CRM Office Use Only
