import React, { useState, useMemo } from 'react';
import { FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowLeft, Download, Calendar, Sparkles, RefreshCw, BarChart3, Target, UserCheck, DollarSign, Package, Award, ListTodo } from 'lucide-react';
import { useTeamData } from '../lib/useTeamData';
import { useCurrency } from '../lib/currency-context';
import { formatName } from '../lib/utils';
import { generateReportContent } from '../lib/report-generator';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

interface AnalyticalMetrics {
  afterSales: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    avgSatisfaction: number;
    totalRevenue: number;
    change: number;
  };
  kpi: {
    total: number;
    achieved: number;
    onTrack: number;
    atRisk: number;
    avgProgress: number;
    change: number;
  };
  competitors: {
    total: number;
    tracked: number;
    threats: number;
    opportunities: number;
    avgPrice: number;
    change: number;
  };
  sales: {
    total: number;
    active: number;
    completed: number;
    pending: number;
    avgEffectiveness: number;
    change: number;
  };
  debt: {
    total: number;
    totalAmount: number;
    overdue: number;
    overdueAmount: number;
    collected: number;
    collectedAmount: number;
    collectionRate: number;
    change: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    completionRate: number;
    change: number;
  };
}

export function AnalyticalReports() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [isGenerating, setIsGenerating] = useState(false);
  const { 
    afterSalesData, 
    kpiData, 
    competitorsData, 
    salesData, 
    debtData,
    tasksData,
    loading 
  } = useTeamData();
  const { currency, currencySymbol } = useCurrency();

  // Calculate comprehensive metrics
  const metrics: AnalyticalMetrics = useMemo(() => {
    // After-Sales Metrics
    const asCompleted = afterSalesData.filter(item => item.status === 'completed').length;
    const asInProgress = afterSalesData.filter(item => item.status === 'in_progress').length;
    const asPending = afterSalesData.filter(item => item.status === 'pending').length;
    const asRevenue = afterSalesData.reduce((sum, item) => sum + (item.orderValue || 0), 0);
    const asSatisfaction = afterSalesData.filter(item => item.satisfactionRating).length > 0
      ? afterSalesData.reduce((sum, item) => sum + (item.satisfactionRating || 0), 0) / afterSalesData.filter(item => item.satisfactionRating).length
      : 0;

    // KPI Metrics
    const kpiAchieved = kpiData.filter(item => item.status === 'achieved').length;
    const kpiOnTrack = kpiData.filter(item => item.status === 'on_track').length;
    const kpiAtRisk = kpiData.filter(item => item.status === 'at_risk').length;
    const kpiProgress = kpiData.length > 0
      ? kpiData.reduce((sum, item) => sum + (item.progress || 0), 0) / kpiData.length
      : 0;

    // Competitors Metrics
    const compTracked = competitorsData.filter(item => item.status === 'active').length;
    const compThreats = competitorsData.filter(item => item.threatLevel === 'high').length;
    const compOpportunities = competitorsData.filter(item => item.marketPosition === 'weak').length;
    const compAvgPrice = competitorsData.length > 0
      ? competitorsData.reduce((sum, item) => sum + (item.price || 0), 0) / competitorsData.length
      : 0;

    // Sales Metrics
    const salesActive = salesData.filter(item => item.status === 'active').length;
    const salesCompleted = salesData.filter(item => item.status === 'completed').length;
    const salesPending = salesData.filter(item => item.status === 'pending').length;
    const salesEffectiveness = salesData.length > 0
      ? salesData.reduce((sum, item) => sum + (item.effectiveness || 0), 0) / salesData.length
      : 0;

    // Debt Metrics
    const debtOverdue = debtData.filter(item => item.status === 'overdue').length;
    const debtTotal = debtData.reduce((sum, item) => sum + item.amount, 0);
    const debtOverdueAmount = debtData.filter(item => item.status === 'overdue').reduce((sum, item) => sum + item.amount, 0);
    const debtCollected = debtData.filter(item => item.status === 'paid').length;
    const debtCollectedAmount = debtData.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);
    const collectionRate = debtTotal > 0 ? (debtCollectedAmount / debtTotal) * 100 : 0;

    // Task Management Metrics
    const taskCompleted = tasksData.filter(item => item.status === 'completed').length;
    const taskInProgress = tasksData.filter(item => item.status === 'in_progress').length;
    const taskPending = tasksData.filter(item => item.status === 'pending').length;
    const taskOverdue = tasksData.filter(item => {
      if (item.dueDate && item.status !== 'completed') {
        return new Date(item.dueDate) < new Date();
      }
      return false;
    }).length;
    const taskCompletionRate = tasksData.length > 0 ? (taskCompleted / tasksData.length) * 100 : 0;

    return {
      afterSales: {
        total: afterSalesData.length,
        completed: asCompleted,
        inProgress: asInProgress,
        pending: asPending,
        avgSatisfaction: asSatisfaction,
        totalRevenue: asRevenue,
        change: 5.2, // Simulated
      },
      kpi: {
        total: kpiData.length,
        achieved: kpiAchieved,
        onTrack: kpiOnTrack,
        atRisk: kpiAtRisk,
        avgProgress: kpiProgress,
        change: 3.8, // Simulated
      },
      competitors: {
        total: competitorsData.length,
        tracked: compTracked,
        threats: compThreats,
        opportunities: compOpportunities,
        avgPrice: compAvgPrice,
        change: 2.1, // Simulated
      },
      sales: {
        total: salesData.length,
        active: salesActive,
        completed: salesCompleted,
        pending: salesPending,
        avgEffectiveness: salesEffectiveness,
        change: 4.5, // Simulated
      },
      debt: {
        total: debtData.length,
        totalAmount: debtTotal,
        overdue: debtOverdue,
        overdueAmount: debtOverdueAmount,
        collected: debtCollected,
        collectedAmount: debtCollectedAmount,
        collectionRate: collectionRate,
        change: -7.3, // Negative is good for debt reduction
      },
      tasks: {
        total: tasksData.length,
        completed: taskCompleted,
        inProgress: taskInProgress,
        pending: taskPending,
        overdue: taskOverdue,
        completionRate: taskCompletionRate,
        change: 6.4, // Simulated
      },
    };
  }, [afterSalesData, kpiData, competitorsData, salesData, debtData, tasksData]);

  const getReportConfig = (type: ReportType) => {
    const configs = {
      daily: {
        title: 'DAILY ANALYTICAL REPORT',
        subtitle: 'Last 24 Hours Performance Update',
        period: 'Today',
        icon: Calendar,
      },
      weekly: {
        title: 'WEEKLY ANALYTICAL REPORT',
        subtitle: 'Past 7 Days Performance Summary',
        period: 'This Week',
        icon: BarChart3,
      },
      monthly: {
        title: 'MONTHLY ANALYTICAL REPORT',
        subtitle: 'This Month Business Performance Analysis',
        period: 'This Month',
        icon: TrendingUp,
      },
      quarterly: {
        title: 'QUARTERLY ANALYTICAL REPORT',
        subtitle: 'Q4 2025 Comprehensive Business Review',
        period: 'This Quarter',
        icon: Target,
      },
      annual: {
        title: 'ANNUAL ANALYTICAL REPORT',
        subtitle: '2025 Full Year Performance & Strategic Insights',
        period: 'This Year',
        icon: Award,
      },
    };
    return configs[type];
  };

  const generateReport = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1500);
  };

  const downloadReport = () => {
    const config = getReportConfig(reportType);
    const date = new Date().toLocaleDateString();
    
    const reportContent = generateReportContent(metrics, reportType, config, currencySymbol);
    
    /* OLD VERSION - Replaced with helper function
    let reportContent = `📌 ${config.title} — AI INSIGHT GENERATED\n\n`;
    reportContent += `⚠️ Report Notice:\n`;
    reportContent += `This report is automatically generated using the AI Insight Analytical System, based on real-time operational, financial, and customer data collected across all modules.\n\n`;
    reportContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    reportContent += `1. REPORT OVERVIEW\n\n`;
    reportContent += `Date: ${date}\n`;
    reportContent += `Generated By: AI Insight System - Pocket CRM\n`;
    reportContent += `Period: ${config.period}\n`;
    reportContent += `Purpose: Provide ${reportType} performance updates, issues, and recommended actions.\n\n`;
    reportContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    reportContent += `2. EXECUTIVE SUMMARY\n\n`;
    reportContent += `Total Active Items: ${metrics.afterSales.total + metrics.kpi.total + metrics.sales.total + metrics.debt.total}\n`;
    reportContent += `Overall System Health: ${metrics.kpi.avgProgress.toFixed(1)}%\n`;
    reportContent += `Customer Satisfaction: ${(metrics.afterSales.avgSatisfaction * 20).toFixed(0)}%\n`;
    reportContent += `Collection Rate: ${metrics.debt.collectionRate.toFixed(1)}%\n\n`;
    reportContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    reportContent += `3. MODULE PERFORMANCE ANALYSIS\n\n`;
    
    reportContent += `3.1 AFTER-SALES FOLLOW-UP\n\n`;
    reportContent += `• Total Orders: ${metrics.afterSales.total}\n`;
    reportContent += `• Completed: ${metrics.afterSales.completed} (${((metrics.afterSales.completed/metrics.afterSales.total)*100).toFixed(1)}%)\n`;
    reportContent += `• In Progress: ${metrics.afterSales.inProgress}\n`;
    reportContent += `• Pending: ${metrics.afterSales.pending}\n`;
    reportContent += `• Average Satisfaction: ${metrics.afterSales.avgSatisfaction.toFixed(1)}/5.0\n`;
    reportContent += `• Total Revenue Tracked: ${currencySymbol}${metrics.afterSales.totalRevenue.toLocaleString()}\n`;
    reportContent += `• Performance Change: ${metrics.afterSales.change > 0 ? '+' : ''}${metrics.afterSales.change}%\n\n`;
    
    reportContent += `3.2 KPI TRACKING\n\n`;
    reportContent += `• Total KPIs: ${metrics.kpi.total}\n`;
    reportContent += `• Achieved: ${metrics.kpi.achieved} ✅\n`;
    reportContent += `• On Track: ${metrics.kpi.onTrack} 🟡\n`;
    reportContent += `• At Risk: ${metrics.kpi.atRisk} ⚠️\n`;
    reportContent += `• Average Progress: ${metrics.kpi.avgProgress.toFixed(1)}%\n`;
    reportContent += `• Performance Change: ${metrics.kpi.change > 0 ? '+' : ''}${metrics.kpi.change}%\n\n`;
    
    reportContent += `3.3 COMPETITOR INTELLIGENCE\n\n`;
    reportContent += `• Total Competitors Tracked: ${metrics.competitors.total}\n`;
    reportContent += `• Active Monitoring: ${metrics.competitors.tracked}\n`;
    reportContent += `• High Threats: ${metrics.competitors.threats}\n`;
    reportContent += `• Market Opportunities: ${metrics.competitors.opportunities}\n`;
    reportContent += `• Average Competitor Price: ${currencySymbol}${metrics.competitors.avgPrice.toLocaleString()}\n`;
    reportContent += `• Data Change: ${metrics.competitors.change > 0 ? '+' : ''}${metrics.competitors.change}%\n\n`;
    
    reportContent += `3.4 SALES & MARKETING STRATEGIES\n\n`;
    reportContent += `• Total Strategies: ${metrics.sales.total}\n`;
    reportContent += `• Active: ${metrics.sales.active}\n`;
    reportContent += `• Completed: ${metrics.sales.completed}\n`;
    reportContent += `• Pending: ${metrics.sales.pending}\n`;
    reportContent += `• Average Effectiveness: ${metrics.sales.avgEffectiveness.toFixed(1)}%\n`;
    reportContent += `• Performance Change: ${metrics.sales.change > 0 ? '+' : ''}${metrics.sales.change}%\n\n`;
    
    reportContent += `3.5 DEBT COLLECTION\n\n`;
    reportContent += `• Total Outstanding: ${metrics.debt.total} accounts\n`;
    reportContent += `• Total Amount: ${currencySymbol}${metrics.debt.totalAmount.toLocaleString()}\n`;
    reportContent += `• Overdue Accounts: ${metrics.debt.overdue}\n`;
    reportContent += `• Overdue Amount: ${currencySymbol}${metrics.debt.overdueAmount.toLocaleString()}\n`;
    reportContent += `• Collected: ${metrics.debt.collected} accounts\n`;
    reportContent += `• Collected Amount: ${currencySymbol}${metrics.debt.collectedAmount.toLocaleString()}\n`;
    reportContent += `• Collection Rate: ${metrics.debt.collectionRate.toFixed(1)}%\n`;
    reportContent += `• Performance Change: ${metrics.debt.change > 0 ? '+' : ''}${metrics.debt.change}%\n\n`;
    
    reportContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    reportContent += `4. AI-DETECTED ISSUES & RISKS\n\n`;
    if (metrics.debt.overdue > 0) {
      reportContent += `⚠️ HIGH PRIORITY:\n`;
      reportContent += `• ${metrics.debt.overdue} overdue debt accounts detected\n`;
      reportContent += `• Total overdue amount: ${currencySymbol}${metrics.debt.overdueAmount.toLocaleString()}\n\n`;
    }
    if (metrics.kpi.atRisk > 0) {
      reportContent += `⚠️ MEDIUM PRIORITY:\n`;
      reportContent += `• ${metrics.kpi.atRisk} KPIs at risk of not meeting targets\n`;
      reportContent += `• Immediate action required to get back on track\n\n`;
    }
    if (metrics.competitors.threats > 0) {
      reportContent += `⚠️ COMPETITIVE THREAT:\n`;
      reportContent += `• ${metrics.competitors.threats} high-threat competitors identified\n`;
      reportContent += `• Market positioning requires strategic review\n\n`;
    }
    if (metrics.afterSales.pending > 0) {
      reportContent += `⚠️ OPERATIONAL:\n`;
      reportContent += `• ${metrics.afterSales.pending} pending after-sales follow-ups\n`;
      reportContent += `• Customer satisfaction may be impacted\n\n`;
    }
    
    reportContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    reportContent += `5. AI RECOMMENDATIONS\n\n`;
    reportContent += `IMMEDIATE ACTIONS:\n`;
    if (metrics.debt.overdue > 0) {
      reportContent += `• Prioritize debt collection efforts on ${metrics.debt.overdue} overdue accounts\n`;
      reportContent += `• Deploy AI agents for automated follow-up via WhatsApp/SMS\n`;
    }
    if (metrics.kpi.atRisk > 0) {
      reportContent += `• Review ${metrics.kpi.atRisk} at-risk KPIs and adjust strategies\n`;
    }
    if (metrics.afterSales.pending > 0) {
      reportContent += `• Process ${metrics.afterSales.pending} pending after-sales follow-ups\n`;
    }
    reportContent += `\nSTRATEGIC ACTIONS:\n`;
    reportContent += `• Continue monitoring competitor movements (${metrics.competitors.tracked} active)\n`;
    reportContent += `• Optimize sales strategies based on effectiveness data\n`;
    reportContent += `• Maintain customer satisfaction above ${(metrics.afterSales.avgSatisfaction * 20).toFixed(0)}%\n`;
    reportContent += `• Improve collection rate from ${metrics.debt.collectionRate.toFixed(1)}%\n\n`;
    
    reportContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    reportContent += `6. NEXT PERIOD FOCUS\n\n`;
    reportContent += `• Address all high-priority issues identified above\n`;
    reportContent += `• Monitor KPI progress daily to prevent at-risk items\n`;
    reportContent += `• Continue competitive intelligence gathering\n`;
    reportContent += `• Strengthen customer relationship management\n`;
    reportContent += `• Optimize debt collection processes\n\n`;
    
    reportContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    reportContent += `Generated by Pocket CRM AI Insight System\n`;
    reportContent += `Report Type: ${config.title}\n`;
    reportContent += `Date: ${date}\n`;
    END OF OLD VERSION */
    
    // Create download
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pocket_CRM_${reportType}_report_${date.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const config = getReportConfig(reportType);
  const IconComponent = config.icon;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-pink-500" size={48} />
          <p className="text-gray-600">Loading data for analytical reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Back Button */}
      <a
        href="#/home"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Home</span>
      </a>

      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-white/20 rounded-xl backdrop-blur">
            <Sparkles size={32} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl mb-2">📌 {config.title}</h1>
            <p className="text-pink-100 text-lg">{config.subtitle}</p>
          </div>
          <button
            onClick={downloadReport}
            className="px-6 py-3 bg-white text-pink-600 rounded-xl hover:bg-pink-50 transition-colors flex items-center gap-2 font-medium"
          >
            <Download size={20} />
            Download Report
          </button>
        </div>
        
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
          <p className="text-sm mb-2">⚠️ <strong>Report Notice:</strong></p>
          <p className="text-sm text-pink-50">
            This report is automatically generated using the AI Insight Analytical System, based on real-time operational, financial, and customer data collected across all modules in Pocket CRM.
          </p>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-pink-500" />
          Select Report Period
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {(['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as ReportType[]).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === type
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold capitalize mb-1">{type}</div>
                <div className="text-xs text-gray-600">
                  {type === 'daily' && '24 Hours'}
                  {type === 'weekly' && '7 Days'}
                  {type === 'monthly' && '30 Days'}
                  {type === 'quarterly' && '90 Days'}
                  {type === 'annual' && '365 Days'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl mb-6 flex items-center gap-2">
          <BarChart3 size={24} className="text-pink-500" />
          1. Executive Summary
        </h2>
        
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <Package size={20} className="text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Active Items</span>
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {metrics.afterSales.total + metrics.kpi.total + metrics.sales.total + metrics.debt.total + metrics.tasks.total}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <Target size={20} className="text-green-600" />
              <span className="text-sm text-green-700 font-medium">System Health</span>
            </div>
            <div className="text-3xl font-bold text-green-900">
              {metrics.kpi.avgProgress.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck size={20} className="text-purple-600" />
              <span className="text-sm text-purple-700 font-medium">Satisfaction</span>
            </div>
            <div className="text-3xl font-bold text-purple-900">
              {(metrics.afterSales.avgSatisfaction * 20).toFixed(0)}%
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border border-indigo-200">
            <div className="flex items-center gap-3 mb-2">
              <ListTodo size={20} className="text-indigo-600" />
              <span className="text-sm text-indigo-700 font-medium">Task Completion</span>
            </div>
            <div className="text-3xl font-bold text-indigo-900">
              {metrics.tasks.completionRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={20} className="text-orange-600" />
              <span className="text-sm text-orange-700 font-medium">Collection Rate</span>
            </div>
            <div className="text-3xl font-bold text-orange-900">
              {metrics.debt.collectionRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Module Performance Analysis */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl mb-6 flex items-center gap-2">
          <TrendingUp size={24} className="text-pink-500" />
          2. Module Performance Analysis
        </h2>

        <div className="space-y-6">
          {/* After-Sales */}
          <div className="border-l-4 border-pink-500 pl-6 py-4 bg-pink-50/50 rounded-r-xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package size={20} className="text-pink-600" />
              2.1 After-Sales Follow-Up
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Orders</div>
                <div className="text-2xl font-bold text-gray-900">{metrics.afterSales.total}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {((metrics.afterSales.completed / metrics.afterSales.total) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Avg Satisfaction</div>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.afterSales.avgSatisfaction.toFixed(1)}/5.0
                </div>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                Completed: {metrics.afterSales.completed} orders ({((metrics.afterSales.completed/metrics.afterSales.total)*100).toFixed(1)}%)
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw size={16} className="text-blue-500" />
                In Progress: {metrics.afterSales.inProgress} orders
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-500" />
                Pending: {metrics.afterSales.pending} orders
              </li>
              <li className="flex items-center gap-2">
                <DollarSign size={16} className="text-green-500" />
                Total Revenue Tracked: {currencySymbol}{metrics.afterSales.totalRevenue.toLocaleString()}
              </li>
              <li className="flex items-center gap-2">
                {metrics.afterSales.change > 0 ? (
                  <TrendingUp size={16} className="text-green-500" />
                ) : (
                  <TrendingDown size={16} className="text-red-500" />
                )}
                Performance Change: {metrics.afterSales.change > 0 ? '+' : ''}{metrics.afterSales.change}% vs previous period
              </li>
            </ul>
          </div>

          {/* KPI */}
          <div className="border-l-4 border-green-500 pl-6 py-4 bg-green-50/50 rounded-r-xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Target size={20} className="text-green-600" />
              2.2 KPI Tracking
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total KPIs</div>
                <div className="text-2xl font-bold text-gray-900">{metrics.kpi.total}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Achievement Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {((metrics.kpi.achieved / metrics.kpi.total) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Avg Progress</div>
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.kpi.avgProgress.toFixed(1)}%
                </div>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                Achieved: {metrics.kpi.achieved} KPIs ✅
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp size={16} className="text-yellow-500" />
                On Track: {metrics.kpi.onTrack} KPIs 🟡
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                At Risk: {metrics.kpi.atRisk} KPIs ⚠️
              </li>
              <li className="flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-500" />
                Average Progress: {metrics.kpi.avgProgress.toFixed(1)}%
              </li>
              <li className="flex items-center gap-2">
                {metrics.kpi.change > 0 ? (
                  <TrendingUp size={16} className="text-green-500" />
                ) : (
                  <TrendingDown size={16} className="text-red-500" />
                )}
                Performance Change: {metrics.kpi.change > 0 ? '+' : ''}{metrics.kpi.change}%
              </li>
            </ul>
          </div>

          {/* Competitors */}
          <div className="border-l-4 border-purple-500 pl-6 py-4 bg-purple-50/50 rounded-r-xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <UserCheck size={20} className="text-purple-600" />
              2.3 Competitor Intelligence
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Tracked</div>
                <div className="text-2xl font-bold text-gray-900">{metrics.competitors.total}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">High Threats</div>
                <div className="text-2xl font-bold text-red-600">{metrics.competitors.threats}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Opportunities</div>
                <div className="text-2xl font-bold text-green-600">{metrics.competitors.opportunities}</div>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                Active Monitoring: {metrics.competitors.tracked} competitors
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                High Threats: {metrics.competitors.threats} identified
              </li>
              <li className="flex items-center gap-2">
                <Target size={16} className="text-green-500" />
                Market Opportunities: {metrics.competitors.opportunities} detected
              </li>
              <li className="flex items-center gap-2">
                <DollarSign size={16} className="text-blue-500" />
                Average Competitor Price: {currencySymbol}{metrics.competitors.avgPrice.toLocaleString()}
              </li>
              <li className="flex items-center gap-2">
                {metrics.competitors.change > 0 ? (
                  <TrendingUp size={16} className="text-green-500" />
                ) : (
                  <TrendingDown size={16} className="text-red-500" />
                )}
                Data Change: {metrics.competitors.change > 0 ? '+' : ''}{metrics.competitors.change}%
              </li>
            </ul>
          </div>

          {/* Sales */}
          <div className="border-l-4 border-orange-500 pl-6 py-4 bg-orange-50/50 rounded-r-xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-orange-600" />
              2.4 Sales & Marketing Strategies
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Strategies</div>
                <div className="text-2xl font-bold text-gray-900">{metrics.sales.total}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Active</div>
                <div className="text-2xl font-bold text-green-600">{metrics.sales.active}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Avg Effectiveness</div>
                <div className="text-2xl font-bold text-blue-600">{metrics.sales.avgEffectiveness.toFixed(1)}%</div>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                Active: {metrics.sales.active} strategies
              </li>
              <li className="flex items-center gap-2">
                <Award size={16} className="text-blue-500" />
                Completed: {metrics.sales.completed} strategies
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-500" />
                Pending: {metrics.sales.pending} strategies
              </li>
              <li className="flex items-center gap-2">
                <Target size={16} className="text-purple-500" />
                Average Effectiveness: {metrics.sales.avgEffectiveness.toFixed(1)}%
              </li>
              <li className="flex items-center gap-2">
                {metrics.sales.change > 0 ? (
                  <TrendingUp size={16} className="text-green-500" />
                ) : (
                  <TrendingDown size={16} className="text-red-500" />
                )}
                Performance Change: {metrics.sales.change > 0 ? '+' : ''}{metrics.sales.change}%
              </li>
            </ul>
          </div>

          {/* Debt Collection */}
          <div className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50/50 rounded-r-xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-blue-600" />
              2.5 Debt Collection
            </h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Accounts</div>
                <div className="text-2xl font-bold text-gray-900">{metrics.debt.total}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                <div className="text-2xl font-bold text-blue-600">
                  {currencySymbol}{(metrics.debt.totalAmount / 1000).toFixed(0)}K
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Overdue</div>
                <div className="text-2xl font-bold text-red-600">{metrics.debt.overdue}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Collection Rate</div>
                <div className="text-2xl font-bold text-green-600">{metrics.debt.collectionRate.toFixed(1)}%</div>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <DollarSign size={16} className="text-blue-500" />
                Total Outstanding: {metrics.debt.total} accounts ({currencySymbol}{metrics.debt.totalAmount.toLocaleString()})
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                Overdue: {metrics.debt.overdue} accounts ({currencySymbol}{metrics.debt.overdueAmount.toLocaleString()})
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                Collected: {metrics.debt.collected} accounts ({currencySymbol}{metrics.debt.collectedAmount.toLocaleString()})
              </li>
              <li className="flex items-center gap-2">
                <Target size={16} className="text-green-500" />
                Collection Rate: {metrics.debt.collectionRate.toFixed(1)}%
              </li>
              <li className="flex items-center gap-2">
                {metrics.debt.change < 0 ? (
                  <TrendingDown size={16} className="text-green-500" />
                ) : (
                  <TrendingUp size={16} className="text-red-500" />
                )}
                Debt Change: {metrics.debt.change > 0 ? '+' : ''}{metrics.debt.change}% (reduction is positive)
              </li>
            </ul>
          </div>

          {/* Task Management */}
          <div className="border-l-4 border-cyan-500 pl-6 py-4 bg-cyan-50/50 rounded-r-xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ListTodo size={20} className="text-cyan-600" />
              2.6 Task Management
            </h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
                <div className="text-2xl font-bold text-gray-900">{metrics.tasks.total}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Completed</div>
                <div className="text-2xl font-bold text-green-600">{metrics.tasks.completed}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Overdue</div>
                <div className="text-2xl font-bold text-red-600">{metrics.tasks.overdue}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
                <div className="text-2xl font-bold text-blue-600">{metrics.tasks.completionRate.toFixed(1)}%</div>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                Completed: {metrics.tasks.completed} tasks ({((metrics.tasks.completed/metrics.tasks.total)*100 || 0).toFixed(1)}%)
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw size={16} className="text-blue-500" />
                In Progress: {metrics.tasks.inProgress} tasks
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-500" />
                Pending: {metrics.tasks.pending} tasks
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                Overdue: {metrics.tasks.overdue} tasks ⚠️
              </li>
              <li className="flex items-center gap-2">
                <Target size={16} className="text-cyan-500" />
                Completion Rate: {metrics.tasks.completionRate.toFixed(1)}%
              </li>
              <li className="flex items-center gap-2">
                {metrics.tasks.change > 0 ? (
                  <TrendingUp size={16} className="text-green-500" />
                ) : (
                  <TrendingDown size={16} className="text-red-500" />
                )}
                Performance Change: {metrics.tasks.change > 0 ? '+' : ''}{metrics.tasks.change}%
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* AI-Detected Issues & Risks */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl mb-6 flex items-center gap-2">
          <AlertTriangle size={24} className="text-red-500" />
          3. AI-Detected Issues & Risks
        </h2>

        <div className="space-y-4">
          {metrics.debt.overdue > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-900 mb-1">⚠️ HIGH PRIORITY: Overdue Debt Accounts</div>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• {metrics.debt.overdue} overdue debt accounts detected</li>
                    <li>• Total overdue amount: {currencySymbol}{metrics.debt.overdueAmount.toLocaleString()}</li>
                    <li>• Immediate collection action required</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {metrics.kpi.atRisk > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-yellow-900 mb-1">⚠️ MEDIUM PRIORITY: At-Risk KPIs</div>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• {metrics.kpi.atRisk} KPIs at risk of not meeting targets</li>
                    <li>• Immediate strategic action required to get back on track</li>
                    <li>• Review and adjust execution plans</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {metrics.competitors.threats > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-orange-900 mb-1">⚠️ COMPETITIVE THREAT</div>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• {metrics.competitors.threats} high-threat competitors identified</li>
                    <li>• Market positioning requires strategic review</li>
                    <li>• Consider defensive and offensive strategies</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {metrics.afterSales.pending > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-900 mb-1">⚠️ OPERATIONAL: Pending Follow-ups</div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• {metrics.afterSales.pending} pending after-sales follow-ups</li>
                    <li>• Customer satisfaction may be impacted</li>
                    <li>• Deploy AI agents for automated outreach</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {metrics.tasks.overdue > 0 && (
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-purple-900 mb-1">⚠️ TASK MANAGEMENT: Overdue Tasks</div>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• {metrics.tasks.overdue} overdue tasks requiring immediate attention</li>
                    <li>• Task completion rate: {metrics.tasks.completionRate.toFixed(1)}%</li>
                    <li>• Reassign resources or adjust deadlines as needed</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {metrics.debt.overdue === 0 && metrics.kpi.atRisk === 0 && metrics.competitors.threats === 0 && metrics.afterSales.pending === 0 && metrics.tasks.overdue === 0 && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-900 mb-1">✅ All Systems Operating Normally</div>
                  <p className="text-sm text-green-800">No critical issues detected. Continue monitoring performance metrics.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl mb-6 flex items-center gap-2">
          <Sparkles size={24} className="text-pink-500" />
          4. AI Recommendations
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3 text-red-700">IMMEDIATE ACTIONS:</h3>
            <ul className="space-y-2 text-gray-700">
              {metrics.debt.overdue > 0 && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Prioritize debt collection efforts on {metrics.debt.overdue} overdue accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Deploy AI agents for automated follow-up via WhatsApp/SMS/Voice</span>
                  </li>
                </>
              )}
              {metrics.kpi.atRisk > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Review {metrics.kpi.atRisk} at-risk KPIs and adjust execution strategies</span>
                </li>
              )}
              {metrics.afterSales.pending > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Process {metrics.afterSales.pending} pending after-sales follow-ups to maintain customer satisfaction</span>
                </li>
              )}
              {metrics.tasks.overdue > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Address {metrics.tasks.overdue} overdue tasks immediately - reassign or reprioritize as needed</span>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3 text-blue-700">STRATEGIC ACTIONS:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Continue monitoring competitor movements ({metrics.competitors.tracked} active)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Optimize sales strategies based on effectiveness data (current avg: {metrics.sales.avgEffectiveness.toFixed(1)}%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Maintain customer satisfaction above {(metrics.afterSales.avgSatisfaction * 20).toFixed(0)}%</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Improve task completion rate from current {metrics.tasks.completionRate.toFixed(1)}%</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Improve collection rate from current {metrics.debt.collectionRate.toFixed(1)}%</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Leverage AI automation across all modules for efficiency gains</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Period Focus */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <h2 className="text-xl mb-6 flex items-center gap-2">
          <Target size={24} className="text-purple-600" />
          5. Next Period Focus
        </h2>

        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <span>Address all high-priority issues identified in section 3</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <span>Monitor KPI progress daily to prevent at-risk items</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <span>Continue competitive intelligence gathering and market analysis</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <span>Strengthen customer relationship management and satisfaction scores</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <span>Optimize debt collection processes and improve recovery rate</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <span>Improve task management completion rate and reduce overdue tasks</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <span>Expand AI automation deployment for faster response times</span>
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium">Generated by Pocket CRM AI Insight System</p>
          <p>Report Type: {config.title}</p>
          <p>Date: {new Date().toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">
            This is an automatically generated analytical report based on real-time data from all modules.
          </p>
        </div>
      </div>
    </div>
  );
}
