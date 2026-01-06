# Configuration Directory

Application configuration files for COPCCA CRM.

## Files

### `routes.ts`
Centralized routing configuration for the application.

**Features:**
- Route definitions with metadata
- Hash-based navigation mapping
- Type-safe route IDs
- Admin permission filtering

**Usage:**
```typescript
import { ROUTES, getTabFromHash, getRoutesByPermission } from '@/config/routes';

// Get route by ID
const homeRoute = ROUTES.home;

// Parse hash to tab ID
const tabId = getTabFromHash(window.location.hash);

// Get routes for current user
const userRoutes = getRoutesByPermission(isAdmin);
```

**Route Structure:**
```typescript
{
  id: 'home',
  path: '#/home',
  title: 'Dashboard',
  component: 'Home',
  adminOnly: false
}
```

## Adding New Routes

1. Add route ID to `TabId` type
2. Add route config to `ROUTES` object
3. Add hash mappings to `HASH_TO_TAB`
4. Update App.tsx to handle the new route

Example:
```typescript
// In routes.ts
export type TabId = 'home' | 'aftersales' | 'newfeature';

export const ROUTES: Record<TabId, RouteConfig> = {
  // ... existing routes
  newfeature: {
    id: 'newfeature',
    path: '#/new-feature',
    title: 'New Feature',
    component: 'NewFeature',
  },
};

export const HASH_TO_TAB: Record<string, TabId> = {
  // ... existing mappings
  '#/new-feature': 'newfeature',
};
```

## Best Practices

1. Keep route IDs consistent across the app
2. Use descriptive titles for navigation
3. Mark admin-only routes with `adminOnly: true`
4. Maintain hash mappings for deep linking
5. Document new routes in this README
