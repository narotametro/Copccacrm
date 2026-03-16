/**
 * INSTANT ACTIONS SYSTEM
 * 
 * Makes EVERY user action feel instant with optimistic updates.
 * No waiting, no loading spinners, pure UX magic.
 * 
 * Philosophy:
 * 1. User performs action → UI updates INSTANTLY
 * 2. Background sync happens silently
 * 3. If sync fails, rollback and notify user
 * 4. Loading indicator shows in navbar/sidebar (never blocks UI)
 * 
 * Usage:
 * await instantAction('create-order', async () => {
 *   return await supabase.from('orders').insert(data);
 * }, {
 *   successMessage: 'Order created!',
 *   errorMessage: 'Failed to create order',
 *   onSuccess: () => { addToUIInstantly(); }
 * });
 */

import { toast } from 'sonner';
import { useLoadingStore } from '@/store/loadingStore';

interface InstantActionOptions {
  /** Message to show on success (optional, shows toast if provided) */
  successMessage?: string;
  /** Message to show on error (optional, uses default if not provided) */
  errorMessage?: string;
  /** Callback to execute immediately (optimistic update) */
  onStart?: () => void;
  /** Callback on successful completion */
  onSuccess?: (result: any) => void;
  /** Callback to rollback if action fails */
  onRollback?: () => void;
  /** Callback on error */
  onError?: (error: any) => void;
  /** Hide success toast (useful for bulk operations) */
  silent?: boolean;
}

/**
 * Execute an action with instant feedback and background sync
 * 
 * @param actionId - Unique identifier for this action (for loading tracking)
 * @param action - The async function to execute (e.g., database operation)
 * @param options - Configuration options for UI feedback
 * @returns Promise with the result
 */
export async function instantAction<T>(
  actionId: string,
  action: () => Promise<T>,
  options: InstantActionOptions = {}
): Promise<T | null> {
  const {
    successMessage,
    errorMessage = 'Action failed',
    onStart,
    onSuccess,
    onRollback,
    onError,
    silent = false,
  } = options;

  // Start loading indicator
  const loadingStore = useLoadingStore.getState();
  const operationId = `instant-${actionId}-${Date.now()}`;
  loadingStore.startLoading(operationId);

  // Execute optimistic update IMMEDIATELY
  if (onStart) {
    try {
      onStart();
    } catch (error) {
      console.error(`Failed to execute optimistic update for ${actionId}:`, error);
    }
  }

  try {
    // Execute actual action in background
    const result = await action();

    // Success callback
    if (onSuccess) {
      onSuccess(result);
    }

    // Show success message (unless silent)
    if (successMessage && !silent) {
      toast.success(successMessage, { duration: 2000 });
    }

    return result;
  } catch (error) {
    console.error(`Instant action failed [${actionId}]:`, error);

    // Rollback optimistic update
    if (onRollback) {
      try {
        onRollback();
      } catch (rollbackError) {
        console.error(`Failed to rollback ${actionId}:`, rollbackError);
      }
    }

    // Error callback
    if (onError) {
      onError(error);
    }

    // Show error message
    toast.error(errorMessage, { duration: 4000 });

    return null;
  } finally {
    // Stop loading indicator
    loadingStore.stopLoading(operationId);
  }
}

/**
 * Execute multiple actions in parallel with instant feedback
 * All actions execute simultaneously, UI updates instantly
 * 
 * @param actions - Array of instant actions to execute
 * @returns Array of results (null for failed actions)
 */
export async function instantBatch(
  actions: Array<{
    id: string;
    action: () => Promise<any>;
    options?: InstantActionOptions;
  }>
): Promise<any[]> {
  const loadingStore = useLoadingStore.getState();
  const batchId = `batch-${Date.now()}`;
  loadingStore.startLoading(batchId);

  // Execute all optimistic updates IMMEDIATELY
  actions.forEach(({ options }) => {
    if (options?.onStart) {
      try {
        options.onStart();
      } catch (error) {
        console.error('Failed to execute optimistic update:', error);
      }
    }
  });

  try {
    // Execute all actions in parallel
    const results = await Promise.allSettled(
      actions.map(({ action }) => action())
    );

    // Process results
    const finalResults = results.map((result, index) => {
      const { options } = actions[index];

      if (result.status === 'fulfilled') {
        // Success
        if (options?.onSuccess) {
          options.onSuccess(result.value);
        }
        if (options?.successMessage && !options?.silent) {
          toast.success(options.successMessage, { duration: 2000 });
        }
        return result.value;
      } else {
        // Failure - rollback
        if (options?.onRollback) {
          try {
            options.onRollback();
          } catch (rollbackError) {
            console.error('Failed to rollback:', rollbackError);
          }
        }
        if (options?.onError) {
          options.onError(result.reason);
        }
        if (options?.errorMessage) {
          toast.error(options.errorMessage, { duration: 4000 });
        }
        return null;
      }
    });

    return finalResults;
  } finally {
    loadingStore.stopLoading(batchId);
  }
}

/**
 * Create an optimistic item that will be replaced with real data
 * Useful for list insertions
 * 
 * @param item - The item data
 * @returns Item with temporary ID and timestamps
 */
export function createOptimisticItem<T extends Record<string, any>>(
  item: T
): T & { id: string; created_at: string; updated_at: string } {
  return {
    ...item,
    id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Hook for instant form submissions
 * Prevents default form behavior and executes with instant feedback
 * 
 * Usage:
 * const submitForm = useInstantForm(async (data) => {
 *   await supabase.from('items').insert(data);
 * }, {
 *   successMessage: 'Item created!',
 *   onSuccess: () => { navigate('/items'); }
 * });
 * 
 * <form onSubmit={submitForm}>...</form>
 */
export function useInstantForm<T = any>(
  action: (data: T) => Promise<any>,
  options: InstantActionOptions = {}
) {
  return async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Extract form data
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries()) as T;

    // Execute with instant feedback
    await instantAction(
      `form-${Date.now()}`,
      () => action(data),
      options
    );
  };
}

/**
 * Visual feedback utilities
 */
export const feedback = {
  /** Show instant success feedback */
  success: (message: string) => {
    toast.success(message, { duration: 2000 });
  },

  /** Show instant error feedback */
  error: (message: string) => {
    toast.error(message, { duration: 4000 });
  },

  /** Show instant info feedback */
  info: (message: string) => {
    toast.info(message, { duration: 2000 });
  },

  /** Show instant warning feedback */
  warning: (message: string) => {
    toast.warning(message, { duration: 3000 });
  },

  /** Show loading feedback (automatically dismissed when action completes) */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /** Dismiss a specific toast */
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },
};
