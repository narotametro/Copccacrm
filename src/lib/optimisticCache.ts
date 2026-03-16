/**
 * OPTIMISTIC CACHE SYSTEM - HubSpot-style Performance
 * 
 * Features:
 * - Instant UI updates (optimistic)
 * - Background sync with server
 * - Smart cache invalidation
 * - Real-time subscriptions
 * - No loading spinners
 * 
 * Usage:
 * const cache = useOptimisticCache('customers');
 * const customers = cache.get(); // Instant
 * cache.create(newCustomer); // Instant UI update, syncs in background
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLoadingStore } from '@/store/loadingStore';

interface CacheConfig<T> {
  table: string;
  query?: string;
  orderBy?: { column: string; ascending?: boolean };
  filter?: (item: T) => boolean;
  queryFilters?: Array<{ column: string; operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'; value: any }>;
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
}

class OptimisticCache<T extends { id: string }> {
  private data: T[] = [];
  private lastFetch: number = 0;
  private subscribers: Set<() => void> = new Set();
  private subscription: any = null;
  private config: CacheConfig<T>;

  constructor(config: CacheConfig<T>) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      ...config,
    };
  }

  // Subscribe to cache updates
  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers
  private notify() {
    this.subscribers.forEach(cb => cb());
  }

  // Get cached data (instant)
  get(): T[] {
    return this.config.filter ? this.data.filter(this.config.filter) : this.data;
  }

  // Set data and notify subscribers
  private set(data: T[]) {
    this.data = data;
    this.lastFetch = Date.now();
    this.notify();
  }

  // Check if cache is stale
  private isStale(): boolean {
    return Date.now() - this.lastFetch > (this.config.ttl || 5 * 60 * 1000);
  }

  // Fetch from server (background)
  async fetch(force = false): Promise<T[]> {
    if (!force && !this.isStale() && this.data.length > 0) {
      return this.data; // Return cached data
    }

    // Notify global loading system
    const loadingStore = useLoadingStore.getState();
    const operationId = `fetch-${this.config.table}-${Date.now()}`;
    loadingStore.startLoading(operationId);

    try {
      let query = supabase
        .from(this.config.table)
        .select(this.config.query || '*');

      // Apply query filters
      if (this.config.queryFilters) {
        this.config.queryFilters.forEach(qf => {
          switch (qf.operator) {
            case 'eq':
              query = query.eq(qf.column, qf.value);
              break;
            case 'neq':
              query = query.neq(qf.column, qf.value);
              break;
            case 'gt':
              query = query.gt(qf.column, qf.value);
              break;
            case 'gte':
              query = query.gte(qf.column, qf.value);
              break;
            case 'lt':
              query = query.lt(qf.column, qf.value);
              break;
            case 'lte':
              query = query.lte(qf.column, qf.value);
              break;
          }
        });
      }

      if (this.config.orderBy) {
        query = query.order(this.config.orderBy.column, {
          ascending: this.config.orderBy.ascending ?? false,
        });
      }

      const { data, error } = await query;

      if (error) throw error;

      this.set((data as unknown as T[]) || []);
      return this.data;
    } catch (error) {
      console.error(`Error fetching ${this.config.table}:`, error);
      return this.data; // Return stale data on error    } finally {
      // Stop loading indicator
      const loadingStore = useLoadingStore.getState();
      loadingStore.stopLoading(operationId);    }
  }

  // Optimistically create item (instant UI update)
  async create(item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T | null> {
    const loadingStore = useLoadingStore.getState();
    const operationId = `create-${this.config.table}-${Date.now()}`;
    loadingStore.startLoading(operationId);

    const tempId = `temp_${Date.now()}`;
    const optimisticItem = {
      ...item,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as T;

    // Instant UI update
    this.set([optimisticItem, ...this.data]);

    try {
      // Background sync
      const { data, error } = await supabase
        .from(this.config.table)
        .insert([item])
        .select()
        .single();

      if (error) throw error;

      // Replace temp item with real one
      this.set(this.data.map(d => (d.id === tempId ? data as unknown as T : d)));
      
      return data as T;
    } catch (error) {
      console.error(`Error creating ${this.config.table}:`, error);
      // Rollback optimistic update
      this.set(this.data.filter(d => d.id !== tempId));
      toast.error('Failed to create item');
      return null;
    } finally {
      loadingStore.stopLoading(operationId);
    }
  }

  // Optimistically update item (instant UI update)
  async update(id: string, updates: Partial<T>): Promise<boolean> {
    const loadingStore = useLoadingStore.getState();
    const operationId = `update-${this.config.table}-${Date.now()}`;
    loadingStore.startLoading(operationId);

    const originalItem = this.data.find(d => d.id === id);
    if (!originalItem) {
      loadingStore.stopLoading(operationId);
      return false;
    }

    // Instant UI update
    const updatedItem = { ...originalItem, ...updates, updated_at: new Date().toISOString() };
    this.set(this.data.map(d => (d.id === id ? updatedItem as T : d)));

    try {
      // Background sync
      const { error } = await supabase
        .from(this.config.table)
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error updating ${this.config.table}:`, error);
      // Rollback optimistic update
      this.set(this.data.map(d => (d.id === id ? originalItem : d)));
      toast.error('Failed to update item');
      return false;
    } finally {
      loadingStore.stopLoading(operationId);
    }
  }

  // Optimistically delete item (instant UI update)
  async delete(id: string): Promise<boolean> {
    const loadingStore = useLoadingStore.getState();
    const operationId = `delete-${this.config.table}-${Date.now()}`;
    loadingStore.startLoading(operationId);

    const originalItem = this.data.find(d => d.id === id);
    if (!originalItem) {
      loadingStore.stopLoading(operationId);
      return false;
    }

    // Instant UI update
    this.set(this.data.filter(d => d.id !== id));

    try {
      // Background sync
      const { error } = await supabase
        .from(this.config.table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting ${this.config.table}:`, error);
      // Rollback optimistic update
      this.set([...this.data, originalItem]);
      toast.error('Failed to delete item');
      return false;
    } finally {
      loadingStore.stopLoading(operationId);
    }
  }

  // Setup real-time subscription
  subscribeToChanges() {
    if (this.subscription) return;

    this.subscription = supabase
      .channel(`${this.config.table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.config.table,
        },
        () => {
          // Refetch in background when changes occur
          this.fetch(true);
        }
      )
      .subscribe();
  }

  // Cleanup real-time subscription
  unsubscribeFromChanges() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  // Clear cache
  clear() {
    this.set([]);
  }
}

// React hook for optimistic cache
export function useOptimisticCache<T extends { id: string }>(
  config: CacheConfig<T>
) {
  const cacheRef = useRef<OptimisticCache<T> | null>(null);
  const [, forceUpdate] = useState({});

  // Initialize cache
  if (!cacheRef.current) {
    cacheRef.current = new OptimisticCache(config);
  }

  const cache = cacheRef.current;

  // Subscribe to cache updates
  useEffect(() => {
    const unsubscribe = cache.subscribe(() => {
      forceUpdate({}); // Trigger re-render
    });

    // Initial fetch (background)
    cache.fetch();

    // Setup real-time subscription
    cache.subscribeToChanges();

    return () => {
      unsubscribe();
      cache.unsubscribeFromChanges();
    };
  }, [cache]);

  const reload = useCallback(() => cache.fetch(true), [cache]);
  const create = useCallback((item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => cache.create(item), [cache]);
  const update = useCallback((id: string, updates: Partial<T>) => cache.update(id, updates), [cache]);
  const remove = useCallback((id: string) => cache.delete(id), [cache]);

  return {
    data: cache.get(),
    reload,
    create,
    update,
    delete: remove,
    clear: () => cache.clear(),
  };
}

// Example usage:
/*
function CustomersPage() {
  const { data: customers, create, update, delete: deleteCustomer } = useOptimisticCache<Customer>({
    table: 'customers',
    orderBy: { column: 'created_at', ascending: false },
  });

  const handleCreate = async () => {
    await create({ name: 'New Customer', email: 'test@example.com' });
    // UI updates INSTANTLY, syncs in background
  };

  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
*/
