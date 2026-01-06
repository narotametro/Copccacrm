# 🚀 COPCCA CRM 2026 - Developer Quick Start

## 📋 Table of Contents
1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Working with Pages](#working-with-pages)
4. [Working with Services](#working-with-services)
5. [Creating Components](#creating-components)
6. [Styling Guide](#styling-guide)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Git
- VS Code (recommended)
- Supabase account

### Installation
```bash
# Clone repository
git clone <repo-url>
cd Copccacrm

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### First Run
1. Open http://localhost:5173
2. Check browser console for errors
3. Verify Supabase connection
4. Navigate to Dashboard

---

## 📁 Project Structure

```
src/
├── pages/              # Main application pages
├── components/         # Reusable UI components
│   ├── dashboard/     # Dashboard-specific
│   ├── pipeline/      # Pipeline components
│   ├── shared/        # Shared across app
│   ├── layout/        # Layout components
│   └── ...
├── services/          # API service layer
├── context/           # React context providers
├── hooks/             # Custom React hooks
├── lib/               # Core utilities
├── config/            # Configuration files
└── assets/            # Static assets
```

---

## 📄 Working with Pages

### Creating a New Page

**Step 1:** Create the page file
```typescript
// src/pages/MyNewPage.tsx
import React from 'react';

export const MyNewPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-900">My New Page</h1>
      {/* Your content here */}
    </div>
  );
};
```

**Step 2:** Add to barrel export
```typescript
// src/pages/index.ts
export { MyNewPage } from './MyNewPage';
```

**Step 3:** Add route
```typescript
// src/config/routes2026.ts
myNewPage: {
  path: '/my-page',
  title: 'My Page',
},
```

**Step 4:** Add to App routing
```typescript
// src/App.tsx
import { MyNewPage } from '@/pages';

// In your router
<Route path="/my-page" element={<MyNewPage />} />
```

### Page Structure Template
```typescript
import React, { useState, useEffect } from 'react';
import { Icon1, Icon2 } from 'lucide-react';
import { myAPI } from '@/services';

export const MyPage: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await myAPI.getAll();
      setData(result);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
        <p className="text-gray-500 mt-1">Description</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Your content */}
        </div>
      )}
    </div>
  );
};
```

---

## 🔌 Working with Services

### Creating a New Service

```typescript
// src/services/myAPI.ts
import { supabase } from '@/lib/supabase-client';

export const myAPI = {
  // Get all items
  getAll: async () => {
    const { data, error } = await supabase
      .from('my_table')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get single item
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('my_table')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create item
  create: async (item: any) => {
    const { data, error } = await supabase
      .from('my_table')
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update item
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('my_table')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete item
  delete: async (id: string) => {
    const { error } = await supabase
      .from('my_table')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};
```

### Using Services in Components

```typescript
import { useEffect, useState } from 'react';
import { customerAPI } from '@/services';

function MyComponent() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customerAPI.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreate = async (newCustomer) => {
    try {
      const created = await customerAPI.create(newCustomer);
      setCustomers([...customers, created]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ...
}
```

---

## 🧩 Creating Components

### Component Template

```typescript
// src/components/shared/MyComponent.tsx
import React from 'react';
import { Icon } from 'lucide-react';

interface MyComponentProps {
  title: string;
  value: number;
  onClick?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  value,
  onClick,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {onClick && (
          <button
            onClick={onClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
};
```

### Component Best Practices

1. **Always use TypeScript interfaces for props**
```typescript
interface Props {
  required: string;
  optional?: number;
  callback?: () => void;
}
```

2. **Use proper prop destructuring**
```typescript
export const Component: React.FC<Props> = ({
  required,
  optional = 0,
  callback,
}) => {
  // ...
};
```

3. **Add barrel exports**
```typescript
// src/components/shared/index.ts
export { MyComponent } from './MyComponent';
```

4. **Use memo for expensive components**
```typescript
export const ExpensiveComponent = React.memo<Props>(({ data }) => {
  // Complex rendering logic
});
```

---

## 🎨 Styling Guide

### Tailwind Utilities

#### Layout
```tsx
<div className="flex items-center justify-between">
<div className="grid grid-cols-3 gap-4">
<div className="space-y-4">
```

#### Spacing
```tsx
<div className="p-6">        {/* padding all sides */}
<div className="px-4 py-2">  {/* padding x and y */}
<div className="mt-4 mb-6">  {/* margin top/bottom */}
```

#### Colors
```tsx
<div className="bg-blue-600 text-white">
<div className="border border-gray-200">
<p className="text-gray-500">
```

#### Borders & Shadows
```tsx
<div className="rounded-lg shadow-sm border border-gray-200">
<div className="rounded-xl shadow-md">
```

#### Transitions
```tsx
<button className="transition-colors hover:bg-blue-700">
<div className="transition-all duration-300 ease-in-out">
```

### Color Palette

```typescript
// Primary
blue-600   // Main action color
blue-50    // Background highlights

// Status
green-600  // Success, positive metrics
red-600    // Error, warnings
orange-600 // Warnings, pending
purple-600 // Premium, AI features

// Neutrals
gray-900   // Primary text
gray-600   // Secondary text
gray-400   // Disabled text
gray-200   // Borders
gray-50    // Background
```

### Component Patterns

#### Card Component
```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  {/* Content */}
</div>
```

#### Button Primary
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Click Me
</button>
```

#### Button Secondary
```tsx
<button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
  Cancel
</button>
```

#### Input Field
```tsx
<input
  type="text"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Enter text..."
/>
```

---

## 🔧 Common Patterns

### Loading State
```typescript
{loading ? (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
) : (
  <div>{/* Content */}</div>
)}
```

### Empty State
```typescript
{items.length === 0 && (
  <div className="text-center py-12">
    <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
    <p className="text-gray-500 mb-4">Get started by creating your first item</p>
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
      Create Item
    </button>
  </div>
)}
```

### Error Handling
```typescript
const [error, setError] = useState<string | null>(null);

try {
  const data = await api.getData();
} catch (err) {
  setError('Failed to load data. Please try again.');
  console.error(err);
}

// In render
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-600">{error}</p>
  </div>
)}
```

### Pagination
```typescript
const [page, setPage] = useState(1);
const itemsPerPage = 20;

const paginatedItems = items.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);

<div className="flex items-center justify-between mt-4">
  <button
    onClick={() => setPage(p => Math.max(1, p - 1))}
    disabled={page === 1}
    className="px-4 py-2 border rounded-lg disabled:opacity-50"
  >
    Previous
  </button>
  <span className="text-sm text-gray-600">
    Page {page} of {Math.ceil(items.length / itemsPerPage)}
  </span>
  <button
    onClick={() => setPage(p => p + 1)}
    disabled={page >= Math.ceil(items.length / itemsPerPage)}
    className="px-4 py-2 border rounded-lg disabled:opacity-50"
  >
    Next
  </button>
</div>
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Import errors
```bash
# Error: Cannot find module '@/components/MyComponent'

# Solution: Check tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 2. Supabase connection fails
```bash
# Error: Invalid API key

# Solution: Check .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### 3. Build fails
```bash
# Error: Module not found

# Solution: Clear cache and reinstall
rm -rf node_modules
npm install
npm run dev
```

#### 4. TypeScript errors
```bash
# Error: Type 'X' is not assignable to type 'Y'

# Solution: Check interface definitions
# Use proper types, avoid 'any' when possible
```

### Debugging Tips

1. **Use React DevTools**
   - Install browser extension
   - Inspect component props and state
   - Profile performance

2. **Check Network Tab**
   - Monitor API calls
   - Check request/response data
   - Look for failed requests

3. **Console Logging**
```typescript
console.log('Data:', data);
console.error('Error:', error);
console.table(items); // For arrays/objects
```

4. **TypeScript Errors**
```bash
# Check types
npm run type-check

# Fix auto-fixable issues
npm run lint -- --fix
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Lucide Icons](https://lucide.dev)
- [Recharts Documentation](https://recharts.org)

---

## 🎯 Next Steps

1. **Explore existing pages** - Look at Dashboard, Customers, Pipeline
2. **Create a simple page** - Practice with a basic list/detail view
3. **Build a component** - Create a reusable UI element
4. **Add a service** - Implement API integration
5. **Contribute!** - Submit your work for review

---

**Happy coding! 🚀**

*For questions, reach out to the development team or check the full documentation in /docs*
