/**
 * Application Routes Configuration
 * Centralized routing definitions for hash-based navigation
 */

export type TabId = 'home' | 'aftersales' | 'competitors' | 'debt' | 'strategies' | 'kpi' | 'integrations' | 'users' | 'reports' | 'analytical';

export interface RouteConfig {
  id: TabId;
  path: string;
  title: string;
  component: string;
  adminOnly?: boolean;
}

/**
 * Main application routes
 */
export const ROUTES: Record<TabId, RouteConfig> = {
  home: {
    id: 'home',
    path: '#/home',
    title: 'Dashboard',
    component: 'Home',
  },
  aftersales: {
    id: 'aftersales',
    path: '#/after-sales',
    title: 'After-Sales Follow-up',
    component: 'AfterSalesTracker',
  },
  competitors: {
    id: 'competitors',
    path: '#/competitors',
    title: 'Competitors Information',
    component: 'CompetitorIntelEnhanced',
  },
  debt: {
    id: 'debt',
    path: '#/debt',
    title: 'Debt Collection',
    component: 'DebtCollection',
  },
  strategies: {
    id: 'strategies',
    path: '#/strategies',
    title: 'Sales & Marketing Strategies',
    component: 'SalesStrategies',
  },
  kpi: {
    id: 'kpi',
    path: '#/kpi',
    title: 'KPI Tracking',
    component: 'KPITracking',
  },
  integrations: {
    id: 'integrations',
    path: '#/integrations',
    title: 'Data Integrations',
    component: 'Integrations',
  },
  users: {
    id: 'users',
    path: '#/users',
    title: 'User Management',
    component: 'UserManagement',
    adminOnly: true,
  },
  reports: {
    id: 'reports',
    path: '#/reports',
    title: 'Reports',
    component: 'Reports',
  },
  analytical: {
    id: 'analytical',
    path: '#/analytical',
    title: 'Analytical Reports',
    component: 'AnalyticalReports',
  },
};

/**
 * Hash to Tab ID mapping for URL navigation
 */
export const HASH_TO_TAB: Record<string, TabId> = {
  '#/home': 'home',
  '#/after-sales': 'aftersales',
  '#/aftersales': 'aftersales',
  '#/competitors': 'competitors',
  '#/debt': 'debt',
  '#/strategies': 'strategies',
  '#/kpi': 'kpi',
  '#/integrations': 'integrations',
  '#/settings': 'integrations',
  '#/user-management': 'users',
  '#/users': 'users',
  '#/reports': 'reports',
  '#/analytical': 'analytical',
  '#/analytical-reports': 'analytical',
};

/**
 * Get route by tab ID
 */
export function getRouteById(id: TabId): RouteConfig | undefined {
  return ROUTES[id];
}

/**
 * Get tab ID from hash
 */
export function getTabFromHash(hash: string): TabId {
  return HASH_TO_TAB[hash] || 'home';
}

/**
 * Get all routes
 */
export function getAllRoutes(): RouteConfig[] {
  return Object.values(ROUTES);
}

/**
 * Get routes filtered by admin permission
 */
export function getRoutesByPermission(isAdmin: boolean): RouteConfig[] {
  return getAllRoutes().filter(route => !route.adminOnly || isAdmin);
}
