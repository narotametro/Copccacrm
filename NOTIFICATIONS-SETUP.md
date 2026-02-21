# Notifications System Setup

## Overview
The notification system is now **ACTIVATED** and will alert you about all updates across the entire CRM system in real-time!

## 📋 What You Need to Do

### 1. Run the Database Migration
Execute the SQL migration file in your Supabase dashboard:

```bash
File: database-notifications-system.sql
```

**Steps:**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database-notifications-system.sql`
4. Click **Run** to execute

### 2. What Gets Activated

Once you run the migration, you'll receive automatic notifications for:

#### ✅ **Customer Management**
- 🎉 New customer added
- Alert shows customer name and provides quick link to view details

#### 💰 **Sales & Orders**
- New order received with order number and total amount
- Direct link to Sales Hub for order processing

#### 📦 **Inventory Alerts**
- ⚠️ Low stock warnings when products reach minimum levels
- Smart alerts based on your configured min_stock_level
- High priority notifications with action links

#### 💵 **Invoice Tracking**
- ✅ Invoice payment confirmations
- 🚨 Overdue invoice alerts (urgent priority)
- Shows invoice number and amount

#### 🎊 **Welcome Messages**
- New users receive automatic welcome notification
- Helps onboard team members

### 3. Notification Features

**Real-time Updates:**
- Notifications appear instantly when events occur
- Automatic categorization (customers, sales, inventory, finance)
- Priority levels (low, medium, high, urgent)

**Smart UI:**
- 🔔 Unread count badge
- Filter by type (success, warning, error, info)
- Filter by category (customers, sales, inventory, finance)
- Search functionality
- Mark as read/unread
- Delete notifications
- Refresh button for manual updates

**Notification Types:**
- 🟢 **Success** - Positive events (new customer, order received, payment)
- 🟡 **Warning** - Attention needed (low stock)
- 🔴 **Error** - Critical issues (overdue invoices)
- 🔵 **Info** - General information

### 4. Using the System

**View Notifications:**
1. Click the 🔔 bell icon in navigation
2. See all notifications sorted by date (newest first)
3. Unread notifications highlighted
4. Click any notification to see full details

**Take Action:**
- Click notification links to navigate directly to related items
- Mark individual notifications as read by clicking them
- Use "Mark All Read" to clear all unread notifications
- Delete notifications you no longer need
- Use "Refresh" button to load latest alerts

**Filter & Search:**
- Filter by: All, Unread, Success, Warning, Info
- Filter by category dropdown
- Search by title, message, or sender name

### 5. Database Triggers (Automated)

The following triggers are automatically created:

```sql
✓ trigger_notify_new_customer      → When customer added
✓ trigger_notify_new_order          → When order created  
✓ trigger_notify_low_stock          → When stock level low
✓ trigger_notify_invoice_paid       → When invoice paid
✓ trigger_notify_invoice_overdue    → When invoice overdue
```

### 6. Helper Functions

**Create Custom Notifications:**
```sql
SELECT create_notification(
  user_id,           -- UUID of recipient
  'success',         -- Type: success, warning, info, error
  'Notification Title',
  'Short message',
  'Full details (optional)',
  'category',        -- customers, sales, inventory, finance, system
  'medium',          -- Priority: low, medium, high, urgent
  false,             -- Action required (true/false)
  '/app/link',       -- Action link (optional)
  'entity_type',     -- Related to (optional)
  entity_id          -- Related ID (optional)
);
```

**Welcome New Users:**
```sql
SELECT create_welcome_notification(user_id);
```

### 7. Customization

**Modify Notification Rules:**
Edit the trigger functions in `database-notifications-system.sql` to:
- Change notification messages
- Adjust priority levels
- Add new notification types
- Modify threshold values (e.g., low stock level)

**Add New Triggers:**
Create additional triggers for:
- Deal stage changes
- Customer feedback
- Support tickets
- Meeting reminders
- Task completions
- Campaign results

### 8. Troubleshooting

**Not receiving notifications?**
1. Verify migration ran successfully in Supabase
2. Check that RLS policies are active
3. Ensure you're logged in with correct user
4. Click "Refresh" button to manually load

**Need to reset?**
Run the migration again - it uses `DROP IF EXISTS` to safely recreate everything.

## 🎉 You're All Set!

Once you run the migration, the notification system is **LIVE** and will automatically alert you about all system updates. Start by adding a customer or creating an order to see your first notification!

---

**File Updated:** [src/pages/Notifications.tsx](src/pages/Notifications.tsx)
**Migration File:** [database-notifications-system.sql](database-notifications-system.sql)
**Commit:** d197dab - "Activate real-time notification system"
