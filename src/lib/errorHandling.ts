/**
 * ZERO-ERRORS ERROR HANDLING SYSTEM
 * 
 * Core principles:
 * 1. Users NEVER see technical error messages
 * 2. All errors have user-friendly messages
 * 3. Automatic retry for transient failures
 * 4. Graceful degradation for permanent failures
 * 5. Silent logging in production, detailed in development
 */

import { PostgrestError } from '@supabase/supabase-js';

// User-friendly error messages (NO TECHNICAL JARGON)
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Connection issue detected. Retrying automatically...',
  OFFLINE: 'You appear to be offline. Please check your internet connection.',
  TIMEOUT: 'This is taking longer than usual. Please try again.',
  
  // Authentication errors
  AUTH_EXPIRED: 'Your session has expired. Please sign in again.',
  AUTH_INVALID: 'Please sign in to continue.',
  AUTH_PERMISSION: 'You don\'t have permission to access this feature.',
  
  // Database errors
  DB_ERROR: 'Unable to save your changes. Please try again.',
  DB_CONFLICT: 'This item was updated by someone else. Refreshing...',
  DB_NOT_FOUND: 'This item could not be found. It may have been deleted.',
  
  // Form errors
  VALIDATION_ERROR: 'Please check the form and try again.',
  REQUIRED_FIELD: 'Please fill in all required fields.',
  
  // General errors
  UNKNOWN_ERROR: 'Something unexpected happened. Please try again.',
  MAINTENANCE: 'We\'re performing quick maintenance. Please wait a moment.',
} as const;

export interface UserFriendlyError {
  message: string;
  canRetry: boolean;
  shouldReload: boolean;
  isTransient: boolean;
}

/**
 * Convert ANY error into a user-friendly message
 * Users will NEVER see technical stack traces or error codes
 */
export function getUserFriendlyError(error: unknown): UserFriendlyError {
  // Network errors (most common)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: ERROR_MESSAGES.NETWORK_ERROR,
      canRetry: true,
      shouldReload: false,
      isTransient: true,
    };
  }

  // Offline detection
  if (!navigator.onLine) {
    return {
      message: ERROR_MESSAGES.OFFLINE,
      canRetry: true,
      shouldReload: false,
      isTransient: true,
    };
  }

  // Supabase/PostgreSQL errors
  if (isPostgrestError(error)) {
    return handlePostgrestError(error);
  }

  // Authentication errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('auth') || message.includes('token') || message.includes('session')) {
      return {
        message: ERROR_MESSAGES.AUTH_EXPIRED,
        canRetry: false,
        shouldReload: false, // NEVER auto-reload - users hate this
        isTransient: false,
      };
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return {
        message: ERROR_MESSAGES.AUTH_PERMISSION,
        canRetry: false,
        shouldReload: false,
        isTransient: false,
      };
    }

    if (message.includes('timeout')) {
      return {
        message: ERROR_MESSAGES.TIMEOUT,
        canRetry: true,
        shouldReload: false,
        isTransient: true,
      };
    }
  }

  // Default: Unknown error (still user-friendly)
  return {
    message: ERROR_MESSAGES.UNKNOWN_ERROR,
    canRetry: true,
    shouldReload: false,
    isTransient: false,
  };
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

function handlePostgrestError(error: PostgrestError): UserFriendlyError {
  // RLS policy violations (permission errors)
  if (error.code === 'PGRST301' || error.message.includes('policy')) {
    return {
      message: ERROR_MESSAGES.AUTH_PERMISSION,
      canRetry: false,
      shouldReload: false,
      isTransient: false,
    };
  }

  // Unique constraint violations (conflicts)
  if (error.code === '23505' || error.message.includes('duplicate')) {
    return {
      message: 'This item already exists.',
      canRetry: false,
      shouldReload: false,
      isTransient: false,
    };
  }

  // Foreign key violations
  if (error.code === '23503') {
    return {
      message: 'Unable to delete this item. It is being used elsewhere.',
      canRetry: false,
      shouldReload: false,
      isTransient: false,
    };
  }

  // Not found errors
  if (error.code === 'PGRST116') {
    return {
      message: ERROR_MESSAGES.DB_NOT_FOUND,
      canRetry: false,
      shouldReload: false, // NEVER auto-reload - users hate this
      isTransient: false,
    };
  }

  // Default database error
  return {
    message: ERROR_MESSAGES.DB_ERROR,
    canRetry: true,
    shouldReload: false,
    isTransient: true,
  };
}

/**
 * Automatic retry with exponential backoff
 * Retries transient failures automatically (users don't even notice)
 */
export async function withAutoRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const errorInfo = getUserFriendlyError(error);
      
      // Don't retry if error is not transient
      if (!errorInfo.isTransient || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Log retry attempt (dev only)
      if (import.meta.env.DEV) {
        console.log(`Retrying operation (attempt ${attempt + 1}/${maxRetries})...`);
      }
    }
  }
  
  throw lastError;
}

/**
 * Safe async operation wrapper
 * NEVER throws - always returns {data, error} tuple
 * Users never see unhandled promise rejections
 */
export async function safeAsync<T>(
  operation: () => Promise<T>
): Promise<{ data: T | null; error: UserFriendlyError | null }> {
  try {
    const data = await withAutoRetry(operation);
    return { data, error: null };
  } catch (error) {
    // Convert to user-friendly error
    const userError = getUserFriendlyError(error);
    
    // Log technical details in development only
    if (import.meta.env.DEV) {
      console.error('Operation failed:', error);
    }
    
    return { data: null, error: userError };
  }
}

/**
 * Network status monitoring
 * Automatically notifies users when they go offline/online
 */
let isOfflineNotificationShown = false;

export function initNetworkMonitoring(): void {
  // Detect when user goes offline
  window.addEventListener('offline', () => {
    if (isOfflineNotificationShown) return;
    isOfflineNotificationShown = true;
    
    showNetworkNotification(ERROR_MESSAGES.OFFLINE, 'error');
  });

  // Detect when user comes back online
  window.addEventListener('online', () => {
    if (!isOfflineNotificationShown) return;
    isOfflineNotificationShown = false;
    
    showNetworkNotification('Connection restored! You\'re back online.', 'success');
    
    // No automatic reload - let user continue working
    // They can manually refresh if needed
  });
}

function showNetworkNotification(message: string, type: 'error' | 'success'): void {
  // Create toast notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ef4444' : '#10b981'};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 999999;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  // Add slide-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/**
 * Global error handler for unhandled promise rejections
 * Catches ANY error that slips through and converts to user-friendly message
 */
export function initGlobalErrorHandling(): void {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault(); // Prevent console error spam
    
    const errorInfo = getUserFriendlyError(event.reason);
    
    // Show user-friendly notification instead of error
    showNetworkNotification(errorInfo.message, 'error');
    
    // Log technical details in development only
    if (import.meta.env.DEV) {
      console.error('Unhandled promise rejection:', event.reason);
    }
  });

  // Catch global JavaScript errors
  window.addEventListener('error', (event) => {
    // Skip if this is a handled error (from ErrorBoundary or try-catch)
    if (event.defaultPrevented) return;
    
    // Skip 404 errors (already handled by main.tsx)
    if (event.message?.includes('404')) return;
    
    event.preventDefault(); // Prevent console error spam
    
    const errorInfo = getUserFriendlyError(event.error);
    
    // Show user-friendly notification
    showNetworkNotification(errorInfo.message, 'error');
    
    // Log technical details in development only
    if (import.meta.env.DEV) {
      console.error('Global error:', event.error);
    }
  });
}
