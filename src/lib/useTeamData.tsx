/**
 * Team-aware data fetching hooks
 * Ensures proper data sharing within teams
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { useCollaboration } from './collaboration';
import { 
  afterSalesAPI, 
  kpiAPI, 
  competitorsAPI, 
  salesAPI, 
  debtAPI,
  taskAPI,
  userAPI 
} from './api';

export interface TeamDataConfig {
  /**
   * Enable real-time collaboration (auto-refresh)
   */
  realtime?: boolean;
  
  /**
   * Refresh interval in milliseconds
   */
  refreshInterval?: number;
}

/**
 * Hook to fetch all team data with real-time collaboration
 */
export function useTeamData(config: TeamDataConfig = {}) {
  const { user, isAdmin, selectedUserId } = useAuth();
  const { realtime = true, refreshInterval = 5000 } = config;

  const [afterSalesData, setAfterSalesData] = useState<any[]>([]);
  const [kpiData, setKPIData] = useState<any[]>([]);
  const [competitorsData, setCompetitorsData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [debtData, setDebtData] = useState<any[]>([]);
  const [tasksData, setTasksData] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // Separate initial loading state
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchAllData = useCallback(async (isInitial = false) => {
    if (!user) return;
    
    try {
      // Only show full loading on initial load
      if (isInitial) {
        setLoading(true);
      }
      setError(null);

      // Determine if we should fetch all team data or just user data
      const all = isAdmin && !selectedUserId;
      const userId = selectedUserId || (!all ? user.id : undefined);

      console.log('🔄 Fetching team data...', { 
        isAdmin, 
        selectedUserId, 
        fetchAll: all,
        userId,
        isInitial
      });

      // Fetch all data in parallel
      const [afterSales, kpi, competitors, sales, debt, tasks, team] = await Promise.all([
        afterSalesAPI.getAll(userId, all).catch((err) => {
          console.error('AfterSales API error:', err);
          return { records: [] };
        }),
        kpiAPI.getAll(userId, all).catch((err) => {
          console.error('KPI API error:', err);
          return { records: [] };
        }),
        competitorsAPI.getAll(userId, all).catch((err) => {
          console.error('Competitors API error:', err);
          return { records: [] };
        }),
        salesAPI.getAll(userId, all).catch((err) => {
          console.error('Sales API error:', err);
          return { strategies: [] };
        }),
        debtAPI.getAll(userId, all).catch((err) => {
          console.error('Debt API error:', err);
          return { records: [] };
        }),
        taskAPI.getAll(userId, all).catch((err) => {
          console.error('Tasks API error:', err);
          console.warn('Tasks module may not be fully initialized yet');
          return { records: [] };
        }),
        userAPI.getTeamMembers().catch((err) => {
          console.error('Team API error:', err);
          return { users: [] };
        }),
      ]);

      // Update all state
      setAfterSalesData(afterSales.records || []);
      setKPIData(kpi.records || []);
      setCompetitorsData(competitors.records || []);
      setSalesData(sales.strategies || []);
      setDebtData(debt.records || []);
      setTasksData(tasks.records || []);
      setTeamMembers(team.users || []);

      console.log('✅ Team data fetched:', {
        afterSales: afterSales.records?.length || 0,
        kpi: kpi.records?.length || 0,
        competitors: competitors.records?.length || 0,
        sales: sales.strategies?.length || 0,
        debt: debt.records?.length || 0,
        tasks: tasks.records?.length || 0,
        teamMembers: team.users?.length || 0,
      });
    } catch (err: any) {
      console.error('❌ Error fetching team data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      if (isInitial) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  }, [user, isAdmin, selectedUserId]);

  // Set up real-time collaboration
  const { refresh, isRefreshing, lastUpdate } = useCollaboration({
    fetchData: () => fetchAllData(false), // Background refresh, not initial
    enabled: realtime && !!user && !initialLoading, // Don't start polling until initial load complete
    interval: refreshInterval,
    fastMode: true,
  });

  // Initial fetch when user changes - only show loading screen on first load
  useEffect(() => {
    if (user) {
      // Check if we have cached data in localStorage
      const cacheKey = `pocket_crm_cache_${user.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          // Load from cache immediately (stale data)
          setAfterSalesData(parsedCache.afterSalesData || []);
          setKPIData(parsedCache.kpiData || []);
          setCompetitorsData(parsedCache.competitorsData || []);
          setSalesData(parsedCache.salesData || []);
          setDebtData(parsedCache.debtData || []);
          setTasksData(parsedCache.tasksData || []);
          setTeamMembers(parsedCache.teamMembers || []);
          setLoading(false);
          setInitialLoading(false);
          console.log('📦 Loaded data from cache, refreshing in background...');
          
          // Then fetch fresh data in background
          fetchAllData(false);
        } catch (e) {
          console.error('Cache parse error:', e);
          fetchAllData(true);
        }
      } else {
        fetchAllData(true); // Initial load with loading screen
      }
    }
  }, [user, selectedUserId]); // Removed fetchAllData from dependencies to prevent loops
  
  // Cache data whenever it changes
  useEffect(() => {
    if (user && !initialLoading) {
      const cacheKey = `pocket_crm_cache_${user.id}`;
      const cacheData = {
        afterSalesData,
        kpiData,
        competitorsData,
        salesData,
        debtData,
        tasksData,
        teamMembers,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }
  }, [afterSalesData, kpiData, competitorsData, salesData, debtData, tasksData, teamMembers, user, initialLoading]);

  return {
    // Data
    afterSalesData,
    kpiData,
    competitorsData,
    salesData,
    debtData,
    tasksData,
    teamMembers,
    
    // State
    loading,
    error,
    isRefreshing,
    lastUpdate,
    
    // Actions
    refresh,
    refetch: () => fetchAllData(false), // Manual refetch without loading screen
    
    // Setters for optimistic updates
    setAfterSalesData,
    setKPIData,
    setCompetitorsData,
    setSalesData,
    setDebtData,
    setTasksData,
  };
}

/**
 * Hook for a single module's data
 */
export function useModuleData(
  module: 'aftersales' | 'kpi' | 'competitors' | 'sales' | 'debt',
  config: TeamDataConfig = {}
) {
  const { user, isAdmin, selectedUserId } = useAuth();
  const { realtime = true, refreshInterval = 5000 } = config;
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const all = isAdmin && !selectedUserId;
      const userId = selectedUserId || (!all ? user.id : undefined);

      let response;
      switch (module) {
        case 'aftersales':
          response = await afterSalesAPI.getAll(userId, all);
          setData(response.records || []);
          break;
        case 'kpi':
          response = await kpiAPI.getAll(userId, all);
          setData(response.records || []);
          break;
        case 'competitors':
          response = await competitorsAPI.getAll(userId, all);
          setData(response.records || []);
          break;
        case 'sales':
          response = await salesAPI.getAll(userId, all);
          setData(response.strategies || []);
          break;
        case 'debt':
          response = await debtAPI.getAll(userId, all);
          setData(response.records || []);
          break;
      }
    } catch (err: any) {
      console.error(`Error fetching ${module} data:`, err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, selectedUserId, module]);

  const { refresh, isRefreshing, lastUpdate } = useCollaboration({
    fetchData,
    enabled: realtime && !!user,
    interval: refreshInterval,
    fastMode: true,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedUserId, fetchData]);

  return {
    data,
    loading,
    error,
    isRefreshing,
    lastUpdate,
    refresh,
    refetch: fetchData,
    setData,
  };
}