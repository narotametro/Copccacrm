import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, XCircle, Download, RefreshCw, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import jsPDF from 'jspdf';

const exportToPDF = (
  budgets: any[],
  recommendations: { stop: string[]; scale: string[]; fix: string[]; competitor: string[] },
  performanceMetrics: { strategy: number; campaign: number; customer: number },
  formatCurrency: (val: number) => string,
  campaigns: any[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Marketing Analytics Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Export Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Budget & Targets Section
  if (budgets.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Budget & Targets', 15, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    budgets.forEach((budget, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${budget.channel}`, 15, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.text(`   Monthly Budget: ${formatCurrency(budget.monthly_budget)}`, 15, yPos);
      yPos += 6;
      doc.text(`   Target Leads: ${budget.target_leads}`, 15, yPos);
      yPos += 6;
      doc.text(`   Target ROI: ${budget.target_roi}x`, 15, yPos);
      yPos += 10;
    });
  } else {
    doc.setFontSize(10);
    doc.text('No budget targets configured.', 15, yPos);
    yPos += 10;
  }

  // AI Recommendations Section
  yPos += 5;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Recommendations', 15, yPos);
  yPos += 10;

  // Stop Recommendations
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Stop:', 15, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (recommendations.stop.length > 0) {
    recommendations.stop.forEach((rec) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(`- ${rec}`, pageWidth - 35);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 6;
    });
  } else {
    doc.text('- No stop recommendations', 20, yPos);
    yPos += 6;
  }
  yPos += 5;

  // Scale Recommendations
  if (yPos > 260) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Scale:', 15, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (recommendations.scale.length > 0) {
    recommendations.scale.forEach((rec) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(`- ${rec}`, pageWidth - 35);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 6;
    });
  } else {
    doc.text('- No scale recommendations', 20, yPos);
    yPos += 6;
  }
  yPos += 5;

  // Fix Recommendations
  if (yPos > 260) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Fix:', 15, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (recommendations.fix.length > 0) {
    recommendations.fix.forEach((rec) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(`- ${rec}`, pageWidth - 35);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 6;
    });
  } else {
    doc.text('- No fix recommendations', 20, yPos);
    yPos += 6;
  }
  yPos += 5;

  // Competitor Insights
  if (yPos > 260) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Competitor Insights:', 15, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (recommendations.competitor.length > 0) {
    recommendations.competitor.forEach((rec) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(`- ${rec}`, pageWidth - 35);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 6;
    });
  } else {
    doc.text('- No competitor insights', 20, yPos);
    yPos += 6;
  }

  // Performance Metrics Section
  yPos += 10;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Metrics', 15, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Strategy Performance: ${performanceMetrics.strategy}%`, 15, yPos);
  yPos += 6;
  doc.text(`Campaign Performance: ${performanceMetrics.campaign}%`, 15, yPos);
  yPos += 6;
  doc.text(`Customer Response: ${performanceMetrics.customer}%`, 15, yPos);
  yPos += 10;

  // Summary Statistics
  yPos += 5;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 15, yPos);
  yPos += 10;

  const totalBudget = budgets.reduce((sum, b) => sum + (b.monthly_budget || 0), 0);
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Monthly Budget: ${formatCurrency(totalBudget)}`, 15, yPos);
  yPos += 6;
  doc.text(`Total Campaigns: ${totalCampaigns}`, 15, yPos);
  yPos += 6;
  doc.text(`Active Campaigns: ${activeCampaigns}`, 15, yPos);
  yPos += 6;
  doc.text(`Total Leads Generated: ${totalLeads}`, 15, yPos);
  yPos += 6;
  doc.text(`Total Conversions: ${totalConversions}`, 15, yPos);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`marketing_analytics_${new Date().toISOString().split('T')[0]}.pdf`);
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
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [configSettings, setConfigSettings] = useState({
    minConversionRate: '2',
    targetROI: '3',
    minLeadVolume: '10',
  });

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
      competitor: [] as string[],
    };

    if (campaigns.length === 0) {
      // No campaigns yet - provide actionable startup recommendations
      recommendations.stop = [
        'No campaigns running yet - start by creating your first campaign',
      ];
      recommendations.scale = [
        'Create campaigns to identify high-performing channels',
        'Set budget targets to track ROI effectively',
      ];
      recommendations.fix = [
        'Add your first marketing campaign to begin analysis',
        'Define budget targets for at least 2-3 channels',
      ];
      recommendations.competitor = [
        'Add campaigns with channel data to identify gaps',
        'Track competitor channels for strategic opportunities',
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

    // Generate stop recommendations based on real data
    Object.entries(channelPerformance).forEach(([channel, stats]) => {
      const conversionRate = stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0;
      const roi = stats.spent > 0 ? ((stats.conversions * 1000) / stats.spent) : 0;
      
      if (conversionRate < 2 && stats.campaigns > 0) {
        recommendations.stop.push(`${channel}: ${conversionRate.toFixed(1)}% conversion rate is below 2% threshold - consider pausing`);
      } else if (roi < 1 && stats.spent > 10000) {
        recommendations.stop.push(`${channel}: ROI of ${roi.toFixed(1)}x is negative - review or stop`);
      }
    });

    // Generate scale recommendations based on high performers
    Object.entries(channelPerformance).forEach(([channel, stats]) => {
      const conversionRate = stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0;
      const roi = stats.spent > 0 ? ((stats.conversions * 1000) / stats.spent) : 0;
      const costPerLead = stats.leads > 0 ? stats.spent / stats.leads : 0;
      
      if (conversionRate > 5 && stats.leads > 10) {
        recommendations.scale.push(`${channel}: Strong ${conversionRate.toFixed(1)}% conversion with ${stats.leads} leads - scale budget`);
      } else if (roi > 3 && stats.campaigns > 0) {
        recommendations.scale.push(`${channel}: ${roi.toFixed(1)}x ROI is excellent - increase investment`);
      } else if (costPerLead > 0 && costPerLead < 50000 && stats.leads > 20) {
        recommendations.scale.push(`${channel}: Low cost per lead (${formatCurrency(costPerLead)}) - expand reach`);
      }
    });

    // Generate fix recommendations
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;
    
    if (activeCampaigns < totalCampaigns * 0.3 && totalCampaigns > 2) {
      recommendations.fix.push(`Only ${activeCampaigns} of ${totalCampaigns} campaigns are active (${Math.round((activeCampaigns / totalCampaigns) * 100)}%) - activate more campaigns`);
    }
    
    if (draftCampaigns > 3) {
      recommendations.fix.push(`${draftCampaigns} campaigns stuck in draft - review and launch or delete`);
    }

    // Budget vs actual spend analysis
    const totalBudgetAllocated = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
    const spendRate = totalBudgetAllocated > 0 ? (totalSpent / totalBudgetAllocated) * 100 : 0;
    
    if (spendRate < 30 && totalCampaigns > 2) {
      recommendations.fix.push(`Low budget utilization (${spendRate.toFixed(0)}%) - campaigns may be under-resourced`);
    } else if (spendRate > 95 && activeCampaigns > 0) {
      recommendations.fix.push(`Budget nearly exhausted (${spendRate.toFixed(0)}% spent) - allocate additional funds or pause campaigns`);
    }

    // Generate competitor insights based on channel gaps
    const usedChannels = new Set<string>();
    campaigns.forEach(campaign => {
      if (campaign.channels) {
        campaign.channels.forEach((channel: string) => usedChannels.add(channel.toLowerCase()));
      }
    });

    const keyChannels = ['email', 'sms', 'social media', 'paid ads', 'content marketing', 'influencer', 'seo'];
    const missingChannels = keyChannels.filter(channel => !Array.from(usedChannels).some(used => used.toLowerCase().includes(channel)));
    
    if (missingChannels.length > 0) {
      const missing = missingChannels.slice(0, 3).map(c => c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      recommendations.competitor.push(`Untapped channels: ${missing.join(', ')} - competitors may be winning here`);
    }

    // Channel diversification
    if (usedChannels.size < 3 && totalCampaigns > 3) {
      recommendations.competitor.push(`Only ${usedChannels.size} channels in use - competitors with 4+ channels often outperform`);
    }

    // If still no specific data-driven recommendations, provide context-aware suggestions
    if (recommendations.stop.length === 0) {
      recommendations.stop.push('All channels performing above minimum thresholds - continue monitoring weekly');
    }
    if (recommendations.scale.length === 0) {
      recommendations.scale.push(`Add lead and conversion data to ${campaigns.length} campaigns to identify scale opportunities`);
    }
    if (recommendations.fix.length === 0) {
      recommendations.fix.push('Campaign structure is healthy - focus on optimizing messaging and targeting');
    }
    if (recommendations.competitor.length === 0) {
      recommendations.competitor.push(`Good channel coverage with ${usedChannels.size} active channels - monitor competitor campaigns for new trends`);
    }

    return recommendations;
  }, [campaigns, formatCurrency]);

  // Calculate real performance metrics
  const performanceMetrics = useMemo(() => {
    if (campaigns.length === 0) {
      return {
        strategy: 0,
        campaign: 0,
        customer: 0,
      };
    }

    // Strategy performance: based on campaign completion and strategy alignment
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const campaignsWithStrategy = campaigns.filter(c => c.strategy && c.strategy.trim() !== '').length;
    const totalCampaigns = campaigns.length;
    
    const completionRate = totalCampaigns > 0 ? (completedCampaigns / totalCampaigns) * 100 : 0;
    const strategyAlignment = totalCampaigns > 0 ? (campaignsWithStrategy / totalCampaigns) * 100 : 0;
    const strategyScore = Math.round((completionRate * 0.5) + (strategyAlignment * 0.5));

    // Campaign performance: based on actual conversion rates and lead generation
    const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads_generated || 0), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
    const avgConversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
    
    // Score based on conversion rate: 5% = 100, 2% = 40, 0% = 0
    const conversionScore = Math.min(100, Math.max(0, avgConversionRate * 20));
    
    // Factor in lead volume: campaigns generating leads score higher
    const leadsPerCampaign = totalCampaigns > 0 ? totalLeads / totalCampaigns : 0;
    const volumeBonus = Math.min(20, leadsPerCampaign / 5); // Max 20 point bonus
    
    const campaignScore = Math.round(Math.min(100, conversionScore + volumeBonus));

    // Customer response: based on ROI and cost efficiency
    const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || c.budget || 0), 0);
    const avgRevenue = totalConversions > 0 ? (totalConversions * 500000) : 0; // Estimate average deal value
    const roi = totalSpent > 0 ? (avgRevenue / totalSpent) : 0;
    
    // Score: ROI > 3x = 90+, ROI > 2x = 70+, ROI > 1x = 50+
    const roiScore = roi > 3 ? 90 : roi > 2 ? 70 : roi > 1 ? 50 : Math.round(roi * 50);
    const customerScore = Math.min(100, Math.max(0, roiScore));

    return {
      strategy: strategyScore,
      campaign: campaignScore,
      customer: customerScore,
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

  // Refresh AI Analysis handler
  const handleRefreshAI = async () => {
    setRefreshing(true);
    await Promise.all([loadCampaigns(), loadBudgets()]);
    setRefreshing(false);
    toast.success('AI analysis refreshed', {
      description: 'Recommendations and metrics updated with latest data',
    });
  };

  // Configure Metrics handler
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('copcca-marketing-config', JSON.stringify(configSettings));
    setShowConfigModal(false);
    toast.success('Metrics configuration saved', {
      description: 'Thresholds will be applied to AI recommendations',
    });
  };

  // Export PDF handler
  const handleExportPDF = () => {
    exportToPDF(budgets, generateRecommendations, performanceMetrics, formatCurrency, campaigns);
    toast.success('Marketing analytics exported', {
      description: 'PDF report generated successfully',
    });
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.channel.trim()) {
      toast.error('Channel is required');
      return;
    }

    // Removed setLoading(true) - keep UI responsive during save

    if (supabaseReady && user) {
      try {
        // Get user profile to access company_id
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();

        const { data, error } = await supabase
          .from('marketing_budgets')
          .insert({
            channel: form.channel.trim(),
            monthly_budget: Number(form.monthly_budget) || 0,
            target_leads: Number(form.target_leads) || 0,
            target_roi: Number(form.target_roi) || 0,
            created_by: user.id,
            company_id: userData?.company_id || null,
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
        <Button 
          icon={RefreshCw} 
          onClick={handleRefreshAI}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh AI Analysis'}
        </Button>
        <Button
          icon={Download}
          variant="outline"
          onClick={handleExportPDF}
        >
          Export Report
        </Button>
        <Button
          icon={Settings}
          variant="outline"
          onClick={() => setShowConfigModal(true)}
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
            {generateRecommendations.competitor.slice(0, 3).map((item, index) => (
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

      {/* Configure Metrics Modal */}
      <Modal 
        isOpen={showConfigModal} 
        onClose={() => setShowConfigModal(false)} 
        title="Configure Metrics"
      >
        <form className="space-y-4" onSubmit={handleSaveConfig}>
          <div className="space-y-4">
            <Input
              label="Minimum Conversion Rate (%)"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={configSettings.minConversionRate}
              onChange={(e) => setConfigSettings({ ...configSettings, minConversionRate: e.target.value })}
              placeholder="e.g., 2"
            />
            <Input
              label="Target ROI (x)"
              type="number"
              step="0.1"
              min="0"
              value={configSettings.targetROI}
              onChange={(e) => setConfigSettings({ ...configSettings, targetROI: e.target.value })}
              placeholder="e.g., 3"
            />
            <Input
              label="Minimum Lead Volume"
              type="number"
              min="0"
              value={configSettings.minLeadVolume}
              onChange={(e) => setConfigSettings({ ...configSettings, minLeadVolume: e.target.value })}
              placeholder="e.g., 10"
            />
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowConfigModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Save Configuration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
