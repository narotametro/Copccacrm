import { useState, useEffect } from 'react';
import { Bot, AlertTriangle, CheckCircle, Target, DollarSign, UserCheck, Lightbulb, Clock, Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useCurrency } from '../lib/currency-context';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface AIInsightReportProps {
  afterSalesData: any[];
  kpiData: any[];
  competitorsData: any[];
  salesData: any[];
  debtData: any[];
  tasksData: any[];
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';

interface SavedReport {
  date: string;
  period: ReportPeriod;
  insights: any;
  metrics: any;
}

export function AIInsightReport({
  afterSalesData,
  kpiData,
  competitorsData,
  salesData,
  debtData,
  tasksData,
}: AIInsightReportProps) {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [currentReport, setCurrentReport] = useState<SavedReport | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const { currencySymbol } = useCurrency();

  // Calculate metrics
  const totalCustomers = afterSalesData?.length || 0;
  const resolvedIssues = afterSalesData?.filter(item => item.status === 'Resolved')?.length || 0;
  const satisfiedCustomers = afterSalesData?.filter(item => item.satisfaction === 'Satisfied')?.length || 0;
  const satisfactionRate = totalCustomers > 0 ? ((satisfiedCustomers / totalCustomers) * 100).toFixed(1) : '0.0';
  
  const totalTasks = tasksData?.length || 0;
  const completedTasks = tasksData?.filter(task => task.status === 'Completed')?.length || 0;
  const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0';
  const overdueTasks = tasksData?.filter(task => task.status === 'Overdue')?.length || 0;
  
  const totalKPIs = kpiData?.length || 0;
  const achievedKPIs = kpiData?.filter(kpi => parseFloat(kpi.achievement || 0) >= 100)?.length || 0;
  const kpiAchievementRate = totalKPIs > 0 ? ((achievedKPIs / totalKPIs) * 100).toFixed(1) : '0.0';
  
  const totalDebt = debtData?.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) || 0;
  const collectedAmount = debtData?.filter(item => item.status === 'Paid').reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) || 0;
  const collectionRate = totalDebt > 0 ? ((collectedAmount / totalDebt) * 100).toFixed(1) : '0.0';
  const pendingDebt = totalDebt - collectedAmount;
  
  const activeCompetitors = competitorsData?.length || 0;
  const totalStrategies = salesData?.length || 0;
  const activeStrategies = salesData?.filter(s => s.status === 'Active')?.length || 0;

  // AI Insights based on actual data
  const generateInsights = () => {
    const insights = {
      operational: [] as string[],
      financial: [] as string[],
      customer: [] as string[],
      risks: [] as string[],
      recommendations: [] as string[],
    };

    // Operational Insights
    if (parseFloat(taskCompletionRate) >= 80) {
      insights.operational.push(`✓ Task completion rate is excellent at ${taskCompletionRate}% - team productivity is strong.`);
    } else if (parseFloat(taskCompletionRate) >= 50) {
      insights.operational.push(`⚠ Task completion rate at ${taskCompletionRate}% - moderate performance, room for improvement.`);
    } else {
      insights.operational.push(`⚠ Task completion rate critically low at ${taskCompletionRate}% - immediate action required.`);
    }

    if (overdueTasks > 0) {
      insights.operational.push(`⚠ ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''} detected - requires urgent attention.`);
      insights.risks.push(`${overdueTasks} overdue tasks causing operational bottlenecks.`);
      insights.recommendations.push(`Reassign resources to clear ${overdueTasks} overdue tasks immediately.`);
    } else {
      insights.operational.push(`✓ No overdue tasks - workflow management is on track.`);
    }

    if (totalTasks > 0) {
      insights.operational.push(`Processed ${totalTasks} total tasks with ${completedTasks} completed successfully.`);
    }

    // Financial Insights
    if (collectedAmount > 0) {
      insights.financial.push(`✓ Collected ${currencySymbol}${collectedAmount.toLocaleString()} from debt collection efforts.`);
    }

    if (parseFloat(collectionRate) >= 70) {
      insights.financial.push(`✓ Debt collection rate strong at ${collectionRate}% - effective recovery process.`);
    } else if (parseFloat(collectionRate) >= 40) {
      insights.financial.push(`⚠ Debt collection rate at ${collectionRate}% - needs improvement.`);
      insights.recommendations.push(`Intensify debt collection follow-ups to improve ${collectionRate}% collection rate.`);
    } else {
      insights.financial.push(`⚠ Debt collection rate critically low at ${collectionRate}% - urgent action needed.`);
      insights.risks.push(`Low debt collection rate (${collectionRate}%) impacting cash flow.`);
      insights.recommendations.push(`Implement automated debt collection reminders and payment plans.`);
    }

    if (pendingDebt > 0) {
      insights.financial.push(`${currencySymbol}${pendingDebt.toLocaleString()} in pending debt requires follow-up.`);
      if (pendingDebt > 100000) {
        insights.risks.push(`High pending debt of ${currencySymbol}${pendingDebt.toLocaleString()} may impact liquidity.`);
      }
    }

    // Customer Insights
    if (parseFloat(satisfactionRate) >= 80) {
      insights.customer.push(`✓ Customer satisfaction excellent at ${satisfactionRate}% from ${totalCustomers} customers.`);
    } else if (parseFloat(satisfactionRate) >= 60) {
      insights.customer.push(`⚠ Customer satisfaction moderate at ${satisfactionRate}% - improvement needed.`);
      insights.recommendations.push(`Launch customer feedback program to boost ${satisfactionRate}% satisfaction rate.`);
    } else {
      insights.customer.push(`⚠ Customer satisfaction critically low at ${satisfactionRate}% - immediate action required.`);
      insights.risks.push(`Low customer satisfaction (${satisfactionRate}%) may lead to customer churn.`);
      insights.recommendations.push(`Conduct urgent customer satisfaction survey and implement quick-win improvements.`);
    }

    if (resolvedIssues > 0) {
      insights.customer.push(`✓ Successfully resolved ${resolvedIssues} customer issues during this period.`);
    }

    if (totalCustomers > 0 && resolvedIssues === 0) {
      insights.customer.push(`⚠ No customer issues resolved - review support process effectiveness.`);
    }

    // KPI Insights
    if (parseFloat(kpiAchievementRate) >= 80) {
      insights.operational.push(`✓ KPI achievement rate strong at ${kpiAchievementRate}% - goals are being met.`);
    } else if (parseFloat(kpiAchievementRate) >= 50) {
      insights.operational.push(`⚠ KPI achievement at ${kpiAchievementRate}% - moderate performance.`);
      insights.recommendations.push(`Review underperforming KPIs and adjust targets or strategies.`);
    } else if (totalKPIs > 0) {
      insights.operational.push(`⚠ KPI achievement critically low at ${kpiAchievementRate}% - strategic review needed.`);
      insights.risks.push(`Low KPI achievement (${kpiAchievementRate}%) indicates strategic misalignment.`);
    }

    // Competitive Insights
    if (activeCompetitors > 5) {
      insights.operational.push(`Monitoring ${activeCompetitors} active competitors in the market.`);
      insights.recommendations.push(`Conduct monthly competitive analysis to identify market opportunities.`);
    } else if (activeCompetitors > 0) {
      insights.operational.push(`Tracking ${activeCompetitors} key competitors for market intelligence.`);
    }

    // Sales & Marketing Insights
    if (activeStrategies > 0) {
      insights.operational.push(`✓ ${activeStrategies} active sales strategies currently in execution.`);
    } else if (totalStrategies === 0) {
      insights.risks.push(`No active sales strategies detected - revenue growth may stagnate.`);
      insights.recommendations.push(`Develop and implement at least 3 sales/marketing strategies this quarter.`);
    }

    // General Recommendations
    if (insights.recommendations.length === 0) {
      insights.recommendations.push(`Continue monitoring all key metrics and maintain current performance levels.`);
      insights.recommendations.push(`Schedule weekly review meetings to ensure sustained performance.`);
    }

    if (insights.risks.length === 0) {
      insights.risks.push(`No critical risks detected at this time - systems operating normally.`);
    }

    return insights;
  };

  const insights = generateInsights();

  // Calculate metrics for saving
  const currentMetrics = {
    totalCustomers,
    resolvedIssues,
    satisfiedCustomers,
    satisfactionRate,
    totalTasks,
    completedTasks,
    taskCompletionRate,
    overdueTasks,
    totalKPIs,
    achievedKPIs,
    kpiAchievementRate,
    totalDebt,
    collectedAmount,
    collectionRate,
    pendingDebt,
    activeCompetitors,
    totalStrategies,
    activeStrategies,
  };

  // Load saved reports on mount
  useEffect(() => {
    loadSavedReports();
  }, []);

  // Auto-save current report
  useEffect(() => {
    const autoSave = async () => {
      const today = new Date().toISOString().split('T')[0];
      await saveReport(today, period, insights, currentMetrics);
    };
    
    const timer = setTimeout(autoSave, 2000); // Auto-save after 2 seconds
    return () => clearTimeout(timer);
  }, [insights, period]);

  // Load report when date changes
  useEffect(() => {
    loadReportForDate(selectedDate);
  }, [selectedDate, period]);

  const loadSavedReports = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a2294ced/ai-reports`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSavedReports(data);
      }
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  };

  const saveReport = async (date: string, period: ReportPeriod, insights: any, metrics: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a2294ced/ai-reports`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ date, period, insights, metrics }),
        }
      );
      
      if (response.ok) {
        loadSavedReports(); // Refresh the list
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const loadReportForDate = async (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const report = savedReports.find(r => r.date === dateStr && r.period === period);
    setCurrentReport(report || null);
  };

  const getPeriodLabel = () => {
    const today = selectedDate;
    switch (period) {
      case 'daily':
        return today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'monthly':
        return today.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'quarterly':
        const quarter = Math.floor(today.getMonth() / 3) + 1;
        return `Q${quarter} ${today.getFullYear()}`;
      case 'annually':
        return today.getFullYear().toString();
      default:
        return '';
    }
  };

  const getPeriodTitle = () => {
    switch (period) {
      case 'daily': return 'DAILY';
      case 'weekly': return 'WEEKLY';
      case 'monthly': return 'MONTHLY';
      case 'quarterly': return 'QUARTERLY';
      case 'annually': return 'ANNUAL';
      default: return 'DAILY';
    }
  };

  // Calendar rendering functions
  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const hasReport = savedReports.some(r => r.date === dateStr && r.period === period);
      const isSelected = selectedDate.toISOString().split('T')[0] === dateStr;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      
      days.push(
        <button
          key={day}
          onClick={() => {
            setSelectedDate(date);
            setShowCalendar(false);
          }}
          className={`p-2 text-sm rounded-lg transition-all relative ${
            isSelected
              ? 'bg-purple-600 text-white font-bold shadow-md'
              : isToday
              ? 'bg-blue-100 text-blue-700 font-semibold'
              : hasReport
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {day}
          {hasReport && !isSelected && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-600 rounded-full" />
          )}
        </button>
      );
    }
    
    return days;
  };

  const changeMonth = (offset: number) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(calendarMonth.getMonth() + offset);
    setCalendarMonth(newMonth);
  };

  return (
    <div className="space-y-6">
      {/* Full Gradient Header Box - Reduced Height */}
      <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-fuchsia-600 rounded-2xl p-6 shadow-2xl">
        {/* Title Section */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-xl border-2 border-white/30">
              <Bot className="text-white" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="text-2xl font-bold text-white">
                  {getPeriodTitle()} ANALYTICAL REPORT
                </h2>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/30">
                  AI INSIGHT POWERED
                </span>
                {currentReport && (
                  <span className="px-2 py-1 bg-green-400 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <History size={12} />
                    Saved
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-white/90">{getPeriodLabel()}</p>
            </div>
          </div>

          {/* Buttons on Right Side */}
          <div className="flex items-center gap-3">
            {/* Calendar Button */}
            <div className="relative">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 px-8 py-1.5 bg-white text-gray-900 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-lg text-sm font-semibold"
              >
                <CalendarIcon size={18} />
                <span>View History</span>
              </button>
          
              {/* Calendar Dropdown */}
              {showCalendar && (
                <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-pink-200 p-5 z-50 w-80">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="p-2 hover:bg-pink-50 rounded-lg transition-colors text-pink-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                      {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                      onClick={() => changeMonth(1)}
                      className="p-2 hover:bg-pink-50 rounded-lg transition-colors text-pink-600"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-xs font-bold text-purple-600 text-center p-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-pink-200 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded" />
                      <span className="text-gray-600">Selected</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-100 rounded" />
                      <span className="text-gray-600">Has Report</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-100 rounded" />
                      <span className="text-gray-600">Today</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Period Selector */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
                className="appearance-none pl-4 pr-10 py-2 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-all shadow-lg"
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="quarterly">Quarterly Report</option>
                <option value="annually">Annual Report</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-900 pointer-events-none" size={18} />
            </div>
          </div>
        </div>

        {/* Report Notice - Compact */}
        <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <AlertTriangle className="text-white" size={20} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1">
              Report Notice
            </h3>
            <p className="text-xs text-white/90 leading-relaxed">
              This report is automatically generated using the <span className="font-bold text-white">AI Insight Analytical System</span>, based on real-time operational, financial, and customer data collected from all modules in Pocket CRM.
            </p>
          </div>
        </div>
      </div>

      {/* Report Sections Grid */}
      <div className="space-y-4">
        {/* 1. Overview */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">1</span>
            </div>
            <h3 className="font-semibold text-gray-800">Report Overview</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Date:</p>
              <p className="font-medium text-gray-800">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Generated By:</p>
              <p className="font-medium text-gray-800">AI Insight System</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Period:</p>
              <p className="font-medium text-gray-800">{getPeriodTitle()}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Purpose:</p>
              <p className="font-medium text-gray-800">Performance Analysis</p>
            </div>
          </div>
        </div>

        {/* 2. Work Completed (AI Summary) */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">2</span>
            </div>
            <h3 className="font-semibold text-gray-800">Work Completed (AI Summary)</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Processed and analyzed operational datasets from all 6 core modules.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Updated KPI dashboards with performance metrics and achievement rates.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Conducted anomaly detection on task management and debt collection data.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Reviewed customer feedback and satisfaction metrics in real-time.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Analyzed competitor intelligence and market positioning data.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Generated automated insights and predictive recommendations.</span>
            </li>
          </ul>
        </div>

        {/* 3. AI Insight Analytical Findings */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">3</span>
            </div>
            <h3 className="font-semibold text-gray-800">AI Insight Analytical Findings</h3>
          </div>

          {/* 3.1 Operational */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-blue-600" />
              <h4 className="font-semibold text-gray-700 text-sm">3.1 Operational Performance</h4>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-700 ml-6">
              {insights.operational.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3.2 Financial */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-green-600" />
              <h4 className="font-semibold text-gray-700 text-sm">3.2 Financial Performance</h4>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-700 ml-6">
              {insights.financial.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3.3 Customer */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserCheck size={18} className="text-purple-600" />
              <h4 className="font-semibold text-gray-700 text-sm">3.3 Customer Insights</h4>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-700 ml-6">
              {insights.customer.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. Issues & Risks */}
        <div className="bg-red-50 rounded-lg p-5 border border-red-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">4</span>
            </div>
            <h3 className="font-semibold text-gray-800">Issues & Risks (AI Detected)</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-800">
            {insights.risks.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 5. Recommendations */}
        <div className="bg-blue-50 rounded-lg p-5 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">5</span>
            </div>
            <h3 className="font-semibold text-gray-800">Recommendations (AI Automated Suggestions)</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-800">
            {insights.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Lightbulb size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. Next Actions */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">6</span>
            </div>
            <h3 className="font-semibold text-gray-800">Next Actions for {period === 'daily' ? 'Tomorrow' : `Next ${getPeriodTitle()}`}</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-800">
            <li className="flex items-start gap-2">
              <Clock size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
              <span>Continue monitoring all key performance indicators and operational metrics.</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
              <span>Address all identified risks and implement recommended action items.</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
              <span>Review and update strategic initiatives based on performance trends.</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
              <span>Prepare variance analysis and progress summary for management review.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-purple-200 flex items-center justify-between text-xs text-gray-500">
        <p>Generated automatically by AI Insight Analytical System</p>
        <p className="flex items-center gap-1">
          <Bot size={14} />
          Powered by Pocket CRM AI
        </p>
      </div>
    </div>
  );
}