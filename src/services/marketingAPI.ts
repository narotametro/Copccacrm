/**
 * Marketing API Service
 * Handles campaign management and analytics
 */

import { createClient } from '@/lib/supabase-client';

const supabase = createClient();

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type CampaignChannel = 'email' | 'sms' | 'whatsapp' | 'social' | 'push';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  channels: CampaignChannel[];
  target_segment?: string;
  budget: number;
  reach: number;
  engagement_rate: number;
  conversion_rate: number;
  roi: number;
  created_at: string;
  start_date?: string;
  end_date?: string;
}

export const marketingAPI = {
  /**
   * Get all campaigns
   */
  async getAll(status?: CampaignStatus) {
    let query = supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Get campaign by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        analytics:campaign_analytics(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create new campaign
   */
  async create(campaign: Omit<Campaign, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert([campaign as any])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update campaign
   */
  async update(id: string, updates: Partial<Campaign>) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete campaign
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get campaign performance summary
   */
  async getPerformanceSummary() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('status, reach, engagement_rate, roi')
      .eq('status', 'active');

    if (error) throw error;

    const summary = {
      totalCampaigns: data.length,
      totalReach: data.reduce((sum: number, c: any) => sum + c.reach, 0),
      avgEngagement: data.reduce((sum: number, c: any) => sum + c.engagement_rate, 0) / data.length,
      avgROI: data.reduce((sum: number, c: any) => sum + c.roi, 0) / data.length,
    };

    return summary;
  },
};
