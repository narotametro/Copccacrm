/**
 * COPCCA CRM 2026 - Centralized Route Configuration
 * Modern route definitions with type safety
 */

export const ROUTES_2026 = {
  // Main Pages
  dashboard: {
    path: '/',
    title: 'Dashboard',
  },
  customers: {
    path: '/customers',
    title: 'Customers',
  },
  customerDetail: {
    path: '/customers/:id',
    title: 'Customer Details',
  },
  pipeline: {
    path: '/pipeline',
    title: 'Sales Pipeline',
  },
  marketing: {
    path: '/marketing',
    title: 'Marketing',
  },
  kpis: {
    path: '/kpis',
    title: 'KPI Dashboard',
  },
  debtCollection: {
    path: '/debt',
    title: 'Debt Collection',
  },
  competitors: {
    path: '/competitors',
    title: 'Competitor Intelligence',
  },
  products: {
    path: '/products',
    title: 'Product Analytics',
  },
  reports: {
    path: '/reports',
    title: 'Reports',
  },
  admin: {
    path: '/admin',
    title: 'Admin Dashboard',
  },
  
  // Auth
  login: {
    path: '/login',
    title: 'Login',
  },
  signup: {
    path: '/signup',
    title: 'Sign Up',
  },
  
  // Settings
  settings: {
    path: '/settings',
    title: 'Settings',
  },
  profile: {
    path: '/profile',
    title: 'Profile',
  },
} as const;

// Type helper for route paths
export type RoutePath = typeof ROUTES_2026[keyof typeof ROUTES_2026]['path'];

// Navigation helper
export const navigate = (route: keyof typeof ROUTES_2026) => {
  window.location.hash = ROUTES_2026[route].path;
};
