/**
 * Application Constants
 * 
 * Centralized configuration and constant values used throughout the application.
 * 
 * @module constants
 */

// ============================================================================
// APPLICATION INFO
// ============================================================================

export const APP_NAME = 'COPCCA CRM';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'AI-powered CRM for customer follow-up, debt collection, and business management';

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'pocket_crm_auth_token',
  USER_DATA: 'pocket_crm_user',
  CURRENCY: 'pocket_crm_currency',
  THEME: 'pocket_crm_theme',
  COMPANY_BRANDING: 'pocket_crm_company',
  SELECTED_USER: 'pocket_crm_selected_user',
  LAST_SYNC: 'pocket_crm_last_sync',
} as const;

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// ============================================================================
// DATE FORMATS
// ============================================================================

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm',
  FULL: 'EEEE, MMMM dd, yyyy',
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PHONE_MIN_LENGTH: 5,
  PHONE_MAX_LENGTH: 15,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  COMPANY_NAME_MAX_LENGTH: 200,
  NOTES_MAX_LENGTH: 5000,
} as const;

// ============================================================================
// PERFORMANCE
// ============================================================================

export const PERFORMANCE = {
  DEBOUNCE_DELAY: 300, // milliseconds
  SEARCH_MIN_CHARS: 2,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  AUTO_SAVE_DELAY: 2000, // 2 seconds
} as const;

// ============================================================================
// STATUS OPTIONS
// ============================================================================

export const STATUS_OPTIONS = [
  { value: 'excellent', label: 'Excellent', color: 'bg-green-100 text-green-800' },
  { value: 'good', label: 'Good', color: 'bg-blue-100 text-blue-800' },
  { value: 'needs-attention', label: 'Needs Attention', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'on-track', label: 'On Track', color: 'bg-blue-100 text-blue-800' },
  { value: 'at-risk', label: 'At Risk', color: 'bg-red-100 text-red-800' },
] as const;

export const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
] as const;

export const THREAT_LEVEL_OPTIONS = [
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
] as const;

// ============================================================================
// MODULES
// ============================================================================

export const MODULES = {
  HOME: 'home',
  AFTERSALES: 'aftersales',
  COMPETITORS: 'competitors',
  DEBT: 'debt',
  STRATEGIES: 'strategies',
  KPI: 'kpi',
  INTEGRATIONS: 'integrations',
  USERS: 'users',
  REPORTS: 'reports',
  ANALYTICAL: 'analytical',
} as const;

export const MODULE_LABELS = {
  [MODULES.HOME]: 'Dashboard',
  [MODULES.AFTERSALES]: 'After-Sales Follow-up',
  [MODULES.COMPETITORS]: 'Competitors Information',
  [MODULES.DEBT]: 'Debt Collection',
  [MODULES.STRATEGIES]: 'Sales & Marketing Strategies',
  [MODULES.KPI]: 'KPI Tracking',
  [MODULES.INTEGRATIONS]: 'Data Integrations',
  [MODULES.USERS]: 'User Management',
  [MODULES.REPORTS]: 'Reports',
  [MODULES.ANALYTICAL]: 'Analytical Reports',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  SAVED: 'Successfully saved!',
  UPDATED: 'Successfully updated!',
  DELETED: 'Successfully deleted!',
  CREATED: 'Successfully created!',
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  PASSWORD_RESET: 'Password reset email sent!',
} as const;

// ============================================================================
// ANIMATION DURATIONS (milliseconds)
// ============================================================================

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// ============================================================================
// BREAKPOINTS (for responsive design)
// ============================================================================

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// ============================================================================
// COLORS (matching Tailwind theme)
// ============================================================================

export const COLORS = {
  PRIMARY: '#ec4899', // pink-500
  SECONDARY: '#6b7280', // gray-500
  SUCCESS: '#10b981', // green-500
  WARNING: '#f59e0b', // amber-500
  ERROR: '#ef4444', // red-500
  INFO: '#3b82f6', // blue-500
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  ENABLE_PWA: true,
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_AUTO_SAVE: true,
  ENABLE_DARK_MODE: false, // Future feature
} as const;

// ============================================================================
// ROUTES
// ============================================================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
} as const;