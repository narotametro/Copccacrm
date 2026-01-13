/**
 * Application-wide constants
 * Centralized configuration values for consistency across the app
 */

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Status Values
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const;

export type Status = typeof STATUS[keyof typeof STATUS];

// Deal Stages
export const DEAL_STAGES = {
  LEAD: 'lead',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
} as const;

export type DealStage = typeof DEAL_STAGES[keyof typeof DEAL_STAGES];

// Priority Levels
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

// Task Types
export const TASK_TYPE = {
  CALL: 'call',
  EMAIL: 'email',
  MEETING: 'meeting',
  FOLLOW_UP: 'follow_up',
  OTHER: 'other',
} as const;

export type TaskType = typeof TASK_TYPE[keyof typeof TASK_TYPE];

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  PHONE_REGEX: /^[\d\s+()-]+$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL_REGEX: /^https?:\/\/.+/,
} as const;

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd',
  MEDIUM: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  TIME: 'hh:mm a',
  DATETIME: 'MMM dd, yyyy hh:mm a',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'copcca_theme',
  CURRENCY: 'copcca_currency',
  LANGUAGE: 'copcca_language',
  SIDEBAR_COLLAPSED: 'copcca_sidebar_collapsed',
} as const;

// API Endpoints (for future backend integration)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    RESET_PASSWORD: '/auth/reset-password',
  },
  CUSTOMERS: '/customers',
  DEALS: '/deals',
  PRODUCTS: '/products',
  TASKS: '/tasks',
  REPORTS: '/reports',
} as const;

// Toast Messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    SAVE: 'Changes saved successfully',
    CREATE: 'Created successfully',
    UPDATE: 'Updated successfully',
    DELETE: 'Deleted successfully',
  },
  ERROR: {
    SAVE: 'Failed to save changes',
    CREATE: 'Failed to create',
    UPDATE: 'Failed to update',
    DELETE: 'Failed to delete',
    NETWORK: 'Network error. Please try again',
    UNAUTHORIZED: 'You are not authorized to perform this action',
  },
  WARNING: {
    UNSAVED_CHANGES: 'You have unsaved changes',
    CONFIRM_DELETE: 'Are you sure you want to delete this?',
  },
} as const;

// Feature Flags (for gradual feature rollout)
export const FEATURES = {
  AI_INSIGHTS: true,
  CURRENCY_CONVERSION: true,
  TWO_FACTOR_AUTH: false,
  DARK_MODE: false,
  REALTIME_UPDATES: false,
} as const;
