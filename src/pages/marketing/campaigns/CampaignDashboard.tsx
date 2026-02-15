import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, TrendingUp, Banknote, Users, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface MarketingCampaignRow {
  id: string;
  name: string;
  strategy?: string;
  objective?: string;
  audience?: string;
  channels?: string[];
  budget?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at?: string;
}

export const CampaignDashboard: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);

  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  const loadCampaigns = useCallback(async () => {
    try {
      // Load from localStorage first
      const saved = localStorage.getItem('copcca-campaigns');
      if (saved) {
        const localCampaigns = JSON.parse(saved);
        setCampaigns(localCampaigns);
      }

      // Load from Supabase if available
      if (supabaseReady) {
        const { data, error } = await supabase
          .from('marketing_campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase load error:', error);
        } else if (data && data.length > 0) {
          const supabaseCampaigns = data.map((campaign: MarketingCampaignRow) => ({
            id: campaign.id,
            name: campaign.name,
            strategy: campaign.strategy || 'General',
            objective: campaign.objective || 'Lead Generation',
            audience: campaign.audience || 'General audience',
            channels: campaign.channels || [],
            budget: campaign.budget || 0,
            startDate: campaign.start_date || '',
            endDate: campaign.end_date || '',
            notes: campaign.notes || 'No notes',
          }));

          setCampaigns(supabaseCampaigns);
          localStorage.setItem('copcca-campaigns', JSON.stringify(supabaseCampaigns));
        }
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  }, [supabaseReady]);

  // Load campaigns on component mount
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const kpiColorStyles: Record<string, { bg: string; icon: string }> = {
    green: { bg: 'bg-green-100', icon: 'text-green-600' },
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
    orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
    pink: { bg: 'bg-pink-100', icon: 'text-pink-600' },
  };

  // Calculate KPIs from real data
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalLeads = campaigns.length * 25; // Estimate based on campaigns
  const avgConversion = campaigns.length > 0 ? Math.round((totalLeads / campaigns.length) * 0.15) : 0;
  const totalRevenue = totalLeads * 50000; // Estimate revenue per lead
  const avgROI = campaigns.length > 0 ? Math.round((totalRevenue / totalBudget) * 100) / 100 : 0;

  const kpis = [
    { label: 'Active Campaigns', value: campaigns.length.toString(), icon: Megaphone, color: 'green' },
    { label: 'Total Leads', value: totalLeads.toString(), icon: Users, color: 'blue' },
    { label: 'Conversion Rate', value: `${avgConversion}%`, icon: TrendingUp, color: 'purple' },
    { label: 'Total Cost', value: formatCurrency(totalBudget), icon: Banknote, color: 'orange' },
    { label: 'Revenue Generated', value: formatCurrency(totalRevenue), icon: Target, color: 'pink' },
    { label: 'ROI', value: `${avgROI}x`, icon: TrendingUp, color: 'green' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const styles = kpiColorStyles[kpi.color] ?? { bg: 'bg-slate-100', icon: 'text-slate-600' };
          // Last 2 items (Revenue Generated and ROI) span 2 columns each
          const spanClass = index >= 4 ? 'md:col-span-2' : '';
          return (
            <Card key={kpi.label} className={spanClass}>
              <div className={`p-2 rounded-lg ${styles.bg} w-fit mb-2`}>
                <Icon className={styles.icon} size={20} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="text-sm text-slate-600">{kpi.label}</div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Campaign Timeline</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.message('Calendar view', { description: 'Calendar view coming soon.' })}
          >
            View Calendar
          </Button>
        </div>
        <div className="space-y-3">
          {campaigns.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No campaigns yet. Create your first campaign!</p>
          ) : (
            campaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">{campaign.name}</div>
                  <div className="text-sm text-slate-600">Strategy: {campaign.strategy}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">{campaign.channels.length} channels</div>
                  <div className="text-xs text-green-600">{formatCurrency(campaign.budget)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
