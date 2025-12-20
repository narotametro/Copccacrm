/**
 * Type Definitions for COPCCA CRM
 * 
 * This file contains all TypeScript interfaces, types, and enums used throughout the application.
 */

import { LucideIcon } from 'lucide-react';

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Priority levels for tasks, activities, and follow-ups
 */
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Status types used across various modules
 */
export type StatusType = 
  | 'excellent' 
  | 'good' 
  | 'needs-attention' 
  | 'active' 
  | 'recommended' 
  | 'planned' 
  | 'on-track' 
  | 'exceeding' 
  | 'at-risk';

/**
 * Threat assessment levels
 */
export type ThreatLevel = 'high' | 'medium' | 'low';

/**
 * Direction of trends in analytics
 */
export type TrendDirection = 'up' | 'down';

/**
 * User roles for access control
 */
export type UserRole = 'admin' | 'member';

// ============================================================================
// STAT CARD
// ============================================================================

/**
 * Performance breakdown for stat cards
 */
export interface PerformanceBreakdown {
  star: number;
  excellent: number;
  good: number;
  average: number;
  needsAttention: number;
}

/**
 * Data structure for dashboard stat cards
 */
export interface StatCardData {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
  breakdown?: PerformanceBreakdown;
  analysis?: string;
}

// ============================================================================
// ACTIVITY & NOTIFICATIONS
// ============================================================================

/**
 * Activity log entry
 */
export interface Activity {
  id: number;
  time: string;
  category: string;
  action: string;
  details: string;
  priority: PriorityLevel;
}

/**
 * System notification
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: PriorityLevel;
  module: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// ============================================================================
// REPORTS
// ============================================================================

/**
 * Types of reports that can be generated
 */
export type ReportType = 'quick' | 'full';

/**
 * Report processing status
 */
export type ReportStatus = 'processing' | 'processed' | 'failed';

/**
 * Module-specific insights in reports
 */
export interface ReportInsight {
  module: 'aftersales' | 'kpi' | 'competitors' | 'sales' | 'marketing' | 'debt';
  insights: string[];
}

/**
 * Complete report data structure
 */
export interface Report {
  id: string;
  type: ReportType;
  title: string;
  content: string;
  status: ReportStatus;
  fileName?: string;
  fileSize?: number;
  insights?: ReportInsight[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Input structure for creating new reports
 */
export interface CreateReportInput {
  type: ReportType;
  title: string;
  content: string;
  fileName?: string;
  fileSize?: number;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * User authentication and profile data
 */
export interface User {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
  role: UserRole;
  companyName?: string;
  companyLogo?: string;
  createdAt: string;
  lastLogin?: string;
}

/**
 * Authentication context state
 */
export interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  phone: string;
  countryCode: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegistrationData extends LoginCredentials {
  name: string;
  confirmPassword: string;
  inviteCode?: string;
}

// ============================================================================
// CURRENCY
// ============================================================================

/**
 * Currency information
 */
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
}

/**
 * Currency context state
 */
export interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number) => string;
}

// ============================================================================
// DATA MODELS
// ============================================================================

/**
 * After-sales follow-up record
 */
export interface AfterSalesRecord {
  id: string;
  customerName: string;
  productService: string;
  purchaseDate: string;
  lastContact: string;
  nextFollowUp: string;
  status: StatusType;
  notes: string;
  satisfactionScore?: number;
  issuesResolved?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * KPI tracking record
 */
export interface KPIRecord {
  id: string;
  kpiName: string;
  target: number;
  actual: number;
  unit: string;
  period: string;
  status: StatusType;
  notes: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Competitor intelligence record
 */
export interface CompetitorRecord {
  id: string;
  competitorName: string;
  productService: string;
  pricing: string;
  strengths: string;
  weaknesses: string;
  marketPosition: string;
  threatLevel: ThreatLevel;
  notes: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sales & marketing strategy record
 */
export interface SalesStrategyRecord {
  id: string;
  strategyName: string;
  targetAudience: string;
  channels: string;
  budget: number;
  expectedROI: number;
  status: StatusType;
  startDate: string;
  endDate: string;
  notes: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Debt collection record
 */
export interface DebtRecord {
  id: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysPastDue: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  contactAttempts: number;
  lastContactDate: string;
  notes: string;
  paymentPlan?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Task management record
 */
export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: PriorityLevel;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  category: string;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// ============================================================================
// FORM INPUTS
// ============================================================================

/**
 * Generic form input for creating/updating records
 */
export type FormInput<T> = Omit<T, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

/**
 * Search and filter parameters
 */
export interface SearchFilters {
  searchTerm?: string;
  status?: string;
  priority?: PriorityLevel;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Date range for analytics
 */
export interface DateRange {
  start: string;
  end: string;
}

/**
 * Analytics data point
 */
export interface AnalyticsDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Chart data structure
 */
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extract async function return type
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : any;