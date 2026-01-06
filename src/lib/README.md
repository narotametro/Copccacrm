# Library Directory

Core utilities, hooks, context providers, and services for COPCCA CRM.

## Directory Contents

### 🔐 Context Providers
- `auth-context.tsx` - Authentication state and user management
- `currency-context.tsx` - Multi-currency support and conversion
- `loading-context.tsx` - Global loading state management

### 🎣 Custom Hooks
- `use-data.ts` - Data fetching hooks (useAfterSales, useDebtCollection, etc.)
- `useTeamData.tsx` - Team-wide data aggregation
- `useNotifications.ts` - Notification system hooks
- `useDebtReminders.ts` - Automated debt reminder management
- `useDebounce.ts` - Input debouncing utility

### 🌐 API Services
- `api.ts` - API client and service layer
- `supabase-client.ts` - Supabase database client configuration

### 🛠️ Utilities
- `utils.ts` - General utility functions (formatting, validation)
- `types.ts` - TypeScript type definitions
- `constants.ts` - Application constants
- `country-codes.ts` - Country code mappings
- `whatsapp-utils.ts` - WhatsApp integration utilities
- `toast-helper.ts` - Toast notification helpers
- `logger.ts` - Logging utilities
- `performance.ts` - Performance monitoring
- `request-cache.ts` - Request caching layer

### 📄 Specialized Services
- `report-generator.ts` - Report generation and export
- `collaboration.ts` - Team collaboration utilities

## Usage

Import using barrel exports:

```typescript
// Import context providers
import { useAuth, useCurrency, useLoading } from '@/lib';

// Import hooks
import { useAfterSales, useTeamData, useNotifications } from '@/lib';

// Import utilities
import { formatNumberWithCommas, formatName } from '@/lib';

// Import services
import { supabase } from '@/lib';
```

## Key Features

### Authentication Context
```typescript
const { user, isAdmin, loading, signIn, signOut } = useAuth();
```

### Currency Support
```typescript
const { currency, setCurrency, formatAmount } = useCurrency();
```

### Data Hooks
```typescript
const { data, loading, error, refresh } = useAfterSales();
```

### Team Data Aggregation
```typescript
const {
  afterSalesData,
  kpiData,
  competitorsData,
  debtData
} = useTeamData({ realtime: true });
```

## Best Practices

1. **Use hooks at component level** - Don't call hooks conditionally
2. **Leverage context** - Avoid prop drilling with context providers
3. **Cache wisely** - Use request-cache for expensive operations
4. **Type safety** - Import types from `types.ts`
5. **Error handling** - Always handle loading and error states
6. **Performance** - Use debouncing for user input

## Architecture

```
lib/
├── contexts/        (React Context API providers)
├── hooks/           (Custom React hooks)
├── services/        (API and business logic)
└── utils/           (Pure utility functions)
```

All modules are exported through `index.ts` for clean imports.
