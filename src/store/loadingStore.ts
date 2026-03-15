import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  loadingOperations: Set<string>;
  startLoading: (operationId: string) => void;
  stopLoading: (operationId: string) => void;
  isOperationLoading: (operationId: string) => boolean;
}

/**
 * Global loading state store
 * Use this to track loading operations across the entire app
 * Shows a persistent indicator in the navbar
 */
export const useLoadingStore = create<LoadingState>((set, get) => ({
  isLoading: false,
  loadingOperations: new Set<string>(),

  startLoading: (operationId: string) => {
    const operations = new Set(get().loadingOperations);
    operations.add(operationId);
    set({ loadingOperations: operations, isLoading: operations.size > 0 });
  },

  stopLoading: (operationId: string) => {
    const operations = new Set(get().loadingOperations);
    operations.delete(operationId);
    set({ loadingOperations: operations, isLoading: operations.size > 0 });
  },

  isOperationLoading: (operationId: string) => {
    return get().loadingOperations.has(operationId);
  },
}));

/**
 * Hook to track an async operation with automatic cleanup
 * Usage:
 * 
 * const trackLoading = useTrackLoading();
 * 
 * const fetchData = async () => {
 *   await trackLoading('fetch-customers', async () => {
 *     const data = await supabase.from('customers').select('*');
 *     return data;
 *   });
 * };
 */
export const useTrackLoading = () => {
  const { startLoading, stopLoading } = useLoadingStore();

  return async <T,>(operationId: string, operation: () => Promise<T>): Promise<T> => {
    startLoading(operationId);
    try {
      const result = await operation();
      return result;
    } finally {
      stopLoading(operationId);
    }
  };
};
