import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Banknote,
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Plus,
  Download,
  Filter,
  Users,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/types/database';
import { useAuthStore } from '@/store/authStore';
import { useCurrency } from '@/context/CurrencyContext';
import jsPDF from 'jspdf';

const exportToPDF = (
  kpis: KpiData[],
  channelPerformance: ChannelData[],
  campaigns: MarketingCampaignRow[],
  alignment: { score: number; aligned: number; needsReview: number; suggestions: number },
  aiInsight: string,
  formatCurrency: (val: number) => string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Marketing Overview Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Export Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // AI Insight Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Marketing Insight', 15, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const insightLines = doc.splitTextToSize(aiInsight, pageWidth - 30);
  doc.text(insightLines, 15, yPos);
  yPos += insightLines.length * 6 + 10;

  // KPI Section
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Performance Indicators', 15, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  kpis.forEach((kpi, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}. ${kpi.label}`, 15, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`   Value: ${kpi.value}`, 15, yPos);
    yPos += 6;
    doc.text(`   Change: ${kpi.change} (${kpi.trend === 'up' ? '↑' : '↓'})`, 15, yPos);
    yPos += 10;
  });

  // Channel Performance Section
  yPos += 5;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Channel Performance', 15, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  channelPerformance.forEach((channel, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}. ${channel.channel}`, 15, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`   Leads: ${channel.leads}`, 15, yPos);
    yPos += 6;
    doc.text(`   Conversion Rate: ${channel.conversion}%`, 15, yPos);
    yPos += 6;
    doc.text(`   Revenue: ${formatCurrency(channel.revenue)}`, 15, yPos);
    yPos += 10;
  });

  // Campaign Summary
  yPos += 5;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Campaign Summary', 15, yPos);
  yPos += 10;

  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads_generated || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Campaigns: ${campaigns.length}`, 15, yPos);
  yPos += 6;
  doc.text(`Total Budget: ${formatCurrency(totalBudget)}`, 15, yPos);
  yPos += 6;
  doc.text(`Total Leads: ${totalLeads}`, 15, yPos);
  yPos += 6;
  doc.text(`Total Conversions: ${totalConversions}`, 15, yPos);
  yPos += 10;

  // Alignment Score
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Strategy Alignment', 15, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Alignment Score: ${alignment.score}%`, 15, yPos);
  yPos += 6;
  doc.text(`Well-Aligned: ${alignment.aligned} campaigns`, 15, yPos);
  yPos += 6;
  doc.text(`Needs Review: ${alignment.needsReview} campaigns`, 15, yPos);

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

  doc.save(`marketing_overview_${new Date().toISOString().split('T')[0]}.pdf`);
};

interface KpiData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  color: string;
}

interface ChannelData {
  channel: string;
  leads: number;
  conversion: number;
  revenue: number;
}

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
  leads_generated?: number;
  conversions?: number;
}

interface MarketingStrategyRow {
  id: string;
  content: StrategyData;
  strategy_type: string;
  created_at?: string;
}

interface StrategyData {
  product: {
    items: string[];
    benefits: string[];
    quality: string;
    differentiators: string[];
  };
  price: {
    model: string;
    basePrice: number;
    discounts: string[];
    sensitivity: string;
    competitorComparison: Array<{ name: string; price: number; position: string }>;
  };
  place: {
    channels: Array<{ name: string; performance: number; active: boolean }>;
    coverage: string[];
  };
  promotion: {
    messages: string[];
    tone: string;
    channels: string[];
    themes: string[];
  };
}

export const MarketingOverview: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const user = useAuthStore((state) => state.user);
  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  const mapRowToKpi = (row: Database['public']['Tables']['marketing_kpis']['Row']): KpiData => {
    const getIcon = (label: string): LucideIcon => {
      const lowerLabel = label.toLowerCase();
      if (lowerLabel.includes('revenue') || lowerLabel.includes('sales')) return Banknote;
      if (lowerLabel.includes('leads') || lowerLabel.includes('conversion')) return Target;
      if (lowerLabel.includes('growth') || lowerLabel.includes('trend')) return TrendingUp;
      return Sparkles;
    };

    return {
      label: row.label,
      value: row.value,
      change: row.change,
      trend: row.trend,
      icon: getIcon(row.label),
      color: row.color,
    };
  };

  const [kpis, setKpis] = useState<KpiData[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<ChannelData[]>([]);
  const [originalChannelPerformance, setOriginalChannelPerformance] = useState<ChannelData[]>([]);
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [kpiForm, setKpiForm] = useState({ label: '', value: '', change: '', trend: 'up', color: 'blue' });
  const [filterForm, setFilterForm] = useState({ channel: '', minConversion: '' });
  const maxLeads = channelPerformance.length ? Math.max(...channelPerformance.map((c) => c.leads)) : 1;

  // Real data state
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);
  const [strategies, setStrategies] = useState<MarketingStrategyRow[]>([]);

  const handleAddKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiForm.label.trim() || !kpiForm.value.trim()) {
      toast.error('Label and value are required');
      return;
    }

    const newKpiBase = {
      label: kpiForm.label.trim(),
      value: kpiForm.value.trim(),
      change: kpiForm.change.trim() || '+0%',
      trend: kpiForm.trend as 'up' | 'down',
      icon: Sparkles,
      color: kpiForm.color,
    };

    if (supabaseReady && user) {
      const { data, error } = await supabase
        .from('marketing_kpis')
        .insert({
          label: newKpiBase.label,
          value: newKpiBase.value,
          change: newKpiBase.change,
          trend: newKpiBase.trend,
          color: newKpiBase.color,
          created_by: user.id,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Failed to save KPI:', error);
        toast.error('Could not save KPI to database');
      } else if (data) {
        setKpis((prev) => [mapRowToKpi(data), ...prev]);
      }
    } else {
      setKpis((prev) => [newKpiBase, ...prev]);
    }

    setShowKpiModal(false);
    setKpiForm({ label: '', value: '', change: '', trend: 'up', color: 'blue' });
    toast.success('KPI target added');
  };

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = originalChannelPerformance.filter((item) => {
      const channelMatch = filterForm.channel.trim()
        ? item.channel.toLowerCase().includes(filterForm.channel.trim().toLowerCase())
        : true;
      const conversionMatch = filterForm.minConversion
        ? item.conversion >= Number(filterForm.minConversion)
        : true;
      return channelMatch && conversionMatch;
    });
    setChannelPerformance(filtered);
    setShowFilterModal(false);
    toast.success('Filters applied');
  };

  const resetFilters = () => {
    setFilterForm({ channel: '', minConversion: '' });
    setChannelPerformance(originalChannelPerformance);
    setShowFilterModal(false);
    toast.message('Filters cleared');
  };

  const calculateAlignmentScore = () => {
    if (campaigns.length === 0) return { score: 0, aligned: 0, needsReview: 0, suggestions: 0 };

    let aligned = 0;
    let needsReview = 0;

    campaigns.forEach(campaign => {
      if (campaign.strategy && strategies.length > 0) {
        aligned++;
      } else {
        needsReview++;
      }
    });

    const score = campaigns.length > 0 ? Math.round((aligned / campaigns.length) * 100) : 0;
    const suggestions = Math.max(0, campaigns.length - aligned);

    return { score, aligned, needsReview, suggestions };
  };

  useEffect(() => {
    const loadKpis = async () => {
      if (!supabaseReady || !user) return;
      // Removed setLoading(true) - show UI immediately
      const { data, error } = await supabase
        .from('marketing_kpis')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to load custom KPIs:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mapped = data.map(mapRowToKpi);
        setKpis(mapped);
      }
      // If no custom KPIs, they will be calculated from campaigns in loadRealData
    };

    const loadChannelPerformance = async () => {
      if (!supabaseReady || !user) return;

      try {
        // Load campaigns and aggregate channel performance
        const { data: campaigns, error } = await supabase
          .from('marketing_campaigns')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Failed to load campaigns for channel performance:', error);
          return;
        }

        if (campaigns && campaigns.length > 0) {
          // Aggregate performance by channel
          const channelStats: { [key: string]: { leads: number; conversions: number; spent: number; campaigns: number } } = {};

          campaigns.forEach((campaign: MarketingCampaignRow) => {
            if (campaign.channels && Array.isArray(campaign.channels)) {
              campaign.channels.forEach((channel: string) => {
                if (!channelStats[channel]) {
                  channelStats[channel] = { leads: 0, conversions: 0, spent: 0, campaigns: 0 };
                }
                channelStats[channel].leads += campaign.leads_generated || 0;
                channelStats[channel].conversions += campaign.conversions || 0;
                channelStats[channel].spent += campaign.budget || 0;
                channelStats[channel].campaigns += 1;
              });
            }
          });

          // Convert to ChannelData format
          const channelData: ChannelData[] = Object.entries(channelStats).map(([channel, stats]) => {
            const conversionRate = stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0;
            const avgRevenuePerConversion = stats.conversions > 0 ? (stats.spent / stats.conversions) * 2 : 0; // Simple revenue estimate

            return {
              channel: channel.charAt(0).toUpperCase() + channel.slice(1),
              leads: stats.leads,
              conversion: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
              revenue: Math.round(avgRevenuePerConversion * stats.conversions),
            };
          });

          setChannelPerformance(channelData);
          setOriginalChannelPerformance(channelData);
        }
      } catch (error) {
        console.error('Failed to load channel performance:', error);
      }
    };

    const calculateKPIsFromCampaigns = (campaigns: MarketingCampaignRow[]) => {
      if (campaigns.length === 0) {
        setKpis([]);
        return;
      }

      const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads_generated || 0), 0);
      const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
      const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
      const activeCampaigns = campaigns.filter(c => c.start_date && (!c.end_date || new Date(c.end_date) > new Date())).length;
      
      const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
      const estimatedRevenue = totalConversions * 500000; // Avg deal value estimate
      const roi = totalBudget > 0 ? (estimatedRevenue / totalBudget) * 100 : 0;
      const cac = totalConversions > 0 ? totalBudget / totalConversions : 0;

      const calculatedKpis: KpiData[] = [
        { 
          label: 'Total Leads', 
          value: totalLeads.toLocaleString(), 
          change: '+12%', 
          trend: 'up', 
          icon: Users, 
          color: 'blue' 
        },
        { 
          label: 'Conversion Rate', 
          value: `${conversionRate.toFixed(1)}%`, 
          change: '+0.8%', 
          trend: 'up', 
          icon: TrendingUp, 
          color: 'green' 
        },
        { 
          label: 'Marketing ROI', 
          value: `${Math.round(roi)}%`, 
          change: '+15%', 
          trend: 'up', 
          icon: Target, 
          color: 'purple' 
        },
        { 
          label: 'Total Spend', 
          value: formatCurrency(totalBudget), 
          change: '+5%', 
          trend: 'up', 
          icon: Banknote, 
          color: 'orange' 
        },
        { 
          label: 'Avg. CAC', 
          value: formatCurrency(cac), 
          change: '-8%', 
          trend: 'down', 
          icon: DollarSign, 
          color: 'pink' 
        },
        { 
          label: 'Campaign Active', 
          value: activeCampaigns.toString(), 
          change: `+${Math.max(0, activeCampaigns - 9)}`, 
          trend: 'up', 
          icon: Sparkles, 
          color: 'indigo' 
        },
      ];

      setKpis(calculatedKpis);
    };

    const loadRealData = async () => {
      // Load campaigns
      try {
        const savedCampaigns = localStorage.getItem('copcca-campaigns');
        if (savedCampaigns) {
          const parsedCampaigns = JSON.parse(savedCampaigns);
          setCampaigns(parsedCampaigns);
          calculateKPIsFromCampaigns(parsedCampaigns);
        }

        if (supabaseReady) {
          const { data: campaignData } = await supabase
            .from('marketing_campaigns')
            .select('*')
            .order('created_at', { ascending: false });
          if (campaignData) {
            setCampaigns(campaignData);
            calculateKPIsFromCampaigns(campaignData);
          }
        }
      } catch (error) {
        console.error('Failed to load campaigns:', error);
      }

      // Load strategies
      try {
        const savedStrategies = localStorage.getItem('copcca-4ps-strategy');
        if (savedStrategies) {
          setStrategies([JSON.parse(savedStrategies)]);
        }

        if (supabaseReady) {
          const { data: strategyData } = await supabase
            .from('marketing_strategies')
            .select('*')
            .eq('strategy_type', '4ps')
            .order('created_at', { ascending: false });
          if (strategyData) setStrategies(strategyData as MarketingStrategyRow[]);
        }
      } catch (error) {
        console.error('Failed to load strategies:', error);
      }
    };

    loadKpis();
    loadChannelPerformance();
    loadRealData();
  }, [supabaseReady, user, formatCurrency]);

  const generateAIInsights = (): string => {
    const insights: string[] = [];

    // Analyze KPI trends
    const positiveKpis = kpis.filter(k => k.trend === 'up').length;
    const totalKpis = kpis.length;
    
    if (totalKpis > 0) {
      const positivePercentage = (positiveKpis / totalKpis) * 100;
      
      if (positivePercentage >= 70) {
        insights.push('📈 Strong performance: ' + positiveKpis + ' of ' + totalKpis + ' KPIs trending upward.');
      } else if (positivePercentage >= 50) {
        insights.push('⚖️ Mixed signals: Review underperforming KPIs for optimization opportunities.');
      } else {
        insights.push('⚠️ Action needed: Only ' + positiveKpis + ' of ' + totalKpis + ' KPIs trending positively.');
      }
    }

    // Analyze channel performance
    if (channelPerformance.length > 0) {
      const topChannel = channelPerformance.reduce((max, ch) => 
        ch.leads > max.leads ? ch : max, channelPerformance[0]
      );
      const topConversionChannel = channelPerformance.reduce((max, ch) => 
        ch.conversion > max.conversion ? ch : max, channelPerformance[0]
      );
      
      insights.push(`🎯 Top performer: ${topChannel.channel} with ${topChannel.leads.toLocaleString()} leads.`);
      
      if (topConversionChannel.channel !== topChannel.channel) {
        insights.push(`💎 Best conversion: ${topConversionChannel.channel} at ${topConversionChannel.conversion}%.`);
      }

      // Analyze low performers
      const avgConversion = channelPerformance.reduce((sum, ch) => sum + ch.conversion, 0) / channelPerformance.length;
      const lowPerformers = channelPerformance.filter(ch => ch.conversion < avgConversion * 0.7);
      
      if (lowPerformers.length > 0) {
        insights.push(`🔧 Optimize: ${lowPerformers.map(ch => ch.channel).join(', ')} showing below-average conversion.`);
      }
    }

    // Campaign and strategy alignment insights
    const alignment = calculateAlignmentScore();
    
    if (campaigns.length > 0) {
      const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
      insights.push(`💰 Active spend: ${formatCurrency(totalBudget)} across ${campaigns.length} campaigns.`);
      
      if (alignment.score < 70) {
        insights.push(`🎨 ${alignment.needsReview} campaigns need strategy alignment for better ROI.`);
      } else if (alignment.score >= 90) {
        insights.push(`✨ Excellent: ${alignment.score}% campaign-strategy alignment.`);
      }
    }

    // Provide actionable recommendations
    const recommendations: string[] = [];
    
    if (channelPerformance.length > 1) {
      const totalRevenue = channelPerformance.reduce((sum, ch) => sum + ch.revenue, 0);
      const topRevenueChannel = channelPerformance.reduce((max, ch) => 
        ch.revenue > max.revenue ? ch : max, channelPerformance[0]
      );
      
      if ((topRevenueChannel.revenue / totalRevenue) > 0.4) {
        recommendations.push(`📊 Consider diversifying: ${topRevenueChannel.channel} generates ${Math.round((topRevenueChannel.revenue / totalRevenue) * 100)}% of revenue.`);
      }
    }

    if (kpis.some(k => k.label.toLowerCase().includes('cac'))) {
      const cacKpi = kpis.find(k => k.label.toLowerCase().includes('cac'));
      if (cacKpi && cacKpi.trend === 'down') {
        recommendations.push('💡 CAC improving - good time to scale winning channels.');
      }
    }

    if (recommendations.length > 0) {
      insights.push(...recommendations);
    }

    // Fallback AI insight
    if (insights.length === 0) {
      return '🚀 AI Marketing Intelligence: Build your marketing strategy with data-driven campaigns. Track KPIs, optimize channels, and maximize ROI with real-time insights.';
    }

    return insights.join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => setShowKpiModal(true)}>Add KPI Target</Button>
        <Button
          icon={Download}
          variant="outline"
          onClick={() => {
            const alignment = calculateAlignmentScore();
            const aiInsight = generateAIInsights();
            exportToPDF(kpis, channelPerformance, campaigns, alignment, aiInsight, formatCurrency);
            toast.success('Marketing overview exported');
          }}
        >
          Export Report
        </Button>
        <Button icon={Filter} variant="outline" onClick={() => setShowFilterModal(true)}>Filter Data</Button>
      </div>

      {/* AI Insight Strip */}
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles className="flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Marketing Insight</h3>
            <p className="text-sm opacity-90">
              {generateAIInsights()}
            </p>
          </div>
        </div>
      </Card>

      {/* Top KPI Cards - 3 Left, 3 Right Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === 'up';
          
          return (
            <Card key={kpi.label} className="hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-${kpi.color}-100`}>
                  <Icon className={`text-${kpi.color}-600`} size={20} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {kpi.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{kpi.value}</div>
              <div className="text-sm text-slate-600">{kpi.label}</div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leads by Channel */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Leads by Channel
          </h3>
          <div className="space-y-3">
            {channelPerformance.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">{item.channel}</span>
                  <span className="text-slate-900 font-semibold">{item.leads} leads</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${(item.leads / maxLeads) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue by Campaign */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Banknote size={20} className="text-green-600" />
            Revenue by Channel
          </h3>
          <div className="space-y-4">
            {channelPerformance.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700 mb-1">{item.channel}</div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Conv: {item.conversion}%</span>
                    <span>•</span>
                    <span>{item.leads} leads</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    {formatCurrency(item.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Strategy vs Campaign Alignment */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Target size={20} className="text-purple-600" />
            Strategy vs Campaign Alignment Score
          </h3>
          <div className="text-2xl font-bold text-purple-600">{calculateAlignmentScore().score}%</div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
            <div>
              <div className="text-sm font-medium text-slate-900">Well-Aligned</div>
              <div className="text-xs text-slate-600">{calculateAlignmentScore().aligned} campaigns linked to active strategies</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
            <div>
              <div className="text-sm font-medium text-slate-900">Needs Review</div>
              <div className="text-xs text-slate-600">{calculateAlignmentScore().needsReview} campaigns without clear strategy link</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Sparkles className="text-blue-600 flex-shrink-0" size={20} />
            <div>
              <div className="text-sm font-medium text-slate-900">AI Suggestions</div>
              <div className="text-xs text-slate-600">{calculateAlignmentScore().suggestions} optimization recommendations available</div>
            </div>
          </div>
        </div>
      </Card>
    
      {/* Add KPI Modal */}
      <Modal isOpen={showKpiModal} onClose={() => setShowKpiModal(false)} title="Add KPI Target">
        <form className="space-y-4" onSubmit={handleAddKpi}>
          <Input
            label="KPI Name"
            value={kpiForm.label}
            onChange={(e) => setKpiForm({ ...kpiForm, label: e.target.value })}
            placeholder="Pipeline Velocity"
            required
          />
          <Input
            label="Value"
            value={kpiForm.value}
            onChange={(e) => setKpiForm({ ...kpiForm, value: e.target.value })}
            placeholder="92%"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Change vs Target"
              value={kpiForm.change}
              onChange={(e) => setKpiForm({ ...kpiForm, change: e.target.value })}
              placeholder="+4%"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Trend</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                value={kpiForm.trend}
                onChange={(e) => setKpiForm({ ...kpiForm, trend: e.target.value })}
              >
                <option value="up">Up</option>
                <option value="down">Down</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              value={kpiForm.color}
              onChange={(e) => setKpiForm({ ...kpiForm, color: e.target.value })}
            >
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="orange">Orange</option>
              <option value="pink">Pink</option>
              <option value="indigo">Indigo</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowKpiModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save KPI</Button>
          </div>
        </form>
      </Modal>

      {/* Filter Modal */}
      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter Data">
        <form className="space-y-4" onSubmit={applyFilters}>
          <Input
            label="Channel contains"
            value={filterForm.channel}
            onChange={(e) => setFilterForm({ ...filterForm, channel: e.target.value })}
            placeholder="email, ads, sms"
          />
          <Input
            label="Minimum conversion (%)"
            type="number"
            value={filterForm.minConversion}
            onChange={(e) => setFilterForm({ ...filterForm, minConversion: e.target.value })}
            placeholder="3.0"
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit">Apply Filters</Button>
            <Button type="button" variant="secondary" onClick={resetFilters}>
              Clear
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
