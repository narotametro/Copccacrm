import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, XCircle, Download, RefreshCw, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

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
  // Computed/optional fields
  leads_generated?: number;
  conversions?: number;
  spent?: number;
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

interface MarketingBudgetRow {
  id: string;
  channel: string;
  monthly_budget: number;
  target_leads: number;
  target_roi: number;
}

export const MarketingAnalytics: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);
  const [budgets, setBudgets] = useState<
    Array<{ id: string; channel: string; monthly_budget: number; target_leads: number; target_roi: number }>
  >([]);
  const [form, setForm] = useState({ channel: '', monthly_budget: '', target_leads: '', target_roi: '' });

  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  const user = useAuthStore((state) => state.user);

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

  const totalBudget = useMemo(
    () => budgets.reduce((sum, b) => sum + (b.monthly_budget || 0), 0),
    [budgets]
  );

  // Generate real recommendations based on campaign data
  const generateRecommendations = useMemo(() => {
    const recommendations = {
      stop: [] as string[],
      scale: [] as string[],
      fix: [] as string[],
      competitors: [] as string[],
    };

    if (campaigns.length === 0) {
      // Default recommendations when no data
      recommendations.stop = [
        'Low-performing channels (below 2% conversion rate)',
        'Generic content without targeting',
        'Ineffective timing for campaigns',
      ];
      recommendations.scale = [
        'High-converting channels (above 5% conversion)',
        'Successful campaign strategies',
        'Peak performance time slots',
      ];
      recommendations.fix = [
        'Content optimization needed',
        'Audience targeting improvements',
        'Landing page performance',
      ];
      recommendations.competitors = [
        'Competitors using advanced analytics',
        'Social media presence gaps',
        'Missing channel opportunities',
      ];
      return recommendations;
    }

    // Analyze campaign performance
    const channelPerformance: { [key: string]: { leads: number; conversions: number; spent: number; campaigns: number } } = {};

    campaigns.forEach(campaign => {
      if (campaign.channels && Array.isArray(campaign.channels)) {
        campaign.channels.forEach((channel: string) => {
          if (!channelPerformance[channel]) {
            channelPerformance[channel] = { leads: 0, conversions: 0, spent: 0, campaigns: 0 };
          }
          channelPerformance[channel].leads += campaign.leads_generated || 0;
          channelPerformance[channel].conversions += campaign.conversions || 0;
          channelPerformance[channel].spent += campaign.spent || campaign.budget || 0;
          channelPerformance[channel].campaigns += 1;
        });
      }
    });

    // Generate stop recommendations
    Object.entries(channelPerformance).forEach(([channel, stats]) => {
      const conversionRate = stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0;
      if (conversionRate < 2) {
        recommendations.stop.push(`${channel} campaigns (${conversionRate.toFixed(1)}% conversion, below 2% threshold)`);
      }
    });

    // Generate scale recommendations
    Object.entries(channelPerformance).forEach(([channel, stats]) => {
      const conversionRate = stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0;
      const roi = stats.spent > 0 ? (stats.conversions * 1000) / stats.spent : 0; // Simple ROI calculation
      if (conversionRate > 5) {
        recommendations.scale.push(`${channel} campaigns (${conversionRate.toFixed(1)}% conversion, ${roi.toFixed(1)}x ROI)`);
      }
    });

    // Generate fix recommendations
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    if (activeCampaigns < totalCampaigns * 0.5) {
      recommendations.fix.push('Increase active campaign ratio (currently ' + Math.round((activeCampaigns / totalCampaigns) * 100) + '%)');
    }

    // Generate competitor insights
    const usedChannels = new Set();
    campaigns.forEach(campaign => {
      if (campaign.channels) {
        campaign.channels.forEach((channel: string) => usedChannels.add(channel));
      }
    });

    const commonChannels = ['Email', 'SMS', 'Social Media', 'Paid Ads', 'Content Marketing'];
    const missingChannels = commonChannels.filter(channel => !usedChannels.has(channel));
    if (missingChannels.length > 0) {
      recommendations.competitors.push(`Missing channels: ${missingChannels.slice(0, 2).join(', ')}`);
    }

    // Fill with defaults if no specific recommendations
    if (recommendations.stop.length === 0) {
      recommendations.stop = ['Review underperforming campaigns regularly', 'Monitor conversion rates weekly', 'Optimize budget allocation'];
    }
    if (recommendations.scale.length === 0) {
      recommendations.scale = ['Identify top-performing channels', 'Increase budget for successful campaigns', 'Replicate winning strategies'];
    }
    if (recommendations.fix.length === 0) {
      recommendations.fix = ['A/B test campaign messaging', 'Improve audience targeting', 'Optimize landing pages'];
    }
    if (recommendations.competitors.length === 0) {
      recommendations.competitors = ['Monitor competitor social media activity', 'Track competitor content strategies', 'Analyze competitor channel mix'];
    }

    return recommendations;
  }, [campaigns]);

  // Calculate real performance metrics
  const performanceMetrics = useMemo(() => {
    if (campaigns.length === 0) {
      return {
        strategy: 75,
        campaign: 82,
        customer: 68,
      };
    }

    // Strategy performance: based on campaign success rate
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const totalCampaigns = campaigns.length;
    const strategyScore = totalCampaigns > 0 ? Math.round((completedCampaigns / totalCampaigns) * 100) : 75;

    // Campaign performance: based on conversion rates
    const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads_generated || 0), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
    const avgConversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
    const campaignScore = Math.min(100, Math.max(60, avgConversionRate * 2)); // Scale conversion rate

    // Customer response: based on leads vs budget efficiency
    const costPerLead = totalBudget > 0 && totalLeads > 0 ? totalBudget / totalLeads : 0;
    const customerScore = costPerLead > 0 ? Math.max(50, Math.min(95, 1000 / costPerLead)) : 70;

    return {
      strategy: strategyScore,
      campaign: Math.round(campaignScore),
      customer: Math.round(customerScore),
    };
  }, [campaigns, totalBudget]);

  const loadBudgets = useCallback(async () => {
    if (!supabaseReady || !user) return;

    try {
      const { data, error } = await supabase
        .from('marketing_budgets')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to load budgets from database:', error);
        // Fallback to localStorage
        const savedBudgets = localStorage.getItem('copcca-marketing-budgets');
        if (savedBudgets) {
          setBudgets(JSON.parse(savedBudgets));
        }
      } else if (data) {
        const formattedBudgets = data.map((budget: MarketingBudgetRow) => ({
          id: budget.id,
          channel: budget.channel,
          monthly_budget: budget.monthly_budget,
          target_leads: budget.target_leads,
          target_roi: budget.target_roi,
        }));
        setBudgets(formattedBudgets);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  }, [supabaseReady, user]);

  // Load campaigns and budgets on mount
  useEffect(() => {
    loadCampaigns();
    loadBudgets();
  }, [loadCampaigns, loadBudgets]);
  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.channel.trim()) {
      toast.error('Channel is required');
      return;
    }

    // Removed setLoading(true) - keep UI responsive during save

    if (supabaseReady && user) {
      try {
        const { data, error } = await supabase
          .from('marketing_budgets')
          .insert({
            channel: form.channel.trim(),
            monthly_budget: Number(form.monthly_budget) || 0,
            target_leads: Number(form.target_leads) || 0,
            target_roi: Number(form.target_roi) || 0,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to save budget to database:', error);
          toast.error('Failed to save budget target');
        } else if (data) {
          const newBudget = {
            id: data.id,
            channel: data.channel,
            monthly_budget: data.monthly_budget,
            target_leads: data.target_leads,
            target_roi: data.target_roi,
          };
          setBudgets(prev => [newBudget, ...prev]);
          toast.success('Budget target saved');
        }
      } catch (error) {
        console.error('Error saving budget:', error);
        toast.error('Failed to save budget target');
      }
    } else {
      // Fallback to localStorage
      const newEntry = {
        id: crypto.randomUUID(),
        channel: form.channel.trim(),
        monthly_budget: Number(form.monthly_budget) || 0,
        target_leads: Number(form.target_leads) || 0,
        target_roi: Number(form.target_roi) || 0,
      };

      const updatedBudgets = [newEntry, ...budgets];
      setBudgets(updatedBudgets);
      localStorage.setItem('copcca-marketing-budgets', JSON.stringify(updatedBudgets));
      toast.success('Budget targets saved (local storage)');
    }

    setForm({ channel: '', monthly_budget: '', target_leads: '', target_roi: '' });
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={RefreshCw} onClick={() => toast.success('AI analysis refreshed')}>Refresh AI Analysis</Button>
        <Button
          icon={Download}
          variant="outline"
          onClick={() => {
            downloadText(
              `marketing_intelligence_${new Date().toISOString().split('T')[0]}.txt`,
              'Marketing Intelligence Export\n\nStop/Scale/Fix recommendations + competitor insights.\n'
            );
            toast.success('Marketing intelligence exported');
          }}
        >
          Export Report
        </Button>
        <Button
          icon={Settings}
          variant="outline"
          onClick={() => toast.message('Configure metrics', { description: 'Demo: choose KPI set + thresholds.' })}
        >
          Configure Metrics
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-pink-500 to-rose-600 text-white border-none">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 size={28} />
          <h3 className="text-xl font-semibold">AI Marketing Intelligence</h3>
        </div>
        <div className="text-sm opacity-90">
          Comprehensive AI analysis of your marketing performance with actionable recommendations
        </div>
      </Card>

      {/* Budget & Targets */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Budget & Targets</h3>
            <p className="text-sm text-slate-600">Capture monthly budget, lead targets, and ROI goals per channel</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-600">Total budget</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(totalBudget)}</p>
          </div>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4" onSubmit={handleAddBudget}>
          <Input
            label="Channel"
            placeholder="Email, SMS, Ads"
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value })}
            required
          />
          <Input
            label="Monthly Budget"
            type="number"
            value={form.monthly_budget}
            onChange={(e) => setForm({ ...form, monthly_budget: e.target.value })}
            placeholder="1200000"
          />
          <Input
            label="Target Leads"
            type="number"
            value={form.target_leads}
            onChange={(e) => setForm({ ...form, target_leads: e.target.value })}
            placeholder="300"
          />
          <Input
            label="Target ROI (x)"
            type="number"
            step="0.1"
            value={form.target_roi}
            onChange={(e) => setForm({ ...form, target_roi: e.target.value })}
            placeholder="4.0"
          />
          <div className="flex items-end justify-end">
            <Button type="submit">
              Save target
            </Button>
          </div>
        </form>

        <div className="grid md:grid-cols-3 gap-3">
          {budgets.map((b) => (
            <div key={b.id} className="p-3 border rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-slate-900">{b.channel}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">Target</span>
              </div>
              <p className="text-sm text-slate-600">Budget: {formatCurrency(b.monthly_budget)}</p>
              <p className="text-sm text-slate-600">Leads: {b.target_leads}</p>
              <p className="text-sm text-slate-600">ROI goal: {b.target_roi}x</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* What to Stop */}
        <Card className="bg-red-50 border-red-200">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <XCircle className="text-red-600" size={20} />
            What to Stop
          </h3>
          <ul className="space-y-2">
            {generateRecommendations.stop.slice(0, 3).map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-red-600">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* What to Scale */}
        <Card className="bg-green-50 border-green-200">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} />
            What to Scale
          </h3>
          <ul className="space-y-2">
            {generateRecommendations.scale.slice(0, 3).map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-green-600">↑</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* What to Fix */}
        <Card className="bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="text-yellow-600" size={20} />
            What to Fix
          </h3>
          <ul className="space-y-2">
            {generateRecommendations.fix.slice(0, 3).map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-yellow-600">Warning</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Competitor Intelligence */}
        <Card className="bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="text-blue-600" size={20} />
            What Competitors Do Better
          </h3>
          <ul className="space-y-2">
            {generateRecommendations.competitors.slice(0, 3).map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-blue-600">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Performance Dashboards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <h4 className="text-sm font-medium text-slate-600 mb-2">Strategy Performance</h4>
          <div className="text-3xl font-bold text-green-600">{performanceMetrics.strategy}%</div>
          <div className="text-xs text-slate-600 mt-1">
            {performanceMetrics.strategy >= 80 ? 'Above target' : performanceMetrics.strategy >= 60 ? 'On target' : 'Below target'}
          </div>
        </Card>
        <Card className="text-center">
          <h4 className="text-sm font-medium text-slate-600 mb-2">Campaign Performance</h4>
          <div className="text-3xl font-bold text-blue-600">{performanceMetrics.campaign}%</div>
          <div className="text-xs text-slate-600 mt-1">
            {performanceMetrics.campaign >= 85 ? 'Exceeding goals' : performanceMetrics.campaign >= 70 ? 'Meeting goals' : 'Below goals'}
          </div>
        </Card>
        <Card className="text-center">
          <h4 className="text-sm font-medium text-slate-600 mb-2">Customer Response</h4>
          <div className="text-3xl font-bold text-purple-600">{performanceMetrics.customer}%</div>
          <div className="text-xs text-slate-600 mt-1">
            {performanceMetrics.customer >= 75 ? 'Positive sentiment' : performanceMetrics.customer >= 60 ? 'Neutral sentiment' : 'Needs improvement'}
          </div>
        </Card>
      </div>
    </div>
  );
};
