/**
 * Toast Notification Helper
 * 
 * Provides a consistent interface for displaying toast notifications
 * throughout the application with predefined styles and durations.
 * 
 * @module toast-helper
 */

import { toast } from 'sonner@2.0.3';

/**
 * Displays a success toast notification
 * 
 * @param message - Main message to display
 * @param description - Optional description text
 * 
 * @example
 * showSuccess('Saved successfully', 'Your changes have been saved')
 */
export const showSuccess = (message: string, description?: string): void => {
  toast.success(message, {
    description,
    duration: 3000,
  });
};

/**
 * Displays an error toast notification
 * 
 * @param message - Main error message to display
 * @param description - Optional error description
 * 
 * @example
 * showError('Failed to save', 'Please try again later')
 */
export const showError = (message: string, description?: string): void => {
  toast.error(message, {
    description,
    duration: 4000,
  });
};

/**
 * Displays an info toast notification
 * 
 * @param message - Main message to display
 * @param description - Optional description text
 * 
 * @example
 * showInfo('New update available', 'Click here to refresh')
 */
export const showInfo = (message: string, description?: string): void => {
  toast.info(message, {
    description,
    duration: 3000,
  });
};

/**
 * Displays a warning toast notification
 * 
 * @param message - Main warning message to display
 * @param description - Optional warning description
 * 
 * @example
 * showWarning('Session expiring soon', 'Please save your work')
 */
export const showWarning = (message: string, description?: string): void => {
  toast.warning(message, {
    description,
    duration: 3500,
  });
};

/**
 * Displays a loading toast notification
 * 
 * @param message - Loading message to display
 * @returns Toast ID for dismissal
 * 
 * @example
 * const toastId = showLoading('Saving...');
 * // ... perform async operation
 * dismissToast(toastId);
 */
export const showLoading = (message: string): string | number => {
  return toast.loading(message);
};

/**
 * Dismisses a specific toast notification
 * 
 * @param toastId - ID of the toast to dismiss
 * 
 * @example
 * const toastId = showLoading('Processing...');
 * dismissToast(toastId);
 */
export const dismissToast = (toastId: string | number): void => {
  toast.dismiss(toastId);
};

/**
 * Displays a toast that tracks the status of a promise
 * 
 * @param promise - Promise to track
 * @param messages - Messages for each state (loading, success, error)
 * @returns Promise result
 * 
 * @example
 * ```tsx
 * await showPromise(
 *   saveData(),
 *   {
 *     loading: 'Saving...',
 *     success: 'Saved successfully!',
 *     error: 'Failed to save'
 *   }
 * );
 * ```
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
): Promise<T> => {
  return toast.promise(promise, messages);
};