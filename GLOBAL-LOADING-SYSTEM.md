# Global Loading System & Auto-Logout Fix

## 🎯 Overview

This system provides:
1. **Persistent sessions** - No more automatic logouts
2. **Global loading indicator** - Small navbar indicator instead of page-level loading screens
3. **Instant updates** - Information updates across the system without page reloads

## ✅ What Was Fixed

### 1. Auto-Logout Issue
**Problem:** Users were being logged out automatically after inactivity.

**Solution:** Configured Supabase client with:
- `autoRefreshToken: true` - Automatically refreshes expired tokens
- `persistSession: true` - Persists session to localStorage
- Custom storage handler for reliable session persistence

**File:** [src/lib/supabase.ts](src/lib/supabase.ts)

### 2. Page Loading States
**Problem:** Full-page loading spinners blocked the UI and hid the navbar.

**Solution:** Created a global loading store that shows a small, elegant indicator in the navbar instead of blocking the entire page.

**Files:**
- [src/store/loadingStore.ts](src/store/loadingStore.ts) - Global loading state
- [src/components/layout/AppLayout.tsx](src/components/layout/AppLayout.tsx) - Navbar indicator

## 📖 How to Use the Loading System

### Method 1: Automatic Tracking with Hook

```typescript
import { useTrackLoading } from '@/store/loadingStore';

function MyComponent() {
  const trackLoading = useTrackLoading();

  const fetchCustomers = async () => {
    // This operation will automatically show the navbar loading indicator
    const customers = await trackLoading('fetch-customers', async () => {
      const { data } = await supabase.from('customers').select('*');
      return data;
    });
    
    setCustomers(customers);
  };

  return <button onClick={fetchCustomers}>Load Customers</button>;
}
```

### Method 2: Manual Control

```typescript
import { useLoadingStore } from '@/store/loadingStore';

function MyComponent() {
  const { startLoading, stopLoading } = useLoadingStore();

  const saveData = async () => {
    startLoading('save-customer');
    try {
      await supabase.from('customers').insert(newCustomer);
      toast.success('Customer saved!');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      stopLoading('save-customer');
  }
  };

  return <button onClick={saveData}>Save</button>;
}
```

### Method 3: Check Loading State

```typescript
import { useLoadingStore } from '@/store/loadingStore';

function MyComponent() {
  const isLoading = useLoadingStore((state) => state.isLoading);
  const isOperationLoading = useLoadingStore((state) => 
    state.isOperationLoading('fetch-customers')
  );

  return (
    <div>
      {isLoading && <span>Something is loading...</span>}
      {isOperationLoading && <span>Customers loading...</span>}
    </div>
  );
}
```

## 🎨 What Users See

**Before:**
- Full-page loading spinner
- Sidebar and navbar hidden
- No indication of what's loading
- Users logged out unexpectedly

**After:**
- Small "Updating..." indicator in navbar
- Sidebar and navbar always visible
- Users stay logged in
- Instant, smooth experience

## 💡 Best Practices

### DO ✅
```typescript
// Use for database operations
trackLoading('fetch-orders', async () => {
  return await supabase.from('orders').select('*');
});

// Use for form submissions
trackLoading('create-customer', async () => {
  return await supabase.from('customers').insert(data);
});

// Use for API calls
trackLoading('send-email', async () => {
  return await fetch('/api/send-email', { method: 'POST', body: data });
});
```

### DON'T ❌
```typescript
// Don't use for instant operations
trackLoading('button-click', () => {
  setIsOpen(!isOpen); // Too fast, no loading needed
});

// Don't use for synchronous operations
trackLoading('calculate-total', () => {
  return items.reduce((sum, item) => sum + item.price, 0);
});
```

## 🔧 Operation IDs

Use descriptive operation IDs to identify what's loading:

```typescript
// Good operation IDs
'fetch-customers'
'save-product'
'delete-order'
'update-profile'
'send-invoice'

// Bad operation IDs
'operation1'
'load'
'save'
'x'
```

## 🚀 Migration Guide

### Removing Old Loading States

**Before (Page-Level Loading):**
```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  const data = await supabase.from('customers').select('*');
  setCustomers(data);
  setLoading(false);
};

if (loading) return <LoadingSpinner />;

return <div>...</div>;
```

**After (Global Loading):**
```typescript
const trackLoading = useTrackLoading();

const fetchData = async () => {
  const data = await trackLoading('fetch-customers', async () => {
    return await supabase.from('customers').select('*');
  });
  setCustomers(data);
};

// No loading check - render immediately!
return <div>...</div>;
```

## 📊 Benefits

1. **Better UX** - Users always see the navbar and can navigate
2. **Less code** - No more loading states in every component
3. **Centralized** - All loading logic in one placeExamples:
4. **Persistent sessions** - Users stay logged in
5. **Instant feedback** - Small indicator shows system is working

## 🐛 Troubleshooting

### Users still getting logged out
Check browser localStorage is enabled:
```javascript
console.log('LocalStorage enabled:', typeof localStorage !== 'undefined');
```

### Loading indicator not showing
Verify you're using the loading system:
```typescript
import { useLoadingStore } from '@/store/loadingStore';
console.log('Is loading:', useLoadingStore.getState().isLoading);
```

### Loading doesn't stop
Make sure to call `stopLoading()` in finally block:
```typescript
startLoading('my-operation');
try {
  await somethingThatMightFail();
} finally {
  stopLoading('my-operation'); // Always called
}
```

## 📝 Examples

### Example 1: Fetching Data
```typescript
import { useTrackLoading } from '@/store/loadingStore';

function CustomerList() {
  const trackLoading = useTrackLoading();
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    trackLoading('fetch-customers', async () => {
      const { data } = await supabase.from('customers').select('*');
      setCustomers(data || []);
    });
  }, []);

  return (
    <div>
      {customers.map(customer => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
}
```

### Example 2: Form Submission
```typescript
import { useTrackLoading } from '@/store/loadingStore';
import { toast } from 'sonner';

function CreateCustomerForm() {
  const trackLoading = useTrackLoading();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await trackLoading('create-customer', async () => {
      const { error } = await supabase
        .from('customers')
        .insert(formData);
      
      if (error) throw error;
      
      toast.success('Customer created!');
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Example 3: Delete Operation
```typescript
import { useLoadingStore } from '@/store/loadingStore';

function CustomerCard({ customer }) {
  const { startLoading, stopLoading } = useLoadingStore();

  const handleDelete = async () => {
    if (!confirm('Delete customer?')) return;
    
    startLoading(`delete-customer-${customer.id}`);
    try {
      await supabase.from('customers').delete().eq('id', customer.id);
      toast.success('Deleted!');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      stopLoading(`delete-customer-${customer.id}`);
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

## 🎯 Next Steps

1. **Update existing pages** - Replace page-level loading with global loading
2. **Remove loading spinners** - Delete `if (loading) return <Spinner />` patterns
3. **Add operation tracking** - Wrap async operations with `trackLoading()`
4. **Test session persistence** - Verify users stay logged in

---

**Need help?** Check the implementation files:
- [src/store/loadingStore.ts](src/store/loadingStore.ts)
- [src/components/layout/AppLayout.tsx](src/components/layout/AppLayout.tsx)
- [src/lib/supabase.ts](src/lib/supabase.ts)
