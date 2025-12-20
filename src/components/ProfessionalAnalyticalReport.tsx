import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, 
  Download, Calendar, Printer, FileSpreadsheet, Target, UserCheck,
  Activity, DollarSign, BarChart3, Sparkles, Filter, Award,
  ShoppingBag, Megaphone, Clock, Zap, Copy
} from 'lucide-react';
import { useCurrency } from '../lib/currency-context';
import { toast } from 'sonner@2.0.3';
import { companyAPI } from '../lib/api';

interface AnalyticalReportProps {
  afterSalesData: any[];
  kpiData: any[];
  competitorsData: any[];
  salesData: any[];
  marketingData: any[];
  debtData: any[];
  tasksData: any[];
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

const PERIOD_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

export function ProfessionalAnalyticalReport(props: AnalyticalReportProps) {
  const { currencySymbol } = useCurrency();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [companyName, setCompanyName] = useState('Your Business');

  // Load company name
  useEffect(() => {
    const loadCompanyName = async () => {
      try {
        const { settings } = await companyAPI.getSettings();
        if (settings?.companyName) {
          setCompanyName(settings.companyName);
        }
      } catch (error) {
        console.error('Failed to load company name:', error);
      }
    };
    loadCompanyName();
  }, []);

  // Safe data with defaults
  const safeData = {
    afterSalesData: Array.isArray(props.afterSalesData) ? props.afterSalesData : [],
    kpiData: Array.isArray(props.kpiData) ? props.kpiData : [],
    competitorsData: Array.isArray(props.competitorsData) ? props.competitorsData : [],
    salesData: Array.isArray(props.salesData) ? props.salesData : [],
    marketingData: Array.isArray(props.marketingData) ? props.marketingData : [],
    debtData: Array.isArray(props.debtData) ? props.debtData : [],
    tasksData: Array.isArray(props.tasksData) ? props.tasksData : [],
  };

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const { afterSalesData, kpiData, competitorsData, salesData, marketingData, debtData, tasksData } = safeData;

    // 1. EXECUTIVE SUMMARY METRICS
    const totalCustomers = afterSalesData.length;
    const resolvedIssues = afterSalesData.filter(item => item.status === 'Resolved').length;
    const customerSatisfaction = totalCustomers > 0 ? ((resolvedIssues / totalCustomers) * 100).toFixed(1) : '0';
    
    const totalRevenue = kpiData.reduce((sum, item) => sum + (parseFloat(item.actualValue) || 0), 0);
    const totalTarget = kpiData.reduce((sum, item) => sum + (parseFloat(item.targetValue) || 0), 0);
    const revenueGrowth = totalTarget > 0 ? (((totalRevenue - totalTarget) / totalTarget) * 100).toFixed(1) : '0';

    const totalDebt = debtData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const paidDebt = debtData.filter(item => item.status === 'Paid').reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const collectionRate = totalDebt > 0 ? ((paidDebt / totalDebt) * 100).toFixed(1) : '0';

    const completedTasks = tasksData.filter(t => t.status === 'Completed').length;
    const totalTasks = tasksData.length;
    const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';

    // 2. MARKET ANALYSIS
    const competitorCount = competitorsData.length;
    const competitorStrengths = competitorsData.flatMap(c => c.strengths?.split(',') || []).slice(0, 5);
    const competitorWeaknesses = competitorsData.flatMap(c => c.weaknesses?.split(',') || []).slice(0, 5);

    // 3. CUSTOMER INSIGHTS
    const repeatCustomers = afterSalesData.filter(item => item.followUpCount > 1).length;
    const repeatRate = totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : '0';
    
    const avgResponseTime = afterSalesData.length > 0 
      ? (afterSalesData.reduce((sum, item) => sum + (item.responseTime || 0), 0) / afterSalesData.length).toFixed(1)
      : '0';

    // 4. OPERATIONAL PERFORMANCE
    const highPriorityTasks = tasksData.filter(t => t.priority === 'High').length;
    const overdueTasks = tasksData.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;
    
    const activeFollowUps = afterSalesData.filter(item => item.status === 'In Progress').length;
    const avgFollowUpDuration = afterSalesData.length > 0
      ? (afterSalesData.reduce((sum, item) => sum + (item.duration || 0), 0) / afterSalesData.length).toFixed(1)
      : '0';

    // 5. FINANCIAL ANALYSIS
    const pendingPayments = debtData.filter(item => item.status === 'Pending').length;
    const overduePayments = debtData.filter(item => item.status === 'Overdue').length;
    const avgDebtAge = debtData.length > 0
      ? (debtData.reduce((sum, item) => {
          const dueDate = new Date(item.dueDate);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + Math.max(0, daysDiff);
        }, 0) / debtData.length).toFixed(0)
      : '0';

    // 6. SALES & MARKETING PERFORMANCE
    const totalSalesStrategies = salesData.length;
    const activeSalesStrategies = salesData.filter(s => s.status === 'Active').length;
    const totalMarketingCampaigns = marketingData.length;
    const activeMarketingCampaigns = marketingData.filter(m => m.status === 'Active').length;

    // 7. KPI PERFORMANCE
    const achievedKPIs = kpiData.filter(kpi => parseFloat(kpi.actualValue) >= parseFloat(kpi.targetValue)).length;
    const kpiAchievementRate = kpiData.length > 0 ? ((achievedKPIs / kpiData.length) * 100).toFixed(1) : '0';

    // 8. SWOT ANALYSIS
    const strengths = [
      customerSatisfaction >= '80' ? `High customer satisfaction (${customerSatisfaction}%)` : null,
      collectionRate >= '70' ? `Strong debt collection rate (${collectionRate}%)` : null,
      taskCompletionRate >= '75' ? `Effective task management (${taskCompletionRate}% completion)` : null,
      kpiAchievementRate >= '70' ? `Strong KPI achievement (${kpiAchievementRate}%)` : null,
      totalCustomers > 50 ? 'Large customer base' : null,
    ].filter(Boolean);

    const weaknesses = [
      customerSatisfaction < '70' ? `Low customer satisfaction (${customerSatisfaction}%)` : null,
      avgResponseTime > '24' ? `Slow response time (${avgResponseTime}hrs)` : null,
      overdueTasks > 5 ? `High number of overdue tasks (${overdueTasks})` : null,
      collectionRate < '50' ? `Poor debt collection (${collectionRate}%)` : null,
      kpiAchievementRate < '50' ? `Low KPI achievement (${kpiAchievementRate}%)` : null,
    ].filter(Boolean);

    const opportunities = [
      competitorWeaknesses.length > 0 ? `Exploit competitor weaknesses in ${competitorWeaknesses[0]}` : null,
      repeatRate < '40' ? 'Improve customer retention programs' : null,
      activeMarketingCampaigns < 3 ? 'Expand marketing efforts' : null,
      totalRevenue < totalTarget ? 'Revenue growth potential' : null,
      'Market expansion opportunities',
    ].filter(Boolean);

    const threats = [
      competitorCount > 5 ? `High competition (${competitorCount} competitors)` : null,
      overduePayments > 10 ? `High overdue payments (${overduePayments})` : null,
      overdueTasks > 10 ? 'Operational inefficiency risk' : null,
      'Economic uncertainties',
      'Rising operational costs',
    ].filter(Boolean);

    // 9. KEY FINDINGS
    const findings = [
      `Revenue ${parseFloat(revenueGrowth) >= 0 ? 'growth' : 'decline'} of ${Math.abs(parseFloat(revenueGrowth))}% vs target`,
      `Customer satisfaction at ${customerSatisfaction}% with ${totalCustomers} total customers`,
      `${collectionRate}% debt collection rate with ${currencySymbol}${totalDebt.toFixed(2)} total outstanding`,
      `${taskCompletionRate}% task completion rate with ${overdueTasks} overdue tasks`,
      `${competitorCount} active competitors tracked with key strengths identified`,
      `${activeSalesStrategies} active sales strategies and ${activeMarketingCampaigns} marketing campaigns`,
    ];

    // 10. STRATEGIC RECOMMENDATIONS
    const recommendations = {
      shortTerm: [
        overdueTasks > 5 ? `Address ${overdueTasks} overdue tasks immediately` : 'Maintain current task efficiency',
        avgResponseTime > '24' ? `Reduce customer response time from ${avgResponseTime}hrs to <12hrs` : 'Sustain response time performance',
        overduePayments > 5 ? `Implement aggressive debt collection for ${overduePayments} overdue accounts` : 'Continue debt monitoring',
      ],
      mediumTerm: [
        repeatRate < '40' ? `Implement customer loyalty program to increase ${repeatRate}% repeat rate` : 'Enhance customer retention',
        kpiAchievementRate < '70' ? 'Revise KPI targets and implement performance improvement plans' : 'Optimize KPI tracking',
        activeMarketingCampaigns < 3 ? 'Launch new marketing campaigns for market penetration' : 'Expand marketing reach',
      ],
      longTerm: [
        'Invest in AI-powered customer relationship management',
        'Expand into new market segments identified from competitor analysis',
        'Build comprehensive data analytics infrastructure',
        'Establish strategic partnerships for market expansion',
      ],
    };

    return {
      executiveSummary: {
        totalRevenue,
        revenueGrowth,
        customerSatisfaction,
        totalCustomers,
        collectionRate,
        taskCompletionRate,
      },
      marketAnalysis: {
        competitorCount,
        competitorStrengths,
        competitorWeaknesses,
      },
      customerInsights: {
        totalCustomers,
        repeatRate,
        avgResponseTime,
        resolvedIssues,
      },
      operationalPerformance: {
        totalTasks,
        completedTasks,
        highPriorityTasks,
        overdueTasks,
        activeFollowUps,
        avgFollowUpDuration,
      },
      financialAnalysis: {
        totalRevenue,
        totalDebt,
        paidDebt,
        pendingPayments,
        overduePayments,
        avgDebtAge,
        collectionRate,
      },
      salesMarketing: {
        totalSalesStrategies,
        activeSalesStrategies,
        totalMarketingCampaigns,
        activeMarketingCampaigns,
      },
      kpiPerformance: {
        totalKPIs: kpiData.length,
        achievedKPIs,
        kpiAchievementRate,
      },
      swot: {
        strengths,
        weaknesses,
        opportunities,
        threats,
      },
      findings,
      recommendations,
    };
  }, [safeData, currencySymbol]);

  // Export to PDF using html2canvas and jspdf
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('analytical-report');
      if (!element) {
        toast.error('Report element not found');
        setIsExporting(false);
        return;
      }

      // Dynamically import libraries
      const html2canvas = (await import('html2canvas')).default;
      const { default: jsPDF } = await import('jspdf');

      toast.info('Generating PDF... Please wait');

      // Create canvas with high quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const imgHeightInPDF = imgHeight * ratio;

      // Add content across multiple pages if needed
      let heightLeft = imgHeightInPDF;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPDF);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeightInPDF;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPDF);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${companyName.replace(/\s+/g, '_')}_Analytical_Report_${selectedDate.toISOString().split('T')[0]}.pdf`);
      
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(`Failed to export PDF: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
    toast.success('Opening print dialog...');
  };

  // Export structured data for PowerPoint/Excel
  const exportToPowerPoint = () => {
    setIsExporting(true);
    try {
      // Create comprehensive structured data
      const reportData = {
        metadata: {
          title: `${companyName} - Business Analytical Report`,
          period: PERIOD_LABELS[timePeriod],
          date: selectedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          generatedAt: new Date().toISOString(),
        },
        executiveSummary: {
          totalRevenue: `${currencySymbol}${analytics.executiveSummary.totalRevenue.toFixed(2)}`,
          revenueGrowth: `${analytics.executiveSummary.revenueGrowth}%`,
          customerSatisfaction: `${analytics.executiveSummary.customerSatisfaction}%`,
          totalCustomers: analytics.executiveSummary.totalCustomers,
          collectionRate: `${analytics.executiveSummary.collectionRate}%`,
          taskCompletionRate: `${analytics.executiveSummary.taskCompletionRate}%`,
        },
        marketAnalysis: analytics.marketAnalysis,
        customerInsights: analytics.customerInsights,
        operationalPerformance: analytics.operationalPerformance,
        financialAnalysis: {
          ...analytics.financialAnalysis,
          totalRevenue: `${currencySymbol}${analytics.financialAnalysis.totalRevenue.toFixed(2)}`,
          totalDebt: `${currencySymbol}${analytics.financialAnalysis.totalDebt.toFixed(2)}`,
          paidDebt: `${currencySymbol}${analytics.financialAnalysis.paidDebt.toFixed(2)}`,
        },
        salesMarketing: analytics.salesMarketing,
        kpiPerformance: analytics.kpiPerformance,
        swot: analytics.swot,
        keyFindings: analytics.findings,
        recommendations: analytics.recommendations,
      };

      // Create formatted text version for easy copy-paste
      const textReport = `
${companyName.toUpperCase()} - BUSINESS ANALYTICAL REPORT
${PERIOD_LABELS[timePeriod]} - ${selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

════════════════���══════════════════════════════════════

1. EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━
• Total Revenue: ${currencySymbol}${analytics.executiveSummary.totalRevenue.toFixed(2)}
• Revenue Growth: ${analytics.executiveSummary.revenueGrowth}%
• Customer Satisfaction: ${analytics.executiveSummary.customerSatisfaction}%
• Total Customers: ${analytics.executiveSummary.totalCustomers}
• Collection Rate: ${analytics.executiveSummary.collectionRate}%
• Task Completion: ${analytics.executiveSummary.taskCompletionRate}%

2. MARKET ANALYSIS
━━━���━━━━━━━━━━━━━━━━
• Active Competitors: ${analytics.marketAnalysis.competitorCount}
• Competitor Strengths Identified: ${analytics.marketAnalysis.competitorStrengths.length}
• Competitor Weaknesses: ${analytics.marketAnalysis.competitorWeaknesses.length}

3. CUSTOMER INSIGHTS
━━━━━━━━━━━━━━━━━━━━
• Total Customers: ${analytics.customerInsights.totalCustomers}
• Repeat Customer Rate: ${analytics.customerInsights.repeatRate}%
• Avg Response Time: ${analytics.customerInsights.avgResponseTime} hours
• Resolved Issues: ${analytics.customerInsights.resolvedIssues}

4. OPERATIONAL PERFORMANCE
━━━━━━━━━━━━━━━━━━━━
• Total Tasks: ${analytics.operationalPerformance.totalTasks}
• Completed: ${analytics.operationalPerformance.completedTasks}
• High Priority: ${analytics.operationalPerformance.highPriorityTasks}
• Overdue: ${analytics.operationalPerformance.overdueTasks}

5. FINANCIAL ANALYSIS
━━━━━━━━━━━━━━━━━━━━
• Total Revenue: ${currencySymbol}${analytics.financialAnalysis.totalRevenue.toFixed(2)}
• Total Debt: ${currencySymbol}${analytics.financialAnalysis.totalDebt.toFixed(2)}
• Paid Debt: ${currencySymbol}${analytics.financialAnalysis.paidDebt.toFixed(2)}
• Collection Rate: ${analytics.financialAnalysis.collectionRate}%
• Pending Payments: ${analytics.financialAnalysis.pendingPayments}
• Overdue Payments: ${analytics.financialAnalysis.overduePayments}

6. SWOT ANALYSIS
━━━━━━━━━━━━━━━━━━━━

STRENGTHS:
${analytics.swot.strengths.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

WEAKNESSES:
${analytics.swot.weaknesses.map((w, i) => `  ${i + 1}. ${w}`).join('\n')}

OPPORTUNITIES:
${analytics.swot.opportunities.map((o, i) => `  ${i + 1}. ${o}`).join('\n')}

THREATS:
${analytics.swot.threats.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}

7. KEY FINDINGS
━━━━━━━━━━━━━━━━━━━━
${analytics.findings.map((f, i) => `  ${i + 1}. ${f}`).join('\n')}

8. STRATEGIC RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━

SHORT-TERM (0-6 Months):
${analytics.recommendations.shortTerm.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}

MEDIUM-TERM (6-18 Months):
${analytics.recommendations.mediumTerm.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}

LONG-TERM (18-36 Months):
${analytics.recommendations.longTerm.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}

═══════════════════════════════════════════════════════
Generated by Pocket CRM AI Analytics
${new Date().toLocaleString()}
`;

      // Export both JSON and TXT
      const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const txtBlob = new Blob([textReport], { type: 'text/plain' });
      
      // Download JSON
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `Pocket_CRM_Report_Data_${selectedDate.toISOString().split('T')[0]}.json`;
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      URL.revokeObjectURL(jsonUrl);

      // Download TXT
      setTimeout(() => {
        const txtUrl = URL.createObjectURL(txtBlob);
        const txtLink = document.createElement('a');
        txtLink.href = txtUrl;
        txtLink.download = `Pocket_CRM_Report_${selectedDate.toISOString().split('T')[0]}.txt`;
        document.body.appendChild(txtLink);
        txtLink.click();
        document.body.removeChild(txtLink);
        URL.revokeObjectURL(txtUrl);
      }, 500);

      toast.success('Report data exported successfully!');
      toast.info('JSON and TXT files downloaded - Import into PowerPoint/Excel as needed');
    } catch (error) {
      console.error('Data export error:', error);
      toast.error(`Failed to export data: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 no-print">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600 whitespace-nowrap flex items-center gap-2">
              <Filter size={16} />
              Report Period:
            </span>
            
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm whitespace-nowrap transition-all hover:border-pink-500 flex items-center gap-2"
              >
                {PERIOD_LABELS[timePeriod]}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showPeriodDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[180px]">
                  {(['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as TimePeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setTimePeriod(period);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                        timePeriod === period ? 'bg-pink-50 text-pink-600' : 'text-gray-700'
                      }`}
                    >
                      {PERIOD_LABELS[period]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg text-sm hover:from-gray-700 hover:to-gray-800 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm hover:from-red-600 hover:to-red-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <FileText size={16} className={isExporting ? 'animate-pulse' : ''} />
              {isExporting ? 'Generating...' : 'Export PDF'}
            </button>
            <button
              onClick={exportToPowerPoint}
              disabled={isExporting}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <FileSpreadsheet size={16} className={isExporting ? 'animate-pulse' : ''} />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Analytical Report */}
      <div id="analytical-report" className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-8">
        {/* Report Header */}
        <div className="border-b-4 border-gradient-to-r from-pink-500 to-purple-500 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white">
              <Sparkles size={32} />
            </div>
            <div>
              <h1 className="text-3xl text-gray-900">
                {companyName} - Business Analytical Report
              </h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Calendar size={16} />
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                <span className="mx-2">•</span>
                {PERIOD_LABELS[timePeriod]} Analysis
              </p>
            </div>
          </div>
        </div>

        {/* 1. EXECUTIVE SUMMARY */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">1</div>
            Executive Summary
          </h2>
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              This report analyzes Pocket CRM's current business performance, market position, operational efficiency, 
              and financial trends for the {PERIOD_LABELS[timePeriod].toLowerCase()} period ending{' '}
              {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Overall, the business shows {parseFloat(analytics.executiveSummary.revenueGrowth) >= 0 ? 'positive' : 'declining'} revenue growth 
              ({analytics.executiveSummary.revenueGrowth >= 0 ? '+' : ''}{analytics.executiveSummary.revenueGrowth}%), 
              with customer satisfaction at {analytics.executiveSummary.customerSatisfaction}% across{' '}
              {analytics.executiveSummary.totalCustomers} customers. Debt collection rate stands at{' '}
              {analytics.executiveSummary.collectionRate}% and operational task completion at{' '}
              {analytics.executiveSummary.taskCompletionRate}%.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={20} className="text-green-600" />
                  <span className="text-sm text-gray-600">Revenue</span>
                </div>
                <p className="text-2xl text-gray-900">{currencySymbol}{analytics.executiveSummary.totalRevenue.toFixed(0)}</p>
                <p className={`text-sm ${parseFloat(analytics.executiveSummary.revenueGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.executiveSummary.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(analytics.executiveSummary.revenueGrowth))}%
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck size={20} className="text-blue-600" />
                  <span className="text-sm text-gray-600">Customers</span>
                </div>
                <p className="text-2xl text-gray-900">{analytics.executiveSummary.totalCustomers}</p>
                <p className="text-sm text-blue-600">{analytics.executiveSummary.customerSatisfaction}% satisfied</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={20} className="text-purple-600" />
                  <span className="text-sm text-gray-600">Collection Rate</span>
                </div>
                <p className="text-2xl text-gray-900">{analytics.executiveSummary.collectionRate}%</p>
                <p className="text-sm text-purple-600">Debt recovery</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={20} className="text-orange-600" />
                  <span className="text-sm text-gray-600">Task Completion</span>
                </div>
                <p className="text-2xl text-gray-900">{analytics.executiveSummary.taskCompletionRate}%</p>
                <p className="text-sm text-orange-600">Operational efficiency</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. BUSINESS OBJECTIVE */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">2</div>
            Business Objective
          </h2>
          <div className="bg-gray-50 rounded-xl p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Assess the company's current financial and market performance across all business units</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Identify operational bottlenecks and inefficiencies in customer service and debt collection</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Provide strategic recommendations for cost optimization and revenue scaling</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Analyze competitive landscape and market positioning opportunities</span>
              </li>
            </ul>
          </div>
        </section>

        {/* 3. MARKET ANALYSIS */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">3</div>
            Market Analysis
          </h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg text-gray-900 mb-3">3.1 Competitor Landscape</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Active Competitors</p>
                  <p className="text-3xl text-gray-900">{analytics.marketAnalysis.competitorCount}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Key Strengths Identified</p>
                  <p className="text-3xl text-gray-900">{analytics.marketAnalysis.competitorStrengths.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Weaknesses to Exploit</p>
                  <p className="text-3xl text-gray-900">{analytics.marketAnalysis.competitorWeaknesses.length}</p>
                </div>
              </div>
            </div>

            {analytics.marketAnalysis.competitorStrengths.length > 0 && (
              <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg text-gray-900 mb-3">Top Competitor Strengths</h3>
                <ul className="space-y-2">
                  {analytics.marketAnalysis.competitorStrengths.slice(0, 5).map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-600 font-bold">•</span>
                      {strength.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analytics.marketAnalysis.competitorWeaknesses.length > 0 && (
              <div className="bg-white border-2 border-green-200 rounded-xl p-6">
                <h3 className="text-lg text-gray-900 mb-3">Competitor Weaknesses (Opportunities)</h3>
                <ul className="space-y-2">
                  {analytics.marketAnalysis.competitorWeaknesses.slice(0, 5).map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-green-600 font-bold">•</span>
                      {weakness.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* 4. CUSTOMER INSIGHTS */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">4</div>
            Customer Insights
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-lg text-gray-900 mb-4">Customer Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Customers</span>
                  <span className="text-2xl text-purple-600">{analytics.customerInsights.totalCustomers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Customer Satisfaction</span>
                  <span className="text-2xl text-purple-600">{analytics.executiveSummary.customerSatisfaction}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Repeat Customer Rate</span>
                  <span className="text-2xl text-purple-600">{analytics.customerInsights.repeatRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Resolved Issues</span>
                  <span className="text-2xl text-purple-600">{analytics.customerInsights.resolvedIssues}</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-6">
              <h3 className="text-lg text-gray-900 mb-4">Service Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Avg Response Time</span>
                  <span className="text-2xl text-indigo-600">{analytics.customerInsights.avgResponseTime} hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Active Follow-ups</span>
                  <span className="text-2xl text-indigo-600">{analytics.operationalPerformance.activeFollowUps}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Avg Follow-up Duration</span>
                  <span className="text-2xl text-indigo-600">{analytics.operationalPerformance.avgFollowUpDuration} days</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-indigo-200">
                <p className="text-sm text-gray-600">
                  <strong>Key Insight:</strong> {
                    parseFloat(analytics.customerInsights.avgResponseTime) > 24 
                      ? 'Response time needs improvement to enhance customer satisfaction.'
                      : 'Response time is within acceptable range.'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. OPERATIONAL PERFORMANCE */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">5</div>
            Operational Performance
          </h2>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
            <h3 className="text-lg text-gray-900 mb-4">5.1 Task Management Efficiency</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
                <p className="text-3xl text-gray-900">{analytics.operationalPerformance.totalTasks}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl text-green-600">{analytics.operationalPerformance.completedTasks}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">High Priority</p>
                <p className="text-3xl text-orange-600">{analytics.operationalPerformance.highPriorityTasks}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Overdue</p>
                <p className="text-3xl text-red-600">{analytics.operationalPerformance.overdueTasks}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Task Completion Rate</span>
                <span className="text-lg text-gray-900">{analytics.executiveSummary.taskCompletionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${analytics.executiveSummary.taskCompletionRate}%` }}
                ></div>
              </div>
            </div>

            {analytics.operationalPerformance.overdueTasks > 0 && (
              <div className="mt-4 bg-red-100 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Action Required:</strong> {analytics.operationalPerformance.overdueTasks} overdue tasks 
                  require immediate attention to prevent operational bottlenecks.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 6. FINANCIAL ANALYSIS */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">6</div>
            Financial Analysis
          </h2>
          
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg text-gray-900 mb-4">6.1 Revenue & Profitability</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Revenue</span>
                    <span className="text-2xl text-green-600">{currencySymbol}{analytics.financialAnalysis.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Revenue Growth</span>
                    <span className={`text-xl ${parseFloat(analytics.executiveSummary.revenueGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.executiveSummary.revenueGrowth >= 0 ? '+' : ''}{analytics.executiveSummary.revenueGrowth}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">KPI Achievement Rate</span>
                    <span className="text-xl text-green-600">{analytics.kpiPerformance.kpiAchievementRate}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-6">
                <h3 className="text-lg text-gray-900 mb-4">6.2 Debt Collection</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Outstanding</span>
                    <span className="text-2xl text-red-600">{currencySymbol}{analytics.financialAnalysis.totalDebt.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Collected</span>
                    <span className="text-xl text-green-600">{currencySymbol}{analytics.financialAnalysis.paidDebt.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Collection Rate</span>
                    <span className="text-xl text-orange-600">{analytics.financialAnalysis.collectionRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-6">
              <h3 className="text-lg text-gray-900 mb-4">6.3 Payment Status Overview</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
                  <p className="text-3xl text-yellow-600">{analytics.financialAnalysis.pendingPayments}</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Overdue Payments</p>
                  <p className="text-3xl text-red-600">{analytics.financialAnalysis.overduePayments}</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Avg Debt Age</p>
                  <p className="text-3xl text-orange-600">{analytics.financialAnalysis.avgDebtAge} days</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. SALES & MARKETING PERFORMANCE */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">7</div>
            Sales & Marketing Performance
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShoppingBag size={24} className="text-blue-600" />
                <h3 className="text-lg text-gray-900">Sales Strategies</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Strategies</span>
                  <span className="text-2xl text-blue-600">{analytics.salesMarketing.totalSalesStrategies}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Active Strategies</span>
                  <span className="text-2xl text-green-600">{analytics.salesMarketing.activeSalesStrategies}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                    style={{ 
                      width: `${analytics.salesMarketing.totalSalesStrategies > 0 
                        ? (analytics.salesMarketing.activeSalesStrategies / analytics.salesMarketing.totalSalesStrategies * 100) 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-pink-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Megaphone size={24} className="text-pink-600" />
                <h3 className="text-lg text-gray-900">Marketing Campaigns</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Campaigns</span>
                  <span className="text-2xl text-pink-600">{analytics.salesMarketing.totalMarketingCampaigns}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Active Campaigns</span>
                  <span className="text-2xl text-green-600">{analytics.salesMarketing.activeMarketingCampaigns}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-pink-600 h-3 rounded-full"
                    style={{ 
                      width: `${analytics.salesMarketing.totalMarketingCampaigns > 0 
                        ? (analytics.salesMarketing.activeMarketingCampaigns / analytics.salesMarketing.totalMarketingCampaigns * 100) 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. SWOT ANALYSIS */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">8</div>
            SWOT Analysis
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award size={24} className="text-green-600" />
                <h3 className="text-lg text-gray-900">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {analytics.swot.strengths.length > 0 ? (
                  analytics.swot.strengths.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 italic">Building competitive advantages</li>
                )}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={24} className="text-red-600" />
                <h3 className="text-lg text-gray-900">Weaknesses</h3>
              </div>
              <ul className="space-y-2">
                {analytics.swot.weaknesses.length > 0 ? (
                  analytics.swot.weaknesses.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <TrendingDown size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 italic">No significant weaknesses identified</li>
                )}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={24} className="text-blue-600" />
                <h3 className="text-lg text-gray-900">Opportunities</h3>
              </div>
              <ul className="space-y-2">
                {analytics.swot.opportunities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <Zap size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Threats */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={24} className="text-orange-600" />
                <h3 className="text-lg text-gray-900">Threats</h3>
              </div>
              <ul className="space-y-2">
                {analytics.swot.threats.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <AlertCircle size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 9. KEY FINDINGS */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">9</div>
            Key Findings
          </h2>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
            <ul className="space-y-3">
              {analytics.findings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="text-gray-700">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 10. STRATEGIC RECOMMENDATIONS */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">10</div>
            Strategic Recommendations
          </h2>
          
          <div className="space-y-4">
            {/* Short-Term */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={20} className="text-yellow-600" />
                <h3 className="text-lg text-gray-900">Short-Term (0–6 Months)</h3>
              </div>
              <ul className="space-y-2">
                {analytics.recommendations.shortTerm.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-yellow-600 font-bold">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Medium-Term */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={20} className="text-blue-600" />
                <h3 className="text-lg text-gray-900">Medium-Term (6–18 Months)</h3>
              </div>
              <ul className="space-y-2">
                {analytics.recommendations.mediumTerm.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 font-bold">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Long-Term */}
            <div className="bg-purple-50 border-l-4 border-purple-500 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Target size={20} className="text-purple-600" />
                <h3 className="text-lg text-gray-900">Long-Term (18–36 Months)</h3>
              </div>
              <ul className="space-y-2">
                {analytics.recommendations.longTerm.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-purple-600 font-bold">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 11. CONCLUSION */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">11</div>
            Conclusion
          </h2>
          
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl p-6">
            <p className="leading-relaxed mb-4">
              The business demonstrates {parseFloat(analytics.executiveSummary.revenueGrowth) >= 0 ? 'strong growth momentum' : 'areas requiring attention'}, 
              supported by {analytics.executiveSummary.totalCustomers} customers and a {analytics.executiveSummary.customerSatisfaction}% satisfaction rate. 
              {parseFloat(analytics.executiveSummary.revenueGrowth) >= 0 
                ? ` Revenue growth of ${analytics.executiveSummary.revenueGrowth}% indicates positive market performance.`
                : ' Revenue optimization strategies should be prioritized.'}
            </p>
            <p className="leading-relaxed mb-4">
              To sustain profitability and market position, the company must focus on improving operational efficiency 
              (current task completion: {analytics.executiveSummary.taskCompletionRate}%), 
              enhancing debt collection processes (current rate: {analytics.executiveSummary.collectionRate}%), 
              and capitalizing on identified market opportunities.
            </p>
            <p className="leading-relaxed">
              The strategic recommendations outlined in this report provide a clear roadmap for sustainable growth, 
              competitive advantage, and operational excellence. Regular monitoring of KPIs and adaptive strategy 
              implementation will be crucial for success.
            </p>
          </div>
        </section>

        {/* Report Footer */}
        <div className="border-t-2 border-gray-200 pt-6 text-center text-sm text-gray-500">
          <p>Generated by Pocket CRM AI Analytics • {new Date().toLocaleString()}</p>
          <p className="mt-1">Confidential Business Document • For Internal Use Only</p>
        </div>
      </div>
    </div>
  );
}
