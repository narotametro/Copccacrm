# DATA ISOLATION & SUBSCRIPTION FIX GUIDE

## Problem Summary

Your CRM had critical data isolation issues where new users could see:
- ✅ **FIXED**: Customers from other companies
- ✅ **FIXED**: Orders from other companies  
- ✅ **FIXED**: Products from other companies
- ✅ **FIXED**: Expenses from other companies
- ✅ **FIXED**: Tasks from other companies

Additionally, START plan users could access premium features that should be restricted.

---

## Solution Overview

Two SQL migration files have been created:

1. **`database-fix-data-isolation.sql`** - Fixes data leakage (CRITICAL - Run First)
2. **`database-auto-assign-subscription.sql`** - Auto-assigns START plan to new users

---

## Step 1: Run SQL Migrations in Supabase

### 1.1 Fix Data Isolation (CRITICAL)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open `database-fix-data-isolation.sql` from your project
4. Copy all contents and paste into SQL Editor
5. Click **Run** button
6. Verify success message: `✓ Data isolation RLS policies updated successfully`

**What this does:**
- Adds `company_id` column to tables that were missing it
- Drops old permissive RLS policies
- Creates new company-scoped RLS policies
- Cleans up orphaned data
- Ensures users only see their own company's data

### 1.2 Auto-Assign Subscriptions

1. In Supabase SQL Editor
2. Open `database-auto-assign-subscription.sql`
3. Copy all contents and paste into SQL Editor
4. Click **Run** button
5. Verify success message: `✓ Subscription auto-assignment configured successfully`

**What this does:**
- Creates trigger to auto-assign START plan to new users
- Assigns START plan to existing users without subscription
- Creates `has_feature_access()` helper function for feature checks
- Gives 7-day trial to all new users

---

## Step 2: Frontend Feature Restriction

The START plan includes only these features:
- ✅ Dashboard (AI Center)
- ✅ Customer Management (Customer 360)
- ✅ Advanced POS (Sales Hub)
- ✅ My Workplace (COPCCA Apps)

### 2.1 Check User's Subscription in Frontend

Create a new hook `src/hooks/useSubscription.ts`:

```typescript
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export interface UserSubscription {
  planName: string;
  features: string[];
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  trialEndDate: string | null;
}

export const useSubscription = () => {
  const  [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select(`
            status,
            trial_end_date,
            subscription_plans (
              name,
              features
            )
          `)
          .eq('user_id', user.id)
          .in('status', ['trial', 'active'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          setSubscription({
            planName: data.subscription_plans.name,
            features: data.subscription_plans.features,
            status: data.status,
            trialEndDate: data.trial_end_date,
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const hasFeatureAccess = (featureName: string): boolean => {
    if (!subscription) return false;
    if (subscription.features.includes('all_features')) return true;
    return subscription.features.includes(featureName);
  };

  const isPro = subscription?.planName === 'pro';
  const isGrow = subscription?.planName === 'grow';
  const isStart = subscription?.planName === 'start';

  return {
    subscription,
    loading,
    hasFeatureAccess,
    isPro,
    isGrow,
    isStart,
  };
};
```

### 2.2 Create Feature Gate Component

Create `src/components/FeatureGate.tsx`:

```typescript
import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureName,
  children,
  fallback,
}) => {
  const { hasFeatureAccess, loading, subscription } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hasFeatureAccess(featureName)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="max-w-2xl mx-auto mt-8 p-8 text-center">
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          This feature is available with a higher subscription plan. Upgrade your plan to unlock this functionality.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/app/settings?tab=billing')} variant="primary">
            Upgrade Plan
          </Button>
          <Button onClick={() => navigate('/app/settings?tab=billing')} variant="outline">
            View Plans
          </Button>
        </div>
        {subscription?.status === 'trial' && (
          <p className="mt-4 text-sm text-slate-500">
            You're currently on the <strong>{subscription.planName.toUpperCase()}</strong> plan trial.
          </p>
        )}
      </Card>
    );
  }

  return <>{children}</>;
};
```

### 2.3 Wrap Restricted Pages

Update restricted pages (e.g., `src/pages/AfterSalesAndTasksView.tsx`):

```typescript
import { FeatureGate } from '@/components/FeatureGate';

export const AfterSalesAndTasksView = () => {
  return (
    <FeatureGate featureName="after_sales">
      {/* Your existing page content */}
      <div>
        {/* ... existing code ... */}
      </div>
    </FeatureGate>
  );
};
```

Pages to wrap with `FeatureGate`:

| Page | Feature Name | START | GROW | PRO |
|------|--------------|-------|------|-----|
| Dashboard | `dashboard` | ✅ | ✅ | ✅ |
| Customer Management | `customers_basic` | ✅ | ✅ | ✅ |
| Sales Hub / POS | `pos_system` | ✅ | ✅ | ✅ |
| My Workplace | `my_workplace` | ✅ | ✅ | ✅ |
| After Sales & Tasks | `after_sales` | ❌ | ✅ | ✅ |
| Sales Pipeline | `sales_pipeline` | ❌ | ✅ | ✅ |
| KPI Dashboard | `kpi_dashboard` | ❌ | ✅ | ✅ |
| Debt Collection | `debt_collection` | ❌ | ✅ | ✅ |
| Admin Panel | `admin_panel` | ❌ | ✅ | ✅ |

---

## Step 3: Verify the Fix

### 3.1 Test Data Isolation

1. **Create Test Account 1:**
   - Sign up with email: `test1@example.com`
   - Create a customer: "Test Customer A"
   - Create a product: "Test Product A"
   - Create an order

2. **Create Test Account 2:**
   - Sign up with email: `test2@example.com`
   - Go to Customers page
   - **Expected:** Should see 0 customers (not Test Customer A)
   - Go to Products page
   - **Expected:** Should see 0 products (not Test Product A)
   - Go to Orders page
   - **Expected:** Should see 0 orders

3. **Verify:**
   - ✅ Each account only sees its own data
   - ✅ No cross-company data leakage

### 3.2 Test Subscription Restrictions

Using `test1@example.com` (START plan):

1. Go to **Dashboard** → ✅ Should work
2. Go to **Customer Management** → ✅ Should work
3. Go to **Sales Hub** → ✅ Should work
4. Go to **My Workplace** → ✅ Should work
5. Try to access **After Sales & Tasks** → ❌ Should show upgrade prompt
6. Try to access **Admin Panel** → ❌ Should show upgrade prompt

### 3.3 Verify Subscription Auto-Assignment

Check in Supabase:

```sql
SELECT 
  u.email,
  sp.name as plan_name,
  us.status,
  us.trial_end_date
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
ORDER BY u.created_at DESC;
```

**Expected:** All users have a subscription (no NULL values), most on 'start' plan.

---

## Step 4: Additional Improvements (Optional)

### 4.1 Add Subscription Badge to UI

Show user's current plan in the header/nav:

```typescript
const { subscription } = useSubscription();

// In your AppLayout or Header component
{subscription && (
  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
    {subscription.planName.toUpperCase()}
  </span>
)}
```

### 4.2 Show Trial Countdown

```typescript
const { subscription } = useSubscription();

{subscription?.status === 'trial' && subscription.trialEndDate && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
    <p>
      ⏳ Trial ends on {new Date(subscription.trialEndDate).toLocaleDateString()}
    </p>
  </div>
)}
```

---

## Common Issues & Solutions

### Issue 1: "Users still see other companies' data"

**Solution:**
- Re-run `database-fix-data-isolation.sql`
- Check if `company_id` column exists: 
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'sales_hub_customers';
  ```
- Verify RLS is enabled:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'sales_hub_customers';
  ```

### Issue 2: "New users don't have subscriptions"

**Solution:**
- Check if trigger exists:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'trigger_assign_start_plan';
  ```
- Re-run `database-auto-assign-subscription.sql`
- Manually assign subscription:
  ```sql
  INSERT INTO user_subscriptions (user_id, plan_id, status, billing_cycle, trial_start_date, trial_end_date)
  VALUES (
    'USER_ID_HERE',
    (SELECT id FROM subscription_plans WHERE name = 'start'),
    'trial',
    'monthly',
    NOW(),
    NOW() + INTERVAL '7 days'
  );
  ```

### Issue 3: "START plan users can still access restricted features"

**Solution:**
- Ensure you've created `useSubscription` hook
- Ensure you've wrapped pages with `<FeatureGate>`
- Check feature names match exactly (e.g., `after_sales` not `aftersales`)

---

## Security Checklist

Before going to production:

- [ ] Ran `database-fix-data-isolation.sql` successfully
- [ ] Ran `database-auto-assign-subscription.sql` successfully
- [ ] Verified RLS policies are active on all tables
- [ ] Tested data isolation with 2+ test accounts
- [ ] Wrapped all restricted pages with `FeatureGate`
- [ ] Tested subscription restrictions with START plan account
- [ ] Verified new signups automatically get START plan
- [ ] Checked that users can't see other companies' data in database queries

---

## Need Help?

If you encounter any issues:

1. Check Supabase logs for errors
2. Verify all migrations ran successfully
3. Test with fresh user accounts
4. Check browser console for frontend errors

All sensitive data should now be properly isolated per company! 🎉
