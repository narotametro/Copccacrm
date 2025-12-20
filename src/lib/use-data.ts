import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './auth-context';
import { afterSalesAPI, competitorsAPI, myProductsAPI, debtAPI, salesAPI, kpiAPI, activitiesAPI, taskAPI } from './api';
import { toast } from 'sonner@2.0.3';

// Generic data hook factory to reduce code duplication
function createDataHook(
  api: any,
  entityName: string,
  successMessages: { create: string; update: string; delete: string }
) {
  return () => {
    const { selectedUserId, user, isAdmin } = useAuth();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false); // Changed from true to false

    const fetchAll = useMemo(
      () => isAdmin && !selectedUserId,
      [isAdmin, selectedUserId]
    );

    const targetUserId = useMemo(
      () => {
        // If admin is viewing all members, don't pass a userId
        if (fetchAll) return undefined;
        // Otherwise use selected user or current user
        return selectedUserId || user?.id;
      },
      [selectedUserId, user?.id, fetchAll]
    );

    const loadRecords = useCallback(async () => {
      // Don't load if no user yet
      if (!user) {
        console.log(`⏸️ [${entityName}] Skipping load - no user yet`);
        return;
      }
      
      try {
        setLoading(true);
        console.log(`📊 [${entityName}] Loading records:`, {
          currentUser: user.id,
          currentUserRole: user.role,
          selectedUserId,
          targetUserId,
          fetchAll,
          isAdmin,
          willFetchAllUsers: fetchAll,
          willFetchForUser: targetUserId || 'current-user',
          apiCallParams: { targetUserId, fetchAll }
        });
        const { records: data } = await api.getAll(targetUserId, fetchAll);
        console.log(`✅ [${entityName}] Loaded ${data?.length || 0} records`, {
          mode: fetchAll ? 'ALL_USERS' : `SINGLE_USER(${targetUserId})`,
          recordCount: data?.length || 0,
          hasUserMetadata: data?.some((r: any) => r._userId) || false,
          sampleRecords: data?.slice(0, 3).map((r: any) => ({
            id: r.id,
            _userId: r._userId,
            _userName: r._userName,
            customer: r.customer,
            title: r.title
          })) || []
        });
        setRecords(data || []);
      } catch (error: any) {
        console.error(`❌ [${entityName}] Failed to load:`, error);
        // Don't show toast on user switch - it's annoying
        // toast.error(`Failed to load ${entityName}`);
        // Set empty array on error instead of keeping old data
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }, [user, isAdmin, selectedUserId, targetUserId, fetchAll]);

    useEffect(() => {
      loadRecords();
    }, [loadRecords]);

    const create = useCallback(async (record: any) => {
      try {
        const { record: newRecord } = await api.create(record);
        setRecords(prev => [...prev, newRecord]);
        toast.success(successMessages.create);
        return newRecord;
      } catch (error: any) {
        console.error(`Failed to create ${entityName}:`, error);
        toast.error(error.message || `Failed to create ${entityName}`);
        throw error;
      }
    }, []);

    const update = useCallback(async (id: number, updates: any) => {
      try {
        // Find the record to get its actual owner
        const existingRecord = records.find(r => r.id === id);
        console.log(`🔍 [${entityName}] Update lookup:`, {
          recordId: id,
          foundRecord: !!existingRecord,
          recordOwnerId: existingRecord?._userId,
          currentTargetUserId: targetUserId,
          currentUser: user?.id,
          totalRecords: records.length,
          recordSample: existingRecord ? {
            id: existingRecord.id,
            _userId: existingRecord._userId,
            customer: existingRecord.customer || existingRecord.title
          } : null
        });
        
        // Use the record's owner ID if available, otherwise use targetUserId
        const recordOwnerId = existingRecord?._userId || targetUserId;
        
        console.log(`📤 [${entityName}] Updating with userId:`, recordOwnerId);
        const { record: updatedRecord } = await api.update(id, updates, recordOwnerId);
        setRecords(prev => prev.map(r => r.id === id ? updatedRecord : r));
        toast.success(successMessages.update);
        return updatedRecord;
      } catch (error: any) {
        console.error(`Failed to update ${entityName}:`, error);
        toast.error(error.message || `Failed to update ${entityName}`);
        throw error;
      }
    }, [targetUserId, records, user]);

    const remove = useCallback(async (id: number) => {
      try {
        // Find the record to get its actual owner
        const existingRecord = records.find(r => r.id === id);
        // Use the record's owner ID if available, otherwise use targetUserId
        const recordOwnerId = existingRecord?._userId || targetUserId;
        
        await api.delete(id, recordOwnerId);
        setRecords(prev => prev.filter(r => r.id !== id));
        toast.success(successMessages.delete);
      } catch (error: any) {
        console.error(`Failed to delete ${entityName}:`, error);
        toast.error(error.message || `Failed to delete ${entityName}`);
        throw error;
      }
    }, [targetUserId, records]);

    return { records, loading, create, update, remove, refresh: loadRecords };
  };
}

// Individual hooks using the factory
export const useAfterSales = createDataHook(
  afterSalesAPI,
  'after sales records',
  {
    create: 'Customer added successfully',
    update: 'Customer updated successfully',
    delete: 'Customer deleted successfully'
  }
);

export const useCompetitorIntel = createDataHook(
  competitorsAPI,
  'competitor records',
  {
    create: 'Competitor added successfully',
    update: 'Competitor updated successfully',
    delete: 'Competitor deleted successfully'
  }
);

export const useMyProducts = createDataHook(
  myProductsAPI,
  'my products',
  {
    create: 'Product added successfully',
    update: 'Product updated successfully',
    delete: 'Product deleted successfully'
  }
);

export const useDebtCollection = createDataHook(
  debtAPI,
  'debt records',
  {
    create: 'Payment record added successfully',
    update: 'Payment record updated successfully',
    delete: 'Payment record deleted successfully'
  }
);

export const useSalesStrategies = createDataHook(
  salesAPI,
  'sales strategies',
  {
    create: 'Strategy added successfully',
    update: 'Strategy updated successfully',
    delete: 'Strategy deleted successfully'
  }
);

export const useKPITracking = createDataHook(
  kpiAPI,
  'KPI records',
  {
    create: 'KPI added successfully',
    update: 'KPI updated successfully',
    delete: 'KPI deleted successfully'
  }
);

// Activities hook - simpler as it's read-only
export function useActivities() {
  const { selectedUserId, user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = useMemo(
    () => selectedUserId || user?.id,
    [selectedUserId, user?.id]
  );

  const loadActivities = useCallback(async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      const { activities: data } = await activitiesAPI.getAll(targetUserId);
      setActivities(data || []);
    } catch (error: any) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return { activities, loading, refresh: loadActivities };
}

// Export taskAPI directly as useTasks for backward compatibility
// (TaskManagement uses it as a direct API, not a hook)
export const useTasks = taskAPI;