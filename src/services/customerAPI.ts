/**
 * Customer API Service
 * Handles all customer-related API operations
 */

import { createClient } from '@/lib/supabase-client';

const supabase = createClient();

export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  ltv: number;
  churn_risk: number;
  segment: 'VIP' | 'High' | 'Medium' | 'Low';
  tags?: string[];
  created_at: string;
  last_contact?: string;
}

export const customerAPI = {
  /**
   * Get all customers with optional filtering
   */
  async getAll(filters?: { segment?: string; search?: string }) {
    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.segment) {
      query = query.eq('segment', filters.segment);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Get customer by ID with 360° view data
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        interactions:customer_interactions(*),
        deals:deals(*),
        debts:debts(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create new customer
   */
  async create(customer: Omit<Customer, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer as any])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update customer
   */
  async update(id: string, updates: Partial<Customer>) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete customer
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get high-value customers
   */
  async getTopCustomers(limit: number = 10) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('ltv', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Get churn risk customers
   */
  async getChurnRisk(threshold: number = 50) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .gte('churn_risk', threshold)
      .order('churn_risk', { ascending: false });

    if (error) throw error;
    return data;
  },
};
