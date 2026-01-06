# COPCCA CRM - Developer Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 **File Locations**

| What you need | Where to find it |
|---------------|-----------------|
| **Main app entry** | `src/App.tsx` |
| **Route configuration** | `src/config/routes.ts` |
| **Authentication** | `src/lib/auth-context.tsx` |
| **API services** | `src/lib/api.ts` |
| **Database client** | `src/lib/supabase-client.ts` |
| **Environment config** | `.env.example` (copy to `.env.local`) |
| **Documentation** | `docs/` folder |

## 🎨 **Component Structure**

```typescript
// Layout components (navigation, headers)
import { Sidebar, UserProfile } from '@/components/layout';

// Feature modules (main pages)
import { Home, AfterSalesTracker, DebtCollection } from '@/components/modules';

// Modal dialogs
import { DebtEditModal, ScheduleFollowUpModal } from '@/components/modals';

// Reports & analytics
import { AnalyticalReports, Reports } from '@/components/reports';

// Settings & admin
import { UserManagement, Integrations } from '@/components/settings';

// Shared utilities
import { AnimatedButton, EmptyState } from '@/components/shared';

// Base UI components
import { Button, Dialog, Input } from '@/components/ui';
```

## 🔧 **Library Utilities**

```typescript
// Contexts
import { useAuth, useCurrency, useLoading } from '@/lib';

// Data hooks
import { useAfterSales, useDebtCollection, useTeamData } from '@/lib';

// Utilities
import { formatNumberWithCommas, formatName } from '@/lib';

// Services
import { supabase } from '@/lib';
```

## 🗺️ **Routing**

```typescript
import { ROUTES, getTabFromHash } from '@/config/routes';

// Available routes
ROUTES.home          // Dashboard
ROUTES.aftersales    // After-Sales Follow-up
ROUTES.competitors   // Competitor Intelligence
ROUTES.debt          // Debt Collection
ROUTES.strategies    // Sales Strategies
ROUTES.kpi           // KPI Tracking
ROUTES.integrations  // Data Integrations
ROUTES.users         // User Management (admin only)
ROUTES.reports       // Reports
ROUTES.analytical    // Analytical Reports

// Get current route from URL
const currentTab = getTabFromHash(window.location.hash);
```

## 🎯 **Common Tasks**

### Adding a New Component
1. Create in appropriate folder (`layout`, `modules`, `modals`, etc.)
2. Add export to folder's `index.ts`
3. Import using barrel export: `from '@/components/modules'`

### Adding a New Route
1. Update `src/config/routes.ts`:
   - Add to `TabId` type
   - Add to `ROUTES` object
   - Add hash mapping to `HASH_TO_TAB`
2. Update `src/App.tsx`:
   - Add lazy import
   - Add to `ContentRenderer` components

### Adding a New API Endpoint
1. Add function to `src/lib/api.ts`
2. Export from `src/lib/index.ts`
3. Use in component: `import { yourAPI } from '@/lib'`

### Creating a Custom Hook
1. Create in `src/lib/` (e.g., `useYourHook.ts`)
2. Export from `src/lib/index.ts`
3. Use: `import { useYourHook } from '@/lib'`

## 📦 **Key Dependencies**

| Package | Purpose |
|---------|---------|
| **React 18.3** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Supabase** | Backend (auth + database) |
| **Tailwind CSS** | Styling |
| **Radix UI** | Accessible components |
| **Recharts** | Data visualization |
| **Sonner** | Toast notifications |
| **Lucide React** | Icons |

## 🔐 **Environment Variables**

Copy `.env.example` to `.env.local` and configure:

```bash
# Required
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional
VITE_ENABLE_PWA=true
VITE_ENABLE_DEBUG_PANEL=false
```

## 🎨 **Styling Guide**

### Tailwind Classes
```typescript
// Common patterns
<div className="flex items-center gap-4">     // Flex layout
<div className="bg-white rounded-lg p-6">     // Card
<div className="text-gray-600 text-sm">       // Text
<Button className="bg-pink-600 hover:bg-pink-700"> // Button
```

### Responsive Design
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  // Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns
</div>
```

## 🧪 **Testing Locally**

```bash
# Test production build locally
npm run build
npm run preview

# Check for TypeScript errors
npx tsc --noEmit

# Check bundle size
npm run build -- --analyze
```

## 📚 **Documentation**

| Topic | File |
|-------|------|
| **Getting Started** | `docs/START_HERE.md` |
| **Architecture** | `docs/ARCHITECTURE.md` |
| **API Reference** | `docs/API_DOCUMENTATION.md` |
| **Deployment** | `docs/DEPLOYMENT_GUIDE.md` |
| **Troubleshooting** | `docs/TROUBLESHOOTING.md` |
| **Component Guide** | `src/components/README.md` |

## 🐛 **Debugging**

### Enable Debug Panel
```typescript
// Add to URL
?debug=true

// Or set environment variable
VITE_ENABLE_DEBUG_PANEL=true
```

### Check Browser Console
- Look for Supabase connection errors
- Check for auth errors
- Monitor API request failures

### Common Issues
1. **Build fails**: Check TypeScript errors with `npx tsc --noEmit`
2. **Auth not working**: Verify Supabase credentials in `.env.local`
3. **Components not loading**: Check import paths match new structure
4. **Routes not working**: Verify hash routing in `config/routes.ts`

## 🚢 **Deployment**

```bash
# Build for production
npm run build

# Deploy to your platform
# - DigitalOcean: See docs/DIGITALOCEAN_SUPABASE_CONNECTION.md
# - Azure: See docs/DEPLOYMENT_GUIDE.md
# - Other: Check docs/DEPLOYMENT_CHEATSHEET.md
```

## 💡 **Tips**

- Use TypeScript for better IntelliSense
- Import from barrel exports (`@/lib`, `@/components/modules`)
- Check docs/ folder before asking questions
- Follow existing component patterns
- Test on mobile devices (responsive design)
- Use React DevTools for debugging

## 🔗 **Useful Commands**

```bash
# Find all TODO comments
grep -r "TODO" src/

# Count lines of code
npx cloc src/

# Check for unused dependencies
npx depcheck

# Update dependencies
npm update
```

---

**Happy coding! 🎉**

For detailed information, check the `docs/` folder or component-specific README files.
