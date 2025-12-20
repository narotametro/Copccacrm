/**
 * Utility Functions
 * 
 * Common utility functions used throughout the application.
 * 
 * @module utils
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================================
// STYLING UTILITIES
// ============================================================================

/**
 * Combines class names with Tailwind CSS conflict resolution
 * 
 * @param inputs - Class names to combine
 * @returns Combined class string
 * 
 * @example
 * cn('px-4 py-2', 'bg-blue-500', { 'text-white': true })
 * // => 'px-4 py-2 bg-blue-500 text-white'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Formats a number as currency with thousand separators
 * 
 * @param amount - The amount to format
 * @param currency - Currency symbol (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234567.89)
 * // => '$1,234,567.89'
 */
export function formatCurrency(
  amount: number,
  currency: string = '$',
  decimals: number = 2
): string {
  try {
    const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${currency}${formatted}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency}0.00`;
  }
}

/**
 * Formats a number with thousand separators
 * 
 * @param num - The number to format
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567)
 * // => '1,234,567'
 */
export function formatNumber(num: number): string {
  try {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } catch (error) {
    console.error('Error formatting number:', error);
    return '0';
  }
}

/**
 * Formats a percentage value
 * 
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(0.1234)
 * // => '12.3%'
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  try {
    return `${(value * 100).toFixed(decimals)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0%';
  }
}

/**
 * Formats a phone number with country code
 * 
 * @param phone - Phone number
 * @param countryCode - Country code (e.g., '+1')
 * @returns Formatted phone string
 * 
 * @example
 * formatPhone('1234567890', '+1')
 * // => '+1 1234567890'
 */
export function formatPhone(phone: string, countryCode: string): string {
  return `${countryCode} ${phone}`;
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Formats a date string or Date object
 * 
 * @param date - Date string or Date object
 * @param format - Format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2024-12-02')
 * // => 'Dec 02, 2024'
 */
export function formatDate(date: string | Date, format: string = 'MMM dd, yyyy'): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }

    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${month} ${day}, ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Formats a date as relative time (e.g., "2 hours ago")
 * 
 * @param date - Date string or Date object
 * @returns Relative time string
 * 
 * @example
 * formatRelativeTime('2024-12-02T10:00:00Z')
 * // => '2 hours ago'
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(d);
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown';
  }
}

/**
 * Calculates days between two dates
 * 
 * @param date1 - First date
 * @param date2 - Second date (default: today)
 * @returns Number of days between dates
 */
export function daysBetween(date1: string | Date, date2: string | Date = new Date()): number {
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days between:', error);
    return 0;
  }
}

/**
 * Checks if a date is in the past
 * 
 * @param date - Date to check
 * @returns True if date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d < new Date();
  } catch (error) {
    console.error('Error checking past date:', error);
    return false;
  }
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Truncates a string to a maximum length
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated string
 * 
 * @example
 * truncate('This is a long string', 10)
 * // => 'This is...'
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalizes the first letter of a string
 * 
 * @param str - String to capitalize
 * @returns Capitalized string
 * 
 * @example
 * capitalize('hello world')
 * // => 'Hello world'
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to title case
 * 
 * @param str - String to convert
 * @returns Title case string
 * 
 * @example
 * toTitleCase('hello world')
 * // => 'Hello World'
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => capitalize(word.toLowerCase()))
    .join(' ');
}

/**
 * Generates initials from a name
 * 
 * @param name - Full name
 * @returns Initials (max 2 letters)
 * 
 * @example
 * getInitials('John Doe')
 * // => 'JD'
 */
export function getInitials(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates an email address
 * 
 * @param email - Email to validate
 * @returns True if valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a phone number
 * 
 * @param phone - Phone number to validate
 * @returns True if valid phone number
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[0-9]{5,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validates a password strength
 * 
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: 'Password is strong' };
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Groups an array of objects by a key
 * 
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Object with grouped items
 * 
 * @example
 * groupBy([{type: 'a', val: 1}, {type: 'b', val: 2}], 'type')
 * // => {a: [{type: 'a', val: 1}], b: [{type: 'b', val: 2}]}
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Removes duplicates from an array
 * 
 * @param array - Array with potential duplicates
 * @returns Array without duplicates
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Sorts an array of objects by a key
 * 
 * @param array - Array to sort
 * @param key - Key to sort by
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Deep clones an object
 * 
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('Error deep cloning object:', error);
    return obj;
  }
}

/**
 * Checks if an object is empty
 * 
 * @param obj - Object to check
 * @returns True if object is empty
 */
export function isEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Delays execution for a specified time
 * 
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async function multiple times
 * 
 * @param fn - Function to retry
 * @param retries - Number of retries
 * @param delayMs - Delay between retries
 * @returns Function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await delay(delayMs);
    return retry(fn, retries - 1, delayMs);
  }
}

// ============================================================================
// LOCAL STORAGE UTILITIES
// ============================================================================

/**
 * Safely gets an item from localStorage
 * 
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Stored value or default
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Safely sets an item in localStorage
 * 
 * @param key - Storage key
 * @param value - Value to store
 */
export function setLocalStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

/**
 * Safely removes an item from localStorage
 * 
 * @param key - Storage key
 */
export function removeLocalStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Generates a unique ID
 * 
 * @returns Unique ID string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Throttles a function call
 * 
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Downloads data as a file
 * 
 * @param data - Data to download
 * @param filename - Name of file
 * @param type - MIME type
 */
export function downloadFile(data: string, filename: string, type: string = 'text/plain'): void {
  try {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}

// ============================================================================
// LEGACY FORMATTING UTILITIES (for backward compatibility)
// ============================================================================

/**
 * Formats a number with comma separators (legacy name)
 * @param num - Number to format
 * @returns Formatted string with commas
 */
export function formatNumberWithCommas(num: number | string): string {
  if (typeof num === 'string') {
    num = parseFloat(num.replace(/,/g, ''));
  }
  if (isNaN(num)) return '0';
  return formatNumber(num);
}

/**
 * Formats input value with commas as user types
 * @param value - Input value
 * @returns Formatted value with commas
 */
export function formatInputWithCommas(value: string): string {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Split by decimal point
  const parts = cleaned.split('.');
  
  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Return with decimal if it exists
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
}

/**
 * Removes commas from a formatted number string
 * @param value - Formatted string with commas
 * @returns Clean number string
 */
export function removeCommas(value: string): string {
  return value.replace(/,/g, '');
}

/**
 * Formats a name (capitalizes first letter of each word)
 * @param name - Name to format
 * @returns Formatted name
 */
export function formatName(name: string): string {
  return toTitleCase(name);
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Gets Tailwind color classes based on status
 * @param status - Status value
 * @returns Tailwind color classes
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'excellent': 'bg-green-100 text-green-800 border-green-300',
    'good': 'bg-blue-100 text-blue-800 border-blue-300',
    'needs-attention': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'active': 'bg-green-100 text-green-800 border-green-300',
    'on-track': 'bg-blue-100 text-blue-800 border-blue-300',
    'exceeding': 'bg-purple-100 text-purple-800 border-purple-300',
    'at-risk': 'bg-red-100 text-red-800 border-red-300',
    'completed': 'bg-green-100 text-green-800 border-green-300',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'cancelled': 'bg-gray-100 text-gray-800 border-gray-300',
    'planned': 'bg-purple-100 text-purple-800 border-purple-300',
    'recommended': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  };
  
  return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Gets Tailwind color classes based on priority
 * @param priority - Priority level
 * @returns Tailwind color classes
 */
export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    'critical': 'bg-red-100 text-red-800 border-red-300',
    'high': 'bg-orange-100 text-orange-800 border-orange-300',
    'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'low': 'bg-gray-100 text-gray-800 border-gray-300',
  };
  
  return priorityColors[priority.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Gets Tailwind color classes based on threat level
 * @param threatLevel - Threat level
 * @returns Tailwind color classes
 */
export function getThreatColor(threatLevel: string): string {
  const threatColors: Record<string, string> = {
    'high': 'bg-red-100 text-red-800 border-red-300',
    'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'low': 'bg-green-100 text-green-800 border-green-300',
  };
  
  return threatColors[threatLevel.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Gets avatar background color based on user role
 * @param role - User role
 * @returns Tailwind background color class
 */
export function getAvatarColor(role: string): string {
  const avatarColors: Record<string, string> = {
    'admin': 'bg-pink-600',
    'member': 'bg-blue-600',
    'user': 'bg-blue-600',
  };
  
  return avatarColors[role.toLowerCase()] || 'bg-gray-600';
}