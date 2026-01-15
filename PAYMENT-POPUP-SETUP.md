# Payment Popup - Database-Controlled Setup

## Overview
The payment popup is now fully controlled through the COPCCA admin platform's database. Admins can enable/disable the popup for each company directly in the Companies management page.

---

## How It Works

### 1. Database Control
- The `companies` table has a `show_payment_popup` boolean field
- When set to `true`, users in that company will see the payment reminder popup
- When set to `false` (default), no popup is shown
- The popup auto-dismisses after 10 seconds

### 2. Admin Management
Admins can control the popup in **two ways**:

#### Option A: Companies Page (Main)
**Location:** `/app/companies`

1. Navigate to **Companies** in the sidebar (Building icon)
2. Click **"Add Company"** or **"Edit"** on existing company
3. Scroll to bottom of form
4. Toggle **"Show Payment Popup"** checkbox
5. Click **Save**

**What it does:**
- ✅ Checked: Payment popup will appear for all users in this company
- ❌ Unchecked: No popup shown

#### Option B: Settings Page (View Only)
**Location:** `/app/settings`

The **Company Information** section at the top allows admins to:
- Update company profile details (name, industry, size, website, etc.)
- This information is shared with all users in the organization
- Does NOT control popup visibility (use Companies page for that)

---

## Features

### For Admins (COPCCA Platform)
1. **Enable/Disable Popup Per Company**
   - Simple checkbox in Add/Edit Company forms
   - Instant effect when saved
   - Controlled centrally from database

2. **Real-time Data**
   - Popup shows company name from database
   - Calculates days overdue based on `subscription_end_date`
   - Displays subscription amount (₦120,000 default)

3. **Company Information Management**
   - Update company profile in Settings
   - Manage subscription plans (Starter/Professional/Enterprise)
   - Track user counts per company

### For Users
1. **Smart Popup Display**
   - Only shows if admin enabled it for their company
   - Auto-dismisses after 10 seconds
   - Shows company name, days overdue, amount due
   - Clean, professional design

---

## Technical Details

### Database Fields
**companies table:**
```sql
show_payment_popup      BOOLEAN (default: false)
subscription_end_date   TIMESTAMP
subscription_plan       TEXT ('starter', 'professional', 'enterprise')
name                    TEXT
```

### Code Flow
1. User logs in → AppLayout loads
2. AppLayout fetches user's `company_id`
3. Queries `companies` table for `show_payment_popup` flag
4. If `true`, displays popup with company data
5. Auto-hides after 10 seconds

### Files Modified
- `src/components/layout/AppLayout.tsx` - Popup logic (database-driven)
- `src/pages/Companies.tsx` - Admin control toggle
- `src/pages/Settings.tsx` - Company Information section

---

## Setup Instructions

### Step 1: Ensure Database is Updated
Run the migration if not already done:
```sql
-- File: database-add-company-to-users.sql
-- Adds show_payment_popup field and other subscription fields
```

### Step 2: Test the Feature
1. **As Admin:**
   - Go to `/app/companies`
   - Edit a company
   - Enable "Show Payment Popup"
   - Save

2. **As User (same company):**
   - Login or refresh page
   - Popup should appear for 10 seconds
   - Should display company name and payment details

3. **Disable Again:**
   - Admin unchecks the toggle
   - Users will no longer see popup

---

## Example Workflow

### Scenario: Enable Payment Reminder
**Admin Side (COPCCA Platform):**
1. Login as admin
2. Click **Companies** in sidebar
3. Find "COPCCA Technologies"
4. Click **Edit** (pencil icon)
5. Scroll down to "Show Payment Popup"
6. ✅ Check the box
7. Click **"Update Company"**

**User Side (Any Company User):**
1. Login or refresh
2. See payment popup immediately:
   ```
   Payment Overdue
   COPCCA Technologies
   Your account is 15 days overdue
   Amount Due: ₦120,000.00
   ```
3. Popup auto-disappears after 10s

---

## Where to Find Features

### Company Information (Settings)
**Path:** `/app/settings`
**Who Sees:** Admins only
**Purpose:** Update company profile details
**Fields:**
- Company Name *
- Industry
- Company Size
- Website
- Phone
- Address

### Companies Management
**Path:** `/app/companies`
**Who Sees:** Admins only
**Purpose:** Full company CRUD + popup control
**Features:**
- View all companies
- Add new companies
- Edit company details + subscription
- Enable/disable payment popup ✅ **THIS IS WHERE YOU CONTROL IT**
- Delete companies
- Track user counts

---

## Summary

✅ **Popup is now database-controlled**
✅ **Admin can enable/disable in Companies page**
✅ **Company Information visible in Settings (admin-only)**
✅ **Auto-dismiss after 10 seconds**
✅ **Real-time data from database**

**Main Control:** `/app/companies` → Edit → Toggle "Show Payment Popup"
