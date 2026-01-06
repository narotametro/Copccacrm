/**
 * Sales API Service
 * Handles sales pipeline and deal operations
 */

import { createClient } from '@/lib/supabase-client';

const supabase = createClient();

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  customer_id: string;
  customer_name?: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  pipeline: string;
  next_action?: string;
  days_in_stage: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
  expected_close_date?: string;
}

export const salesAPI = {
  /**
   * Get all deals with optional pipeline filter
   */
  async getAll(pipeline?: string) {
    let query = supabase
      .from('deals')
      .select(`
        *,
        customer:customers(name, company)
      `)
      .order('created_at', { ascending: false });

    if (pipeline) {
      query = query.eq('pipeline', pipeline);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Get deals by stage
   */
  async getByStage(stage: DealStage) {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        customer:customers(name, company)
      `)
      .eq('stage', stage)
      .order('probability', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get deal by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        customer:customers(*),
        activities:deal_activities(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create new deal
   */
  async create(deal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('deals')
      .insert([deal as any])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update deal
   */
  async update(id: string, updates: Partial<Deal>) {
    const { data, error } = await supabase
      .from('deals')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Move deal to next stage
   */
  async moveToStage(id: string, stage: DealStage) {
    return this.update(id, { stage, days_in_stage: 0 });
  },

  /**
   * Get pipeline statistics
   */
  async getPipelineStats() {
    const { data, error } = await supabase
      .from('deals')
      .select('stage, value')
      .neq('stage', 'lost');

    if (error) throw error;

    const stats = data.reduce((acc: Record<string, { count: number; value: number }>, deal: any) => {
      if (!acc[deal.stage]) {
        acc[deal.stage] = { count: 0, value: 0 };
      }
      acc[deal.stage].count++;
      acc[deal.stage].value += deal.value;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    return stats;
  },

  /**
   * Get deals closing this month
   */
  async getClosingThisMonth() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .gte('expected_close_date', startOfMonth.toISOString())
      .lte('expected_close_date', endOfMonth.toISOString())
      .neq('stage', 'won')
      .neq('stage', 'lost')
      .order('probability', { ascending: false });

    if (error) throw error;
    return data;
  },
};
