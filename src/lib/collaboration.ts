/**
 * Real-Time Collaboration Utility
 * Handles team-based data synchronization and live updates
 */

import { useEffect, useCallback, useRef, useState } from 'react';

// Polling interval for real-time updates (in milliseconds)
const POLL_INTERVAL = 5000; // 5 seconds for fast updates
const SLOW_POLL_INTERVAL = 15000; // 15 seconds for background updates

export interface CollaborationConfig {
  /**
   * Function to fetch latest data
   */
  fetchData: () => Promise<void>;
  
  /**
   * Enable/disable automatic polling
   */
  enabled?: boolean;
  
  /**
   * Poll interval in milliseconds
   */
  interval?: number;
  
  /**
   * Enable fast polling (5s) when user is active
   */
  fastMode?: boolean;
}

/**
 * Hook for real-time data collaboration
 * Automatically polls for updates and syncs data across team members
 */
export function useCollaboration({
  fetchData,
  enabled = true,
  interval = POLL_INTERVAL,
  fastMode = true,
}: CollaborationConfig) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Track user activity for smart polling
  useEffect(() => {
    if (!fastMode) return;

    const handleActivity = () => {
      isActiveRef.current = true;
    };

    const handleInactive = () => {
      isActiveRef.current = false;
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('blur', handleInactive);
    window.addEventListener('focus', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('blur', handleInactive);
      window.removeEventListener('focus', handleActivity);
    };
  }, [fastMode]);

  // Refresh data with loading state
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Collaboration refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData]);

  // Set up polling interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    refresh();

    // Set up polling with the specified interval
    intervalRef.current = setInterval(() => {
      // Only poll if not already refreshing
      if (!isRefreshing) {
        refresh();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval]); // Removed fastMode and refresh from dependencies to prevent re-creating interval

  return {
    refresh,
    isRefreshing,
    lastUpdate,
  };
}

/**
 * Hook for optimistic updates
 * Updates UI immediately, then syncs with server
 */
export function useOptimisticUpdate<T>(
  currentData: T[],
  setData: (data: T[]) => void,
  apiCall: (item: T) => Promise<void>,
  refreshData: () => Promise<void>
) {
  const [isPending, setIsPending] = useState(false);

  const optimisticUpdate = useCallback(
    async (newItem: T, action: 'add' | 'update' | 'delete', itemId?: any) => {
      setIsPending(true);

      // Optimistic UI update
      let optimisticData: T[];
      if (action === 'add') {
        optimisticData = [...currentData, newItem];
      } else if (action === 'update' && itemId) {
        optimisticData = currentData.map(item =>
          (item as any).id === itemId ? newItem : item
        );
      } else if (action === 'delete' && itemId) {
        optimisticData = currentData.filter(item => (item as any).id !== itemId);
      } else {
        optimisticData = currentData;
      }

      setData(optimisticData);

      try {
        // Perform API call
        await apiCall(newItem);
        
        // Refresh to get server truth
        await refreshData();
      } catch (error) {
        // Rollback on error
        setData(currentData);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [currentData, setData, apiCall, refreshData]
  );

  return { optimisticUpdate, isPending };
}

/**
 * Format time ago for last update indicator
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Visual indicator component data
 */
export interface SyncStatus {
  status: 'synced' | 'syncing' | 'error';
  lastUpdate: Date;
  message: string;
}

/**
 * Get sync status for UI display
 */
export function getSyncStatus(
  isRefreshing: boolean,
  lastUpdate: Date,
  hasError: boolean = false
): SyncStatus {
  if (hasError) {
    return {
      status: 'error',
      lastUpdate,
      message: 'Sync error',
    };
  }

  if (isRefreshing) {
    return {
      status: 'syncing',
      lastUpdate,
      message: 'Syncing...',
    };
  }

  return {
    status: 'synced',
    lastUpdate,
    message: `Updated ${timeAgo(lastUpdate)}`,
  };
}