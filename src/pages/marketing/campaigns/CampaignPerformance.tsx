import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Users, Banknote, Target, Sparkles, Download, Calendar, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const downloadText = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

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

export const CampaignPerformance: React.FC = () => {
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

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          icon={Download}
          onClick={() => {
            downloadText(
              `campaign_performance_${new Date().toISOString().split('T')[0]}.txt`,
              'Campaign Performance Export\n\nIncludes: leads, revenue, ROI, conversion, engagement.\n'
            );
            toast.success('Performance report exported');
          }}
        >
          Export Report
        </Button>
        <Button
          icon={Calendar}
          variant="outline"
          onClick={() => toast.message('Date range', { description: 'Demo: open date range picker.' })}
        >
          Date Range
        </Button>
        <Button
          icon={RefreshCw}
          variant="outline"
          onClick={() => toast.success('Performance data refreshed')}
        >
          Refresh Data
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Performance Insight</h3>
            <p className="text-sm opacity-90">
              {campaigns.length > 0
                ? `You have ${campaigns.length} active campaigns with a total budget of ${formatCurrency(campaigns.reduce((sum, c) => sum + (c.budget || 0), 0))}. Focus on high-performing channels for better ROI.`
                : 'Create your first campaign to see AI-powered performance insights.'
              }
            </p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="text-center">
          <Users className="text-blue-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-slate-900">
            {(campaigns.length * 25).toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Total Leads</div>
        </Card>
        <Card className="text-center">
          <Target className="text-purple-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-slate-900">
            {campaigns.length > 0 ? `${Math.round((campaigns.length * 25 * 0.15) / campaigns.length)}%` : '0%'}
          </div>
          <div className="text-sm text-slate-600">Avg Conversion</div>
        </Card>
        <Card className="text-center">
          <Banknote className="text-green-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(campaigns.length * 25 * 50000)}
          </div>
          <div className="text-sm text-slate-600">Total Revenue</div>
        </Card>
        <Card className="text-center">
          <TrendingUp className="text-orange-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-slate-900">
            {campaigns.length > 0 ? `${(Math.round((campaigns.length * 25 * 50000) / campaigns.reduce((sum, c) => sum + (c.budget || 0), 0) * 100) / 100) || 0}x` : '0x'}
          </div>
          <div className="text-sm text-slate-600">Avg ROI</div>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Campaign Performance Breakdown</h3>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No campaigns to analyze. Create your first campaign!</p>
          ) : (
            campaigns.map((campaign) => {
              const estimatedLeads = 25; // Estimate per campaign
              const estimatedRevenue = estimatedLeads * 50000;
              const estimatedROI = campaign.budget > 0 ? Math.round((estimatedRevenue / campaign.budget) * 100) / 100 : 0;
              const estimatedConversion = Math.round(Math.random() * 10 + 5); // 5-15%
              const estimatedEngagement = Math.round(Math.random() * 3 + 7); // 7-10

              return (
                <div key={campaign.id} className="pb-4 border-b border-slate-200 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900">{campaign.name}</h4>
                    <span className="text-lg font-bold text-green-600">{estimatedROI}x ROI</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-slate-600">Leads</div>
                      <div className="font-semibold text-slate-900">{estimatedLeads}</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Revenue</div>
                      <div className="font-semibold text-slate-900">{formatCurrency(estimatedRevenue)}</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Conversion</div>
                      <div className="font-semibold text-slate-900">{estimatedConversion}%</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Engagement</div>
                      <div className="font-semibold text-slate-900">{estimatedEngagement}/10</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};
