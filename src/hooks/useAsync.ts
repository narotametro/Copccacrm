import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook for handling async operations with loading states and toast notifications
 * Standardizes error handling and success messages across the application
 */
export function useAsyncAction() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Execute an async action with automatic toast notifications
   * @param action - The async function to execute
   * @param options - Configuration for messages and callbacks
   */
  const execute = async <T,>(
    action: () => Promise<T>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T | null> => {
    const {
      successMessage = 'Operation completed successfully',
      errorMessage = 'Operation failed',
      onSuccess,
      onError,
    } = options;

    setIsLoading(true);

    try {
      const result = await action();
      toast.success(successMessage);
      onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error(errorMessage);
      onError?.(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Execute an async action without toast notifications
   * Useful when you need custom error handling
   */
  const executeSilent = async <T,>(
    action: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T | null> => {
    const { onSuccess, onError } = options;

    setIsLoading(true);

    try {
      const result = await action();
      onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    execute,
    executeSilent,
  };
}

/**
 * Hook for debouncing search inputs
 * Prevents excessive API calls or expensive operations
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  });

  return debouncedValue;
}
