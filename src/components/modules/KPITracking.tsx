import { BarChart3, TrendingUp, TrendingDown, Target, Calendar, Download, Filter, Plus, X, Pencil, Trash2, Sparkles, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getStatusColor, formatName, formatNumberWithCommas, formatInputWithCommas, removeCommas } from '../lib/utils';
import { useCurrency } from '../lib/currency-context';
import { useAuth } from '../lib/auth-context';
import { toast } from 'sonner@2.0.3';
import { DataModeBanner } from './DataModeBanner';
import { useKPITracking } from '../lib/use-data';
import { UserViewBanner } from './shared/UserViewBanner';
import { CurrencyInput } from './shared/CurrencyInput';

interface KPI {
  id?: number;
  name: string;
  category: string;
  currentValue: string;
  targetValue: string;
  unit: string;
  description: string;
  frequency: string;
  owner: string;
  active: boolean;
  productName?: string; // For Sales Volume category
  performance?: number;
  trend?: string;
  change?: string;
  status?: string;
}

export function KPITracking() {
  const { currencySymbol } = useCurrency();
  const { user, selectedUserId, isAdmin } = useAuth();
  const { records: kpis, loading, create, update, remove } = useKPITracking();
  const [timeRange, setTimeRange] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [deletingKPI, setDeletingKPI] = useState<KPI | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  // Remove sample KPI tracking - no longer needed
  const [isCustomKPIName, setIsCustomKPIName] = useState(false); // Track if user wants custom name
  const [newKPI, setNewKPI] = useState<KPI>({
    name: '',
    category: 'sales',
    currentValue: '',
    targetValue: '',
    unit: '',
    description: '',
    frequency: 'monthly',
    owner: '',
    active: true,
    productName: '',
  });

  const isViewingOtherUser = selectedUserId && selectedUserId !== user?.id;

  // Helper function to format numbers with commas
  const formatNumberWithCommas = (value: string | number): string => {
    const num = typeof value === 'string' ? value : value.toString();
    // Extract just the number part (remove currency symbols, %, etc.)
    const numberPart = num.replace(/[^0-9.-]/g, '');
    if (!numberPart) return num;
    
    const parts = numberPart.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Debug: Log KPI changes
  useEffect(() => {
    console.log('📊 [KPITracking] KPIs updated:', {
      totalKPIs: kpis.length,
      selectedUserId,
      isViewingOtherUser,
      isAdmin,
      viewingAllMembers: isAdmin && !selectedUserId,
      kpiSample: kpis.slice(0, 3).map(k => ({ 
        id: k.id, 
        name: k.name,
        _userId: (k as any)._userId, 
        _userName: (k as any)._userName 
      }))
    });
  }, [kpis, selectedUserId, user]);

  // Calculate performance metrics
  const calculatePerformance = (current: string, target: string, unit: string): number => {
    const currentNum = parseFloat(current.replace(/[^0-9.-]/g, ''));
    const targetNum = parseFloat(target.replace(/[^0-9.-]/g, ''));
    if (targetNum === 0) return 0;
    return (currentNum / targetNum) * 100;
  };

  const determineStatus = (performance: number): string => {
    if (performance >= 100) return 'exceeding';
    if (performance >= 80) return 'on-track';
    return 'at-risk';
  };

  const kpiCategories = [
    { id: 'all', label: 'All KPIs' },
    { id: 'sales', label: 'Sales' },
    { id: 'salesVolume', label: 'Sales Volume' },
    { id: 'customer', label: 'Customer' },
    { id: 'finance', label: 'Finance' },
    { id: 'operations', label: 'Operations' },
    { id: 'marketing', label: 'Marketing' },
  ];

  // Built-in KPI names organized by category
  const builtInKPIs: Record<string, string[]> = {
    sales: [
      'Monthly Revenue',
      'Annual Revenue',
      'Revenue Growth Rate',
      'Average Deal Size',
      'Sales Conversion Rate',
      'New Customer Acquisition',
      'Upsell Conversion Rate',
    ],
    salesVolume: [
      'Units Sold',
      'Product Sales Volume',
      'Sales by Product Line',
      'Monthly Sales Volume',
      'Quarterly Sales Volume',
    ],
    customer: [
      'Customer Retention Rate',
      'Customer Satisfaction Score (CSAT)',
      'Net Promoter Score (NPS)',
      'Customer Lifetime Value (CLV)',
      'Churn Rate',
      'Customer Acquisition Cost (CAC)',
      'Average Satisfaction Score',
      'Price Protection Adoption',
    ],
    finance: [
      'Debt Collection Rate',
      'Average Payment Time',
      'Outstanding Receivables',
      'Profit Margin',
      'Cash Flow',
      'Days Sales Outstanding (DSO)',
      'Operating Expenses',
    ],
    operations: [
      'Response Time',
      'AI Automation Rate',
      'Process Efficiency',
      'Order Fulfillment Time',
      'Inventory Turnover',
      'Average Processing Time',
      'Service Level Agreement (SLA) Compliance',
    ],
    marketing: [
      'Lead Generation',
      'Marketing ROI',
      'Campaign Conversion Rate',
      'Website Traffic',
      'Email Open Rate',
      'Social Media Engagement',
      'Cost Per Lead (CPL)',
    ],
  };

  // No sample data - show only real KPIs
  const monthlyTrends: any[] = [];
  const departmentPerformance: any[] = [];

  const getStatusConfig = (status: string) => {
    const configs = {
      exceeding: { bg: 'bg-green-100', text: 'text-green-700', label: 'Exceeding' },
      'on-track': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'On Track' },
      'at-risk': { bg: 'bg-red-100', text: 'text-red-700', label: 'At Risk' },
    };
    return configs[status as keyof typeof configs];
  };

  // Show only real KPIs from database
  const allKPIs = [
    ...kpis.map(kpi => {
      const performance = calculatePerformance(kpi.currentValue, kpi.targetValue, kpi.unit);
      const formattedCurrent = formatNumberWithCommas(kpi.currentValue);
      const formattedTarget = formatNumberWithCommas(kpi.targetValue);
      return {
        ...kpi,
        current: `${kpi.unit}${formattedCurrent}`,
        target: `${kpi.unit}${formattedTarget}`,
        performance,
        status: determineStatus(performance),
        trend: 'up',
        change: '+0%',
      };
    })
  ];

  const filteredKPIs = selectedCategory === 'all' 
    ? allKPIs 
    : allKPIs.filter(kpi => kpi.category === selectedCategory);

  // Calculate dynamic stats
  const totalKPIsCount = filteredKPIs.length;
  const exceedingCount = filteredKPIs.filter(kpi => kpi.status === 'exceeding').length;
  const onTrackCount = filteredKPIs.filter(kpi => kpi.status === 'on-track').length;
  const atRiskCount = filteredKPIs.filter(kpi => kpi.status === 'at-risk').length;
  const avgPerformanceValue = totalKPIsCount > 0 
    ? filteredKPIs.reduce((sum, kpi) => sum + (kpi.performance || 0), 0) / totalKPIsCount 
    : 0;

  // Generate AI Insights based on real data only
  const generateInsights = () => {
    const insights = {
      daily: [] as string[],
      monthly: [] as string[],
      threeMonth: [] as string[],
      sixMonth: [] as string[],
      twelveMonth: [] as string[]
    };

    // Calculate stats from real data
    const totalKPIs = filteredKPIs.length;
    const exceedingKPIs = filteredKPIs.filter(kpi => kpi.status === 'exceeding').length;
    const onTrackKPIs = filteredKPIs.filter(kpi => kpi.status === 'on-track').length;
    const atRiskKPIs = filteredKPIs.filter(kpi => kpi.status === 'at-risk').length;
    const avgPerformance = totalKPIs > 0 ? filteredKPIs.reduce((sum, kpi) => sum + (kpi.performance || 0), 0) / totalKPIs : 0;

    if (totalKPIs === 0) {
      // No KPIs yet - show helpful message
      insights.daily.push(`No KPIs tracked yet - start by adding your first KPI to get AI insights`);
      insights.monthly.push(`Add KPIs to track your business performance metrics`);
      insights.threeMonth.push(`Set up quarterly targets to get trend analysis`);
      insights.sixMonth.push(`Build historical data for comprehensive insights`);
      insights.twelveMonth.push(`Track annual performance with year-over-year comparisons`);
      return insights;
    }

    // Daily insights - based on current real data
    insights.daily.push(`Today's performance snapshot: ${exceedingKPIs} KPIs exceeding, ${onTrackKPIs} on track, ${atRiskKPIs} at risk`);
    
    if (avgPerformance > 0) {
      insights.daily.push(`Real-time system health score: ${avgPerformance.toFixed(1)}% - ${avgPerformance >= 90 ? 'Excellent' : avgPerformance >= 80 ? 'Good' : 'Needs attention'}`);
    }

    // Monthly insights - based on real performance
    if (totalKPIs > 0) {
      if (exceedingKPIs > totalKPIs * 0.5) {
        insights.monthly.push(`Strong performance this month with ${exceedingKPIs} out of ${totalKPIs} KPIs exceeding targets (${Math.round(exceedingKPIs/totalKPIs * 100)}%)`);
      } else if (atRiskKPIs > totalKPIs * 0.3) {
        insights.monthly.push(`${atRiskKPIs} KPIs need attention this month - consider resource reallocation`);
      } else {
        insights.monthly.push(`Balanced performance with ${onTrackKPIs} KPIs on track - steady progress`);
      }

      if (avgPerformance >= 95) {
        insights.monthly.push(`Overall performance at ${avgPerformance.toFixed(1)}% - exceptional execution across the board`);
      } else if (avgPerformance < 80) {
        insights.monthly.push(`Overall performance at ${avgPerformance.toFixed(1)}% - below target, review action plans`);
      } else {
        insights.monthly.push(`Overall performance at ${avgPerformance.toFixed(1)}% - good progress toward goals`);
      }
    }

    // 3-Month insights
    if (atRiskKPIs > 0) {
      const atRiskNames = filteredKPIs.filter(kpi => kpi.status === 'at-risk').slice(0, 2).map(kpi => kpi.name).join(', ');
      insights.threeMonth.push(`Focus areas for improvement: ${atRiskNames}`);
    } else {
      insights.threeMonth.push(`All KPIs performing well - maintain current strategies`);
    }

    // 6-Month insights
    if (exceedingKPIs > 0) {
      insights.sixMonth.push(`${exceedingKPIs} KPIs consistently exceeding targets - strong execution`);
    }
    
    if (atRiskKPIs > 0) {
      insights.sixMonth.push(`${atRiskKPIs} KPIs need strategic intervention for improvement`);
    }

    // 12-Month insights
    insights.twelveMonth.push(`Tracking ${totalKPIs} KPIs with ${Math.round(avgPerformance)}% average performance`);
    
    if (exceedingKPIs > 0) {
      insights.twelveMonth.push(`${exceedingKPIs} high-performing KPIs demonstrating business strength`);
    }

    return insights;
  };

  const aiInsights = generateInsights();

  const handleCreateKPI = async () => {
    try {
      console.log('Creating KPI with data:', newKPI);
      await create(newKPI);
      
      setShowCreateModal(false);
      setNewKPI({
        name: '',
        category: 'sales',
        currentValue: '',
        targetValue: '',
        unit: '',
        description: '',
        frequency: 'monthly',
        owner: '',
        active: true,
        productName: '',
      });
    } catch (error) {
      console.error('Error creating KPI:', error);
      // Error toast already shown by hook
    }
  };

  const handleEditKPI = (kpi: any) => {
    console.log('Edit KPI clicked:', kpi);
    setEditingKPI(kpi);
    const formData = {
      name: kpi.name,
      category: kpi.category,
      currentValue: kpi.currentValue || '',
      targetValue: kpi.targetValue || '',
      unit: kpi.unit || '',
      description: kpi.description || '',
      frequency: kpi.frequency || 'monthly',
      owner: kpi.owner || '',
      active: kpi.active !== false,
      productName: kpi.productName || '',
    };
    console.log('Populated form with:', formData);
    setNewKPI(formData);
    
    // Check if the KPI name is a built-in one or custom
    const isBuiltIn = builtInKPIs[kpi.category]?.includes(kpi.name);
    setIsCustomKPIName(!isBuiltIn);
    
    setShowEditModal(true);
  };

  const handleUpdateKPI = async () => {
    if (!editingKPI?.id) {
      console.error('No KPI selected for editing');
      toast.error('No KPI selected for editing');
      return;
    }
    
    try {
      console.log('Updating KPI:', editingKPI.id, newKPI);
      
      await update(editingKPI.id, newKPI);
      
      setShowEditModal(false);
      setEditingKPI(null);
      setNewKPI({
        name: '',
        category: 'sales',
        currentValue: '',
        targetValue: '',
        unit: '',
        description: '',
        frequency: 'monthly',
        owner: '',
        active: true,
        productName: '',
      });
    } catch (error: any) {
      console.error('Error updating KPI:', error);
      // Error toast already shown by hook
    }
  };

  const handleDeleteKPI = async () => {
    if (!deletingKPI?.id) {
      toast.error('Cannot delete KPI without ID');
      setShowDeleteModal(false);
      setDeletingKPI(null);
      return;
    }
    
    try {
      await remove(deletingKPI.id);
      
      setShowDeleteModal(false);
      setDeletingKPI(null);
    } catch (error) {
      console.error('Error deleting KPI:', error);
      // Error toast already shown by hook
      setShowDeleteModal(false);
      setDeletingKPI(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* User View Banner - shows when admin is viewing another user */}
      <UserViewBanner />
      
      {/* Data Mode Banner */}
      <DataModeBanner recordCount={kpis.length} entityName="KPIs" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-2">KPI Tracking Dashboard</h2>
          <p className="text-gray-600">
            Monitor key performance indicators across all business areas
            {kpis.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                {kpis.length} Custom KPI{kpis.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setIsCustomKPIName(false);
            }}
            disabled={isViewingOtherUser}
            className={`px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 ${
              isViewingOtherUser ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={isViewingOtherUser ? 'Cannot create KPIs while viewing another user' : 'Create new KPI'}
          >
            <Plus size={20} />
            Create KPI
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download size={20} />
            Export
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <p className="text-sm text-green-100 mb-1">KPIs Exceeding Target</p>
          <p className="text-3xl mb-2">{exceedingCount}</p>
          <p className="text-xs text-green-100">
            {totalKPIsCount > 0 ? Math.round((exceedingCount / totalKPIsCount) * 100) : 0}% of all KPIs
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-sm text-blue-100 mb-1">KPIs On Track</p>
          <p className="text-3xl mb-2">{onTrackCount}</p>
          <p className="text-xs text-blue-100">
            {totalKPIsCount > 0 ? Math.round((onTrackCount / totalKPIsCount) * 100) : 0}% of all KPIs
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <p className="text-sm text-red-100 mb-1">KPIs At Risk</p>
          <p className="text-3xl mb-2">{atRiskCount}</p>
          <p className="text-xs text-red-100">
            {totalKPIsCount > 0 ? Math.round((atRiskCount / totalKPIsCount) * 100) : 0}% need attention
          </p>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl p-6 text-white">
          <p className="text-sm text-pink-100 mb-1">Overall Performance</p>
          <p className="text-3xl mb-2">{avgPerformanceValue.toFixed(0)}%</p>
          <p className="text-xs text-pink-100">Average across all KPIs</p>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 overflow-hidden">
        <div 
          className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/50 transition-colors"
          onClick={() => setShowInsights(!showInsights)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg flex items-center gap-2">
                AI Performance Insights
                <span className="px-2 py-0.5 bg-purple-500 text-white rounded-full text-xs">
                  Auto-Generated
                </span>
              </h3>
              <p className="text-sm text-gray-600">Daily, Monthly, 3-Month, 6-Month & 12-Month Trend Analysis</p>
            </div>
          </div>
          {showInsights ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {showInsights && (
          <div className="px-5 pb-5 space-y-4">
            {/* Daily Insights */}
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-emerald-600" />
                <h4 className="text-sm text-emerald-700">Daily Performance (Real-Time)</h4>
              </div>
              <ul className="space-y-2">
                {aiInsights.daily.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Monthly Insights */}
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-purple-600" />
                <h4 className="text-sm text-purple-700">Monthly Performance (Current Month)</h4>
              </div>
              <ul className="space-y-2">
                {aiInsights.monthly.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3-Month Insights */}
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-blue-600" />
                <h4 className="text-sm text-blue-700">3-Month Trends (Quarterly View)</h4>
              </div>
              <ul className="space-y-2">
                {aiInsights.threeMonth.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 6-Month Insights */}
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-pink-600" />
                <h4 className="text-sm text-pink-700">6-Month Trends (Half-Year Analysis)</h4>
              </div>
              <ul className="space-y-2">
                {aiInsights.sixMonth.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-pink-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 12-Month Insights */}
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-orange-600" />
                <h4 className="text-sm text-orange-700">12-Month Trends (Annual Overview)</h4>
              </div>
              <ul className="space-y-2">
                {aiInsights.twelveMonth.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-gray-600" />
        {kpiCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === cat.id
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading KPIs...</p>
        </div>
      ) : filteredKPIs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <BarChart3 size={48} className="text-gray-400 mb-4" />
          <h3 className="text-lg text-gray-700 mb-2">No KPIs Yet</h3>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
            Start tracking your key performance indicators by creating your first KPI. Monitor sales, customer satisfaction, operations, and more.
          </p>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setIsCustomKPIName(false);
            }}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus size={20} />
            Create Your First KPI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredKPIs.map((kpi, idx) => {
            const statusConfig = getStatusConfig(kpi.status);
            const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
            const isCustomKPI = !!kpi.id;

            return (
              <div
                key={kpi.id || idx}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-pink-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-gray-600">{formatName(kpi.name)}</p>
                      {/* Show team member name when viewing all members */}
                      {!selectedUserId && (kpi as any)._userName && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 flex items-center gap-1">
                          <UserCheck size={12} />
                          {formatName((kpi as any)._userName)}
                        </span>
                      )}
                      {kpi.active !== false && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                      {isCustomKPI && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                          Custom
                        </span>
                      )}
                    </div>
                    {kpi.category === 'salesVolume' && kpi.productName && (
                      <p className="text-xs text-gray-500 mb-1">Product: {formatName(kpi.productName)}</p>
                    )}
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl">{kpi.current.includes(',') ? kpi.current : (kpi.unit ? kpi.unit : '') + formatNumberWithCommas(kpi.currentValue || kpi.current)}</p>
                      <span className="text-sm text-gray-500">/ {kpi.target.includes(',') ? kpi.target : (kpi.unit ? kpi.unit : '') + formatNumberWithCommas(kpi.targetValue || kpi.target)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditKPI(kpi)}
                        disabled={isViewingOtherUser}
                        className={`p-1.5 rounded-lg transition-colors group hover:bg-blue-50 ${
                          isViewingOtherUser ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title={isViewingOtherUser ? 'Cannot edit while viewing another user' : 'Edit KPI'}
                      >
                        <Pencil size={16} className="text-gray-400 group-hover:text-blue-600" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingKPI(kpi);
                          setShowDeleteModal(true);
                        }}
                        disabled={isViewingOtherUser}
                        className={`p-1.5 rounded-lg transition-colors group hover:bg-red-50 ${
                          isViewingOtherUser ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title={isViewingOtherUser ? 'Cannot delete while viewing another user' : 'Delete KPI'}
                      >
                        <Trash2 size={16} className="text-gray-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.label}
                  </span>
                  <div className={`flex items-center gap-1 text-xs ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon size={14} />
                    <span>{kpi.change}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Progress to Target</span>
                  <span className="">{(kpi.performance || 0).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (kpi.performance || 0) >= 100 ? 'bg-green-500' :
                      (kpi.performance || 0) >= 80 ? 'bg-blue-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(kpi.performance || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Monthly Trends Chart - Hidden when no data */}
      {monthlyTrends.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-pink-500" />
            6-Month Performance Trends
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Monthly Revenue (in {currencySymbol}K)</p>
              <div className="flex items-end justify-between h-48 gap-2">
                {monthlyTrends.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-gradient-to-t from-pink-500 to-pink-300 rounded-t-lg"
                        style={{ height: `${(data.revenue / 300) * 180}px` }}
                      ></div>
                      <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs">
                        {currencySymbol}{data.revenue}K
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Satisfaction Trend */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Customer Satisfaction Score</p>
              <div className="flex items-end justify-between h-48 gap-2">
                {monthlyTrends.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-lg"
                        style={{ height: `${(data.satisfaction / 5) * 180}px` }}
                      ></div>
                      <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs">
                        {data.satisfaction}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Performance - Hidden when no data */}
      {departmentPerformance.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <Target size={20} className="text-pink-500" />
            Department Performance Breakdown
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {departmentPerformance.map((dept, idx) => (
            <div key={idx} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm">{dept.department}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Overall:</span>
                  <span className={`text-sm ${
                    dept.overall >= 90 ? 'text-green-600' :
                    dept.overall >= 75 ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    {dept.overall}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className={`h-2 rounded-full ${
                    dept.overall >= 90 ? 'bg-green-500' :
                    dept.overall >= 75 ? 'bg-blue-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${dept.overall}%` }}
                ></div>
              </div>
              <div className="space-y-2">
                {dept.kpis.map((kpi, kpiIdx) => {
                  const kpiStatus = getStatusConfig(kpi.status);
                  return (
                    <div key={kpiIdx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{kpi.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="">{kpi.value}</span>
                        <span className={`w-2 h-2 rounded-full ${kpiStatus.bg}`}></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            ))}
        </div>
      </div>
      )}

      {/* AI Insights - Hidden until we have real insights based on data */}
      {filteredKPIs.length > 0 && false && (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200">
          <h3 className="text-lg mb-4">AI-Powered KPI Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm mb-2">⚠️ Action Required</p>
              <p className="text-xs text-gray-700 mb-2">
                New customer acquisition is 23% below target. Review sales strategies and increase marketing budget.
              </p>
              <button className="text-xs text-pink-600 hover:text-pink-700">View Recommendations →</button>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm mb-2">🎯 Exceeding Goals</p>
              <p className="text-xs text-gray-700 mb-2">
                Customer satisfaction up 0.4 points. Consider case studies to leverage in marketing campaigns.
              </p>
              <button className="text-xs text-pink-600 hover:text-pink-700">Create Campaign →</button>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm mb-2">📈 Trending Positive</p>
              <p className="text-xs text-gray-700 mb-2">
                Debt collection rate improved 5%. Continue current AI-assisted follow-up strategy.
              </p>
              <button className="text-xs text-pink-600 hover:text-pink-700">View Details →</button>
            </div>
          </div>
        </div>
      )}

      {/* Create KPI Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl mb-1">Create New KPI</h3>
                <p className="text-sm text-white/80">Define a new key performance indicator to track</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setIsCustomKPIName(false);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* KPI Name */}
              <div>
                <label className="block text-sm mb-2">
                  KPI Name <span className="text-red-500">*</span>
                </label>
                {!isCustomKPIName ? (
                  <select
                    value={newKPI.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '__custom__') {
                        setIsCustomKPIName(true);
                        setNewKPI({ ...newKPI, name: '' });
                      } else {
                        setNewKPI({ ...newKPI, name: value });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Select a KPI...</option>
                    {builtInKPIs[newKPI.category]?.map((kpiName) => (
                      <option key={kpiName} value={kpiName}>
                        {kpiName}
                      </option>
                    ))}
                    <option value="__custom__">✏️ Custom KPI Name...</option>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newKPI.name}
                      onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
                      placeholder="e.g., My Custom KPI"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomKPIName(false);
                        setNewKPI({ ...newKPI, name: '' });
                      }}
                      className="text-xs text-gray-600 hover:text-pink-600"
                    >
                      ← Back to built-in KPIs
                    </button>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newKPI.category}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setNewKPI({ 
                      ...newKPI, 
                      category: newCategory,
                      name: '', // Reset name when category changes
                      // Auto-set unit to "pcs" for Sales Volume
                      unit: newCategory === 'salesVolume' ? 'pcs' : newKPI.unit
                    });
                    setIsCustomKPIName(false); // Reset to built-in when category changes
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="sales">Sales</option>
                  <option value="salesVolume">Sales Volume</option>
                  <option value="customer">Customer</option>
                  <option value="finance">Finance</option>
                  <option value="operations">Operations</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>

              {/* Product Name - Only show for Sales Volume */}
              {newKPI.category === 'salesVolume' && (
                <div>
                  <label className="block text-sm mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newKPI.productName || ''}
                    onChange={(e) => setNewKPI({ ...newKPI, productName: e.target.value })}
                    placeholder="e.g., Premium Widget X200"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}

              {/* Values Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">
                    Current Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formatInputWithCommas(newKPI.currentValue)}
                    onChange={(e) => setNewKPI({ ...newKPI, currentValue: removeCommas(e.target.value) })}
                    placeholder="e.g., 284,500"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">
                    Target Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formatInputWithCommas(newKPI.targetValue)}
                    onChange={(e) => setNewKPI({ ...newKPI, targetValue: removeCommas(e.target.value) })}
                    placeholder="e.g., 300,000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm mb-2">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={newKPI.unit}
                  onChange={(e) => setNewKPI({ ...newKPI, unit: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select unit...</option>
                  <option value={currencySymbol}>Currency ({currencySymbol})</option>
                  <option value="%">Percentage (%)</option>
                  <option value="count">Count (Number)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="days">Days</option>
                  <option value="hours">Hours</option>
                  <option value="rating">Rating (1-5)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm mb-2">
                  Tracking Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={newKPI.frequency}
                  onChange={(e) => setNewKPI({ ...newKPI, frequency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* Owner */}
              <div>
                <label className="block text-sm mb-2">
                  Owner/Responsible Person
                </label>
                <input
                  type="text"
                  value={newKPI.owner}
                  onChange={(e) => setNewKPI({ ...newKPI, owner: e.target.value })}
                  placeholder="e.g., Sales Manager"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Active Status */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm mb-1">
                      Active Status
                    </label>
                    <p className="text-xs text-gray-600">
                      {newKPI.active ? 'This KPI is currently active and will be tracked' : 'This KPI is inactive and will not be tracked'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewKPI({ ...newKPI, active: !newKPI.active })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      newKPI.active ? 'bg-pink-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        newKPI.active ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm mb-2">
                  Description
                </label>
                <textarea
                  value={newKPI.description}
                  onChange={(e) => setNewKPI({ ...newKPI, description: e.target.value })}
                  placeholder="Describe what this KPI measures and why it's important..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  💡 <strong>Tip:</strong> Make sure your KPI is SMART - Specific, Measurable, Achievable, Relevant, and Time-bound.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleCreateKPI}
                  disabled={
                    !newKPI.name || 
                    !newKPI.currentValue || 
                    !newKPI.targetValue || 
                    !newKPI.unit ||
                    (newKPI.category === 'salesVolume' && !newKPI.productName)
                  }
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Create KPI
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setIsCustomKPIName(false);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit KPI Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl mb-1">Edit KPI</h3>
                <p className="text-sm text-white/80">Update key performance indicator details</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingKPI(null);
                  setIsCustomKPIName(false);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* KPI Name */}
              <div>
                <label className="block text-sm mb-2">
                  KPI Name <span className="text-red-500">*</span>
                </label>
                {!isCustomKPIName ? (
                  <select
                    value={newKPI.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '__custom__') {
                        setIsCustomKPIName(true);
                        setNewKPI({ ...newKPI, name: '' });
                      } else {
                        setNewKPI({ ...newKPI, name: value });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a KPI...</option>
                    {builtInKPIs[newKPI.category]?.map((kpiName) => (
                      <option key={kpiName} value={kpiName}>
                        {kpiName}
                      </option>
                    ))}
                    <option value="__custom__">✏️ Custom KPI Name...</option>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newKPI.name}
                      onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
                      placeholder="e.g., My Custom KPI"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomKPIName(false);
                        setNewKPI({ ...newKPI, name: '' });
                      }}
                      className="text-xs text-gray-600 hover:text-blue-600"
                    >
                      ← Back to built-in KPIs
                    </button>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newKPI.category}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setNewKPI({ 
                      ...newKPI, 
                      category: newCategory,
                      name: '', // Reset name when category changes
                      // Auto-set unit to "pcs" for Sales Volume
                      unit: newCategory === 'salesVolume' ? 'pcs' : newKPI.unit
                    });
                    setIsCustomKPIName(false); // Reset to built-in when category changes
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sales">Sales</option>
                  <option value="salesVolume">Sales Volume</option>
                  <option value="customer">Customer</option>
                  <option value="finance">Finance</option>
                  <option value="operations">Operations</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>

              {/* Product Name - Only show for Sales Volume */}
              {newKPI.category === 'salesVolume' && (
                <div>
                  <label className="block text-sm mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newKPI.productName || ''}
                    onChange={(e) => setNewKPI({ ...newKPI, productName: e.target.value })}
                    placeholder="e.g., Premium Widget X200"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Values Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">
                    Current Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formatInputWithCommas(newKPI.currentValue)}
                    onChange={(e) => setNewKPI({ ...newKPI, currentValue: removeCommas(e.target.value) })}
                    placeholder="e.g., 284,500"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">
                    Target Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formatInputWithCommas(newKPI.targetValue)}
                    onChange={(e) => setNewKPI({ ...newKPI, targetValue: removeCommas(e.target.value) })}
                    placeholder="e.g., 300,000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm mb-2">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={newKPI.unit}
                  onChange={(e) => setNewKPI({ ...newKPI, unit: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select unit...</option>
                  <option value={currencySymbol}>Currency ({currencySymbol})</option>
                  <option value="%">Percentage (%)</option>
                  <option value="count">Count (Number)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="days">Days</option>
                  <option value="hours">Hours</option>
                  <option value="rating">Rating (1-5)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm mb-2">
                  Tracking Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={newKPI.frequency}
                  onChange={(e) => setNewKPI({ ...newKPI, frequency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* Owner */}
              <div>
                <label className="block text-sm mb-2">
                  Owner/Responsible Person
                </label>
                <input
                  type="text"
                  value={newKPI.owner}
                  onChange={(e) => setNewKPI({ ...newKPI, owner: e.target.value })}
                  placeholder="e.g., Sales Manager"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Active Status */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm mb-1">
                      Active Status
                    </label>
                    <p className="text-xs text-gray-600">
                      {newKPI.active ? 'This KPI is currently active and will be tracked' : 'This KPI is inactive and will not be tracked'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewKPI({ ...newKPI, active: !newKPI.active })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      newKPI.active ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        newKPI.active ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm mb-2">
                  Description
                </label>
                <textarea
                  value={newKPI.description}
                  onChange={(e) => setNewKPI({ ...newKPI, description: e.target.value })}
                  placeholder="Describe what this KPI measures and why it's important..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleUpdateKPI}
                  disabled={
                    !newKPI.name || 
                    !newKPI.currentValue || 
                    !newKPI.targetValue || 
                    !newKPI.unit ||
                    (newKPI.category === 'salesVolume' && !newKPI.productName)
                  }
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Pencil size={20} />
                  Update KPI
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingIndex(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-6 rounded-t-xl">
              <h3 className="text-xl mb-1">Delete KPI</h3>
              <p className="text-sm text-white/80">This action cannot be undone</p>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <div>
                  <p className="mb-2">
                    Are you sure you want to delete this KPI?
                  </p>
                  <p className="text-sm text-gray-600">
                    {deletingKPI && (
                      <span className="font-medium">{formatName(deletingKPI.name)}</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    All historical data and tracking information will be permanently removed.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteKPI}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Delete KPI
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingKPI(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
