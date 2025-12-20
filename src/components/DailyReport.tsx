import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, 
  ShoppingBag, BarChart3, Target, Megaphone, DollarSign, 
  Sparkles, RefreshCw, Download, Calendar, ArrowRight,
  Activity, UserCheck, Clock, Zap
} from 'lucide-react';
import { useCurrency } from '../lib/currency-context';

interface DailyReportProps {
  afterSalesData: any[];
  kpiData: any[];
  competitorsData: any[];
  salesData: any[];
  debtData: any[];
  tasksData: any[];
  isRefreshing: boolean;
  onRefresh: () => void;
}

interface AIInsight {
  type: 'success' | 'warning' | 'danger' | 'info';
  category: string;
  icon: any;
  title: string;
  description: string;
  recommendation: string;
  metrics?: { label: string; value: string }[];
}

export function DailyReport({
  afterSalesData,
  kpiData,
  competitorsData,
  salesData,
  debtData,
  tasksData,
  isRefreshing,
  onRefresh,
}: DailyReportProps) {
  const { currencySymbol } = useCurrency();
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  // Generate comprehensive AI insights
  const aiInsights = useMemo((): AIInsight[] => {
    const insights: AIInsight[] = [];
    const today = new Date();
    const todayStr = today.toDateString();

    // ============= AFTER-SALES ANALYSIS =============
    if (afterSalesData.length > 0) {
      const avgPerformance = afterSalesData.reduce((sum, item) => sum + (item.salesPerformance || 0), 0) / afterSalesData.length;
      const lowPerformance = afterSalesData.filter(item => (item.salesPerformance || 0) < 50);
      const highPerformance = afterSalesData.filter(item => (item.salesPerformance || 0) >= 80);
      const urgentFollowUps = afterSalesData.filter(item => item.priority === 'High' && item.status !== 'completed');

      if (avgPerformance < 60) {
        insights.push({
          type: 'warning',
          category: 'After-Sales Follow-up',
          icon: ShoppingBag,
          title: 'Below Average After-Sales Performance',
          description: `Current average performance is ${avgPerformance.toFixed(1)}%, which is below the 60% target threshold.`,
          recommendation: `Focus on ${lowPerformance.length} underperforming accounts. Consider increasing follow-up frequency and personalizing engagement strategies.`,
          metrics: [
            { label: 'Avg Performance', value: `${avgPerformance.toFixed(1)}%` },
            { label: 'Low Performers', value: `${lowPerformance.length}` },
            { label: 'Urgent Follow-ups', value: `${urgentFollowUps.length}` },
          ],
        });
      } else {
        insights.push({
          type: 'success',
          category: 'After-Sales Follow-up',
          icon: ShoppingBag,
          title: 'Strong After-Sales Performance',
          description: `Excellent work! Average performance is ${avgPerformance.toFixed(1)}% with ${highPerformance.length} high performers.`,
          recommendation: `Maintain momentum by replicating successful strategies from top performers. Document best practices for team training.`,
          metrics: [
            { label: 'Avg Performance', value: `${avgPerformance.toFixed(1)}%` },
            { label: 'High Performers', value: `${highPerformance.length}` },
            { label: 'Total Accounts', value: `${afterSalesData.length}` },
          ],
        });
      }
    } else {
      insights.push({
        type: 'info',
        category: 'After-Sales Follow-up',
        icon: ShoppingBag,
        title: 'No After-Sales Data',
        description: 'Start tracking your customer follow-up activities to improve retention.',
        recommendation: 'Add customer accounts and begin monitoring follow-up performance to prevent churn.',
      });
    }

    // ============= KPI TRACKING ANALYSIS =============
    if (kpiData.length > 0) {
      const targetsMet = kpiData.filter(k => (k.actualValue || 0) >= (k.targetValue || 0)).length;
      const achievementRate = (targetsMet / kpiData.length) * 100;
      const trendingDown = kpiData.filter(k => k.trend === 'down').length;
      const criticalKPIs = kpiData.filter(k => {
        const achievement = ((k.actualValue || 0) / (k.targetValue || 1)) * 100;
        return achievement < 70;
      });

      if (achievementRate < 50) {
        insights.push({
          type: 'danger',
          category: 'KPI Tracking',
          icon: BarChart3,
          title: 'Critical: Low KPI Achievement Rate',
          description: `Only ${achievementRate.toFixed(0)}% of targets are being met (${targetsMet}/${kpiData.length} KPIs). ${trendingDown} metrics trending downward.`,
          recommendation: `Immediate action required. Review ${criticalKPIs.length} underperforming KPIs. Reassess targets for realism and implement corrective action plans.`,
          metrics: [
            { label: 'Achievement Rate', value: `${achievementRate.toFixed(0)}%` },
            { label: 'Targets Met', value: `${targetsMet}/${kpiData.length}` },
            { label: 'Trending Down', value: `${trendingDown}` },
          ],
        });
      } else if (achievementRate >= 80) {
        insights.push({
          type: 'success',
          category: 'KPI Tracking',
          icon: BarChart3,
          title: 'Excellent KPI Performance',
          description: `Outstanding achievement rate of ${achievementRate.toFixed(0)}%! ${targetsMet} out of ${kpiData.length} targets met.`,
          recommendation: `Consider raising targets for consistently exceeded KPIs to maintain growth momentum. Celebrate and share success factors with the team.`,
          metrics: [
            { label: 'Achievement Rate', value: `${achievementRate.toFixed(0)}%` },
            { label: 'Targets Met', value: `${targetsMet}/${kpiData.length}` },
            { label: 'Trending Up', value: `${kpiData.filter(k => k.trend === 'up').length}` },
          ],
        });
      } else {
        insights.push({
          type: 'warning',
          category: 'KPI Tracking',
          icon: BarChart3,
          title: 'Moderate KPI Achievement',
          description: `Achievement rate is ${achievementRate.toFixed(0)}% - room for improvement exists.`,
          recommendation: `Focus on the ${criticalKPIs.length} underperforming KPIs. Identify blockers and allocate resources to critical areas.`,
          metrics: [
            { label: 'Achievement Rate', value: `${achievementRate.toFixed(0)}%` },
            { label: 'Need Attention', value: `${criticalKPIs.length}` },
          ],
        });
      }
    }

    // ============= COMPETITOR INTELLIGENCE ANALYSIS =============
    if (competitorsData.length > 0) {
      const strongCompetitors = competitorsData.filter(c => c.strength === 'Strong').length;
      const totalProducts = competitorsData.reduce((sum, c) => sum + (c.products || 0), 0);
      const avgMarketShare = competitorsData.reduce((sum, c) => sum + (c.marketShare || 0), 0) / competitorsData.length;

      if (strongCompetitors >= competitorsData.length * 0.5) {
        insights.push({
          type: 'warning',
          category: 'Competitors Information',
          icon: TrendingUp,
          title: 'High Competitive Pressure',
          description: `${strongCompetitors} out of ${competitorsData.length} competitors are categorized as "Strong".`,
          recommendation: `Develop differentiation strategies. Focus on unique value propositions and consider niche market opportunities to avoid direct competition.`,
          metrics: [
            { label: 'Strong Competitors', value: `${strongCompetitors}` },
            { label: 'Products Tracked', value: `${totalProducts}` },
            { label: 'Avg Market Share', value: `${avgMarketShare.toFixed(1)}%` },
          ],
        });
      } else {
        insights.push({
          type: 'info',
          category: 'Competitors Information',
          icon: TrendingUp,
          title: 'Competitive Landscape Monitored',
          description: `Tracking ${competitorsData.length} competitors with ${totalProducts} products in the market.`,
          recommendation: `Continue monitoring competitor activities. Look for gaps in their offerings that you can exploit as opportunities.`,
          metrics: [
            { label: 'Competitors', value: `${competitorsData.length}` },
            { label: 'Products', value: `${totalProducts}` },
          ],
        });
      }
    }

    // ============= SALES STRATEGIES ANALYSIS =============
    const salesStrategies = salesData.filter(s => s.type === 'sales');
    if (salesStrategies.length > 0) {
      const activeStrategies = salesStrategies.filter(s => s.status === 'active').length;
      const highPriority = salesStrategies.filter(s => s.priority === 'High').length;
      const completedStrategies = salesStrategies.filter(s => s.status === 'completed').length;

      insights.push({
        type: activeStrategies > 0 ? 'success' : 'warning',
        category: 'Sales Strategies',
        icon: Target,
        title: `${activeStrategies} Active Sales Strategies`,
        description: `Currently executing ${activeStrategies} strategies with ${highPriority} marked as high priority.`,
        recommendation: activeStrategies === 0 
          ? 'Activate or create new sales strategies to drive revenue growth.'
          : `Ensure ${highPriority} high-priority strategies have adequate resources. Review and optimize based on performance data.`,
        metrics: [
          { label: 'Active', value: `${activeStrategies}` },
          { label: 'High Priority', value: `${highPriority}` },
          { label: 'Completed', value: `${completedStrategies}` },
        ],
      });
    }

    // ============= MARKETING STRATEGIES ANALYSIS =============
    const marketingStrategies = salesData.filter(s => s.type === 'marketing');
    if (marketingStrategies.length > 0) {
      const activeCampaigns = marketingStrategies.filter(s => s.status === 'active').length;
      const highPriority = marketingStrategies.filter(s => s.priority === 'High').length;

      insights.push({
        type: activeCampaigns > 0 ? 'info' : 'warning',
        category: 'Marketing Strategies',
        icon: Megaphone,
        title: `${activeCampaigns} Active Marketing Campaigns`,
        description: `Running ${activeCampaigns} campaigns with ${highPriority} high-priority initiatives.`,
        recommendation: activeCampaigns === 0
          ? 'Launch marketing campaigns to increase brand visibility and generate leads.'
          : `Track campaign performance metrics. A/B test messaging and channels for optimization.`,
        metrics: [
          { label: 'Active Campaigns', value: `${activeCampaigns}` },
          { label: 'High Priority', value: `${highPriority}` },
        ],
      });
    }

    // ============= DEBT COLLECTION ANALYSIS =============
    if (debtData.length > 0) {
      const totalDebt = debtData.reduce((sum, d) => sum + (d.amount || 0), 0);
      const overdueAccounts = debtData.filter(d => {
        const dueDate = new Date(d.dueDate);
        return dueDate < today && d.status !== 'paid';
      }).length;
      const avgDebt = totalDebt / debtData.length;
      const highValueDebts = debtData.filter(d => (d.amount || 0) > avgDebt * 2).length;

      if (overdueAccounts > debtData.length * 0.3) {
        insights.push({
          type: 'danger',
          category: 'Debt Collection',
          icon: DollarSign,
          title: 'Critical: High Overdue Accounts',
          description: `${overdueAccounts} accounts are overdue (${((overdueAccounts/debtData.length)*100).toFixed(0)}%). Total outstanding: ${currencySymbol}${totalDebt.toLocaleString()}.`,
          recommendation: `Urgent collection efforts needed. Prioritize ${highValueDebts} high-value accounts. Consider payment plans and legal action for severely overdue accounts.`,
          metrics: [
            { label: 'Total Outstanding', value: `${currencySymbol}${totalDebt.toLocaleString()}` },
            { label: 'Overdue Accounts', value: `${overdueAccounts}` },
            { label: 'High Value', value: `${highValueDebts}` },
          ],
        });
      } else {
        insights.push({
          type: 'warning',
          category: 'Debt Collection',
          icon: DollarSign,
          title: 'Debt Collection Status',
          description: `${debtData.length} accounts with ${currencySymbol}${totalDebt.toLocaleString()} outstanding. ${overdueAccounts} overdue.`,
          recommendation: `Maintain proactive communication with debtors. Send reminders before due dates and offer flexible payment options.`,
          metrics: [
            { label: 'Total Outstanding', value: `${currencySymbol}${totalDebt.toLocaleString()}` },
            { label: 'Accounts', value: `${debtData.length}` },
            { label: 'Overdue', value: `${overdueAccounts}` },
          ],
        });
      }
    }

    // ============= TASK MANAGEMENT ANALYSIS =============
    if (tasksData.length > 0) {
      const completedTasks = tasksData.filter(t => t.status === 'completed').length;
      const inProgressTasks = tasksData.filter(t => t.status === 'in_progress').length;
      const overdueTasks = tasksData.filter(t => {
        const dueDate = new Date(t.dueDate);
        return dueDate < today && t.status !== 'completed';
      }).length;
      const completionRate = (completedTasks / tasksData.length) * 100;

      if (overdueTasks > tasksData.length * 0.2) {
        insights.push({
          type: 'warning',
          category: 'Task Management',
          icon: CheckCircle2,
          title: 'Task Completion Issues',
          description: `${overdueTasks} tasks are overdue. Completion rate: ${completionRate.toFixed(0)}%.`,
          recommendation: `Review task assignments and deadlines. Consider redistributing workload or extending deadlines where necessary. Remove blockers preventing completion.`,
          metrics: [
            { label: 'Completed', value: `${completedTasks}/${tasksData.length}` },
            { label: 'Overdue', value: `${overdueTasks}` },
            { label: 'In Progress', value: `${inProgressTasks}` },
          ],
        });
      } else {
        insights.push({
          type: 'success',
          category: 'Task Management',
          icon: CheckCircle2,
          title: 'Good Task Progress',
          description: `${completionRate.toFixed(0)}% completion rate with ${inProgressTasks} tasks in progress.`,
          recommendation: `Keep up the momentum. Ensure completed tasks lead to measurable business outcomes. Review and optimize task assignment processes.`,
          metrics: [
            { label: 'Completion Rate', value: `${completionRate.toFixed(0)}%` },
            { label: 'Active', value: `${inProgressTasks}` },
          ],
        });
      }
    }

    return insights;
  }, [afterSalesData, kpiData, competitorsData, salesData, debtData, tasksData, currencySymbol]);

  const categories = useMemo(() => {
    return ['All', ...new Set(aiInsights.map(i => i.category))];
  }, [aiInsights]);

  const filteredInsights = useMemo(() => {
    return selectedFilter === 'All'
      ? aiInsights
      : aiInsights.filter(i => i.category === selectedFilter);
  }, [aiInsights, selectedFilter]);

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'success':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-700',
        };
      case 'warning':
        return {
          border: 'border-yellow-200',
          bg: 'bg-yellow-50',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-700',
        };
      case 'danger':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-700',
        };
      default:
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700',
        };
    }
  };

  // Calculate summary metrics
  const summary = useMemo(() => {
    const criticalInsights = aiInsights.filter(i => i.type === 'danger').length;
    const warningInsights = aiInsights.filter(i => i.type === 'warning').length;
    const successInsights = aiInsights.filter(i => i.type === 'success').length;
    
    return {
      total: aiInsights.length,
      critical: criticalInsights,
      warning: warningInsights,
      success: successInsights,
      actionable: criticalInsights + warningInsights,
    };
  }, [aiInsights]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-2xl">DAILY ANALYTICAL REPORT</h2>
                <p className="text-sm text-white/80 flex items-center gap-2 mt-1">
                  <Calendar size={14} />
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <p className="text-white/90 text-sm max-w-2xl">
              Comprehensive analysis of your business data with AI-generated insights and actionable recommendations across all modules.
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="ml-4 p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm disabled:opacity-50"
            title="Refresh Report"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl mb-1">{summary.total}</div>
            <div className="text-xs text-white/80">Total Insights</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl mb-1">{summary.success}</div>
            <div className="text-xs text-white/80 flex items-center gap-1">
              <CheckCircle2 size={12} /> Positive
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl mb-1">{summary.warning}</div>
            <div className="text-xs text-white/80 flex items-center gap-1">
              <AlertCircle size={12} /> Warnings
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl mb-1">{summary.critical}</div>
            <div className="text-xs text-white/80 flex items-center gap-1">
              <Zap size={12} /> Critical
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl mb-1">{summary.actionable}</div>
            <div className="text-xs text-white/80 flex items-center gap-1">
              <Activity size={12} /> Need Action
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <span className="text-sm text-gray-600 whitespace-nowrap">Filter by:</span>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedFilter(category)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              selectedFilter === category
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Insights Grid */}
      {filteredInsights.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <FileText size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No data available yet</p>
          <p className="text-sm text-gray-400">Start adding data to your modules to see AI-powered insights</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInsights.map((insight, index) => {
            const Icon = insight.icon;
            const style = getInsightStyle(insight.type);
            
            return (
              <div
                key={index}
                className={`border-2 ${style.border} ${style.bg} rounded-xl p-6 transition-all hover:shadow-lg`}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 bg-white rounded-lg ${style.icon}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-medium text-lg">{insight.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs ${style.badge} whitespace-nowrap`}>
                        {insight.category}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                {insight.metrics && insight.metrics.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-4 bg-white rounded-lg p-3">
                    {insight.metrics.map((metric, idx) => (
                      <div key={idx} className="text-center">
                        <div className="text-lg font-medium text-gray-900">{metric.value}</div>
                        <div className="text-xs text-gray-500">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendation */}
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-purple-600 mb-1">AI Recommendation</p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Report generated by AI</span> • Last updated: {new Date().toLocaleTimeString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              This report analyzes data across all your business modules to provide actionable insights.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity">
            <Download size={16} />
            <span className="text-sm">Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
