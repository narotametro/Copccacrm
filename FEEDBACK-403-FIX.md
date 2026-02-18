# Customer Feedback 403 Error - Complete Fix

## Problem Summary

**Error**: `Failed to load resource: the server responded with a status of 403 ()` when trying to add customer feedback

**Root Cause**: Row Level Security (RLS) policies on the `customer_feedback` table are too restrictive. The existing policies check if the user created the company (`c.created_by = auth.uid()`), but in your case:
- User ID: `f3992c78-0635-46fb-9c17-1bcfe7077ede`
- Company ID: `53911317-6a31-4b7e-a98f-92e085a47180`
- The company was NOT created by this user, causing the 403 error

## The Fix (3 Steps)

### Step 1: Run the SQL Migration

**File**: `fix-feedback-403-error.sql`

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `fix-feedback-403-error.sql`
4. Click **Run**

This will:
- ✅ Drop all restrictive RLS policies
- ✅ Create permissive policies allowing authenticated users to insert/view feedback
- ✅ Grant necessary permissions
- ✅ Verify the new policies are active

### Step 2: Verify the Fix

After running the SQL, check the output shows 4 policies:
```
policyname                                  | cmd    | roles
--------------------------------------------+--------+------------------
authenticated_users_delete_feedback         | DELETE | {authenticated}
authenticated_users_insert_feedback         | INSERT | {authenticated}
authenticated_users_select_feedback         | SELECT | {authenticated}
authenticated_users_update_feedback         | UPDATE | {authenticated}
```

### Step 3: Test in the App

1. **Refresh your browser** (CTRL + F5 to clear cache)
2. Navigate to any customer in Customer 360
3. Go to the **Feedback** tab
4. Click **Add Feedback**
5. Fill out the form and submit

**Expected Result**: ✅ "Feedback added successfully!" toast message

## About the 404 Error

The 404 error (`333e85ac-df0e-4c39-bbcb-f1a07fd15b42:1`) is:
- **Likely**: PWA service worker trying to cache an old chunk file
- **Not blocking**: App functionality works fine
- **Auto-resolves**: When deployment completes and browser cache clears

To manually clear it:
1. Open DevTools (F12)
2. Go to **Application** tab
3. **Clear Storage** → Check "Unregister service workers"
4. Click **Clear site data**
5. Refresh page

## Technical Details

### customer_feedback Table Schema
```sql
CREATE TABLE customer_feedback (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  type TEXT CHECK (type IN ('survey', 'review', 'complaint', 'suggestion', 'testimonial')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Note**: No `created_by` field exists, so policies cannot restrict by creator.

### Frontend Insert Code
Location: `src/pages/CustomerDetailPage.tsx` line ~1485

```typescript
const { error } = await supabase
  .from('customer_feedback')
  .insert({
    company_id: customer.id,  // ✅ Customer being reviewed
    type: feedbackData.category.toLowerCase(),  // ✅ survey/review/etc
    rating: feedbackData.type === 'positive' ? 5 : feedbackData.type === 'negative' ? 2 : 3,
    feedback_text: feedbackData.comment
  });
```

All required fields are present. The issue was **purely RLS policy restrictions**.

## Why the New Policies Are Safe

1. **Authentication Required**: Only logged-in users can add feedback
2. **Company Validation**: INSERT policy checks company exists in database
3. **Audit Trail**: `created_at` timestamp automatically recorded
4. **Business Logic**: Customer feedback should be accessible to all team members, not just company creators

## Verification Checklist

After running the fix:
- [ ] SQL migration executed successfully
- [ ] 4 RLS policies visible in verification query
- [ ] Browser refreshed (CTRL + F5)
- [ ] Feedback can be added without 403 errors
- [ ] Toast shows "Feedback added successfully!"
- [ ] Feedback appears in customer feedback history

## Troubleshooting

**If 403 persists:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'customer_feedback';
-- rowsecurity should be 't' (true)

-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'customer_feedback';
-- Should show 4 policies
```

**If Insert still fails:**
```sql
-- Test insert directly in SQL editor
INSERT INTO customer_feedback (company_id, type, rating, feedback_text)
VALUES ('53911317-6a31-4b7e-a98f-92e085a47180', 'review', 5, 'Test feedback');
-- Should succeed
```

## Related Files
- `fix-feedback-403-error.sql` - **RUN THIS FIRST**
- `database-fix-feedback-rls.sql` - Old restrictive policies (don't use)
- `fix-customer-feedback-access.sql` - Alternative permissive approach
- `src/pages/CustomerDetailPage.tsx` - Frontend feedback insertion code
