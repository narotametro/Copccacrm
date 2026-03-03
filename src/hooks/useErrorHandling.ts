/**
 * ZERO-ERRORS REACT HOOKS
 * 
 * Safe async operations with:
 * - Automatic retry for transient failures
 * - User-friendly error messages (NO technical jargon)
 * - Loading states
 * - Prevents broken UI
 */

import { useState, useCallback, useEffect } from 'react';
import { safeAsync, getUserFriendlyError, UserFriendlyError } from '../lib/errorHandling';
import { toast } from 'sonner';

/**
 * Safe async operation hook
 * 
 * Usage:
 * const { execute, loading, error } = useAsyncOperation(async () => {
 *   return await supabase.from('customers').select('*');
 * });
 * 
 * Features:
 * - Automatic retry for network errors
 * - User-friendly error notifications
 * - Loading state management
 * - No unhandled promise rejections
 */
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  options: {
    showSuccessToast?: boolean;
    successMessage?: string;
    showErrorToast?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: UserFriendlyError) => void;
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<UserFriendlyError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: result, error: err } = await safeAsync(operation);

    setLoading(false);

    if (err) {
      setError(err);
      
      // Show user-friendly error toast
      if (options.showErrorToast !== false) {
        toast.error(err.message);
      }
      
      options.onError?.(err);
      return { data: null, error: err };
    }

    setData(result);
    
    // Show success toast if requested
    if (options.showSuccessToast && options.successMessage) {
      toast.success(options.successMessage);
    }
    
    options.onSuccess?.(result!);
    return { data: result, error: null };
  }, [operation]);

  return {
    execute,
    loading,
    error,
    data,
    reset: () => {
      setLoading(false);
      setError(null);
      setData(null);
    },
  };
}

/**
 * Safe data fetching hook with automatic loading states
 * 
 * Usage:
 * const { data, loading, error, refetch } = useSafeQuery(
 *   async () => supabase.from('customers').select('*')
 * );
 * 
 * Features:
 * - Fetches on mount
 * - Automatic retry on failure
 * - Loading and error states
 * - Refetch capability
 * - No broken UI states
 */
export function useSafeQuery<T>(
  query: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<UserFriendlyError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: result, error: err } = await safeAsync(query);

    setLoading(false);

    if (err) {
      setError(err);
      
      // Show error toast for critical failures
      if (!err.isTransient) {
        toast.error(err.message);
      }
      
      return;
    }

    setData(result);
  }, [query]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Form submission hook with validation and error handling
 * 
 * Usage:
 * const { submit, loading, error } = useFormSubmit(async (values) => {
 *   await supabase.from('customers').insert(values);
 * }, {
 *   successMessage: 'Customer added successfully!',
 *   onSuccess: () => navigate('/customers'),
 * });
 * 
 * Features:
 * - Loading state during submission
 * - User-friendly validation errors
 * - Success notifications
 * - Prevents double-submission
 */
export function useFormSubmit<T>(
  onSubmit: (values: T) => Promise<void>,
  options: {
    successMessage?: string;
    onSuccess?: () => void;
    validate?: (values: T) => string | null;
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (values: T) => {
    // Prevent double-submission
    if (loading) return;

    // Client-side validation
    if (options.validate) {
      const validationError = options.validate(values);
      if (validationError) {
        setError(validationError);
        toast.error(validationError);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const { error: err } = await safeAsync(() => onSubmit(values));

    setLoading(false);

    if (err) {
      setError(err.message);
      toast.error(err.message);
      return;
    }

    // Success!
    if (options.successMessage) {
      toast.success(options.successMessage);
    }
    
    options.onSuccess?.();
  }, [loading, onSubmit, options]);

  return {
    submit,
    loading,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Image loading hook with fallback
 * Prevents broken image icons in UI
 * 
 * Usage:
 * const imageSrc = useImageWithFallback(userAvatar, '/default-avatar.png');
 */
export function useImageWithFallback(
  src: string | null | undefined,
  fallbackSrc: string
): string {
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    if (!src) {
      setImageSrc(fallbackSrc);
      return;
    }

    // Test if image loads
    const img = new Image();
    img.onload = () => setImageSrc(src);
    img.onerror = () => setImageSrc(fallbackSrc);
    img.src = src;
  }, [src, fallbackSrc]);

  return imageSrc;
}

/**
 * Optimistic update hook
 * Updates UI immediately, rolls back on error
 * 
 * Usage:
 * const { update } = useOptimisticUpdate(
 *   data,
 *   async (newData) => supabase.from('table').update(newData)
 * );
 */
export function useOptimisticUpdate<T>(
  currentData: T,
  updateFn: (data: T) => Promise<void>
) {
  const [optimisticData, setOptimisticData] = useState(currentData);
  const [isUpdating, setIsUpdating] = useState(false);

  const update = useCallback(async (newData: T) => {
    // Update UI immediately (optimistic)
    setOptimisticData(newData);
    setIsUpdating(true);

    const { error } = await safeAsync(() => updateFn(newData));

    setIsUpdating(false);

    if (error) {
      // Rollback on error
      setOptimisticData(currentData);
      toast.error(error.message);
      return;
    }

    // Success - update was persisted
    toast.success('Updated successfully');
  }, [currentData, updateFn]);

  return {
    data: optimisticData,
    update,
    isUpdating,
  };
}
