import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Plus,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Megaphone,
  Brain,
  Settings,
  Handshake,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Star,
  RefreshCw,
  Database,
  Zap
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useIntegratedKPIData, IntegratedKPIData } from '@/hooks/useIntegratedKPIData';

type KPICategory = 'overview' | 'customers' | 'sales' | 'marketing' | 'customer-performance' | 'operations' | 'team' | 'debt-collection';

export const KPITracking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<KPICategory>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    currentValue: '',
    targetValue: '',
    unit: '',
  });
  const { metrics: integratedMetrics, loading: integratedLoading, refreshData } = useIntegratedKPIData();

  const kpiCategories = [
    { id: 'overview' as KPICategory, name: 'Overview', icon: BarChart3, color: 'bg-blue-500' },
    { id: 'customers' as KPICategory, name: 'Customers', icon: Users, color: 'bg-green-500' },
    { id: 'sales' as KPICategory, name: 'Sales', icon: DollarSign, color: 'bg-purple-500' },
    { id: 'marketing' as KPICategory, name: 'Marketing', icon: Megaphone, color: 'bg-orange-500' },
    { id: 'customer-performance' as KPICategory, name: 'Customer Performance', icon: Brain, color: 'bg-pink-500' },
    { id: 'operations' as KPICategory, name: 'Operations', icon: Settings, color: 'bg-indigo-500' },
    { id: 'team' as KPICategory, name: 'Team', icon: Handshake, color: 'bg-teal-500' },
    { id: 'debt-collection' as KPICategory, name: 'Debt Collection', icon: CreditCard, color: 'bg-red-500' },
  ];

  const [kpis, setKpis] = useState<Array<{
    name: string;
    value: string;
    target: string;
    unit: string;
    progress: number;
    trend: string;
    category: KPICategory;
    startDate?: string;
    endDate?: string;
    status: 'not-started' | 'in-progress' | 'completed';
  }>>(() => {
    // Load KPIs from localStorage on initial render
    try {
      const saved = localStorage.getItem('kpis');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load KPIs from localStorage:', error);
      return [];
    }
  });

  // Save KPIs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('kpis', JSON.stringify(kpis));
    } catch (error) {
      console.error('Failed to save KPIs to localStorage:', error);
    }
  }, [kpis]);

  // Business health data - calculated from actual KPIs
  const businessHealthScore = kpis.length > 0 ? Math.round(kpis.reduce((sum, kpi) => sum + kpi.progress, 0) / kpis.length) : 0;
  const businessHealthTrend = kpis.length > 0 ? '+0%' : 'No data';

  // Generate AI insights for customer KPIs
  const generateCustomerInsights = () => {
    const customerKpis = kpis.filter(kpi => kpi.category === 'customers');
    if (customerKpis.length === 0) return [];

    const insights = [];
    const avgProgress = customerKpis.reduce((sum, kpi) => sum + kpi.progress, 0) / customerKpis.length;
    const highPerformingKpis = customerKpis.filter(kpi => kpi.progress >= 80);
    const lowPerformingKpis = customerKpis.filter(kpi => kpi.progress < 60);
    const improvingKpis = customerKpis.filter(kpi => kpi.trend.startsWith('+'));

    // Insight 1: Overall performance analysis
    if (avgProgress >= 80) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Strong Customer Performance',
        message: `Your customer KPIs are performing excellently with an average of ${Math.round(avgProgress)}% target achievement. Consider scaling successful strategies.`
      });
    } else if (avgProgress >= 60) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Customer Metrics Need Attention',
        message: `Customer KPIs are at ${Math.round(avgProgress)}% of targets. Focus on improving retention and acquisition strategies.`
      });
    } else {
      insights.push({
        type: 'danger',
        icon: AlertTriangle,
        title: 'Customer Performance Critical',
        message: `Customer KPIs are significantly below targets at ${Math.round(avgProgress)}%. Immediate action required to improve customer metrics.`
      });
    }

    // Insight 2: High performers
    if (highPerformingKpis.length > 0) {
      insights.push({
        type: 'success',
        icon: Star,
        title: 'High-Performing Customer Metrics',
        message: `${highPerformingKpis.map(k => k.name).join(', ')} are exceeding expectations. Analyze what drives this success and apply to other areas.`
      });
    }

    // Insight 3: Areas needing improvement
    if (lowPerformingKpis.length > 0) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Customer Improvement Opportunities',
        message: `${lowPerformingKpis.map(k => k.name).join(', ')} need immediate attention. Consider customer feedback analysis and targeted improvements.`
      });
    }

    // Insight 4: Trend analysis
    if (improvingKpis.length > customerKpis.length / 2) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Positive Customer Trends',
        message: `Most customer KPIs are trending upward. Your improvement initiatives are showing results - continue current strategies.`
      });
    }

    // Insight 5: Retention focus (if applicable)
    const retentionKpi = customerKpis.find(k => k.name.toLowerCase().includes('retention') || k.name.toLowerCase().includes('churn'));
    if (retentionKpi) {
      if (retentionKpi.progress >= 85) {
        insights.push({
          type: 'success',
          icon: Users,
          title: 'Excellent Customer Retention',
          message: `Your customer retention is strong at ${retentionKpi.value}${retentionKpi.unit}. Focus on acquisition to grow your customer base.`
        });
      } else if (retentionKpi.progress < 70) {
        insights.push({
          type: 'warning',
          icon: Users,
          title: 'Retention Strategy Needed',
          message: `Customer retention at ${retentionKpi.value}${retentionKpi.unit} indicates potential churn issues. Implement loyalty programs and improve customer experience.`
        });
      }
    }

    return insights.slice(0, 3); // Limit to 3 insights for better UX
  };

  // Type definitions
  type KPI = {
    name: string;
    value: string;
    target: string;
    unit: string;
    progress: number;
    trend: string;
    category: KPICategory;
    startDate?: string;
    endDate?: string;
    status: 'not-started' | 'in-progress' | 'completed';
  };

  type CategoryConfig = {
    bgColor: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    progressColor: string;
  };

  // Timeline management functions
  const startKPI = (index: number) => {
    const updatedKpis = [...kpis];
    updatedKpis[index] = {
      ...updatedKpis[index],
      status: 'in-progress' as const,
      startDate: new Date().toISOString(),
    };
    setKpis(updatedKpis);
  };

  const completeKPI = (index: number) => {
    const updatedKpis = [...kpis];
    updatedKpis[index] = {
      ...updatedKpis[index],
      status: 'completed' as const,
      endDate: new Date().toISOString(),
    };
    setKpis(updatedKpis);
  };

  // Helper function to render KPI cards with timeline functionality
  const renderKPICard = (kpi: KPI, index: number, categoryConfig: CategoryConfig) => (
    <Card key={index} className="p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2 ${categoryConfig.bgColor} rounded-lg`}>
          <categoryConfig.icon className={`w-6 h-6 text-${categoryConfig.progressColor.split('-')[1]}-600`} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">{kpi.name}</h4>
          <p className="text-sm text-gray-600">{categoryConfig.label}</p>
        </div>
        {/* Timeline Status Badge */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          kpi.status === 'completed' ? 'bg-green-100 text-green-800' :
          kpi.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {kpi.status === 'completed' ? 'Completed' :
           kpi.status === 'in-progress' ? 'In Progress' :
           'Not Started'}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-2xl font-bold">{kpi.value} {kpi.unit}</span>
          <span className={`flex items-center ${kpi.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {kpi.trend.startsWith('+') ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {kpi.trend}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`${categoryConfig.progressColor} h-2 rounded-full`} style={{ width: `${kpi.progress}%` }}></div>
        </div>
        <p className="text-xs text-gray-500">Target: {kpi.target} {kpi.unit}</p>
        
        {/* Timeline Information */}
        {kpi.startDate && (
          <div className="text-xs text-gray-500 mt-2">
            Started: {new Date(kpi.startDate).toLocaleDateString()}
            {kpi.endDate && ` • Completed: ${new Date(kpi.endDate).toLocaleDateString()}`}
          </div>
        )}
        
        {/* Timeline Action Buttons */}
        <div className="flex space-x-2 mt-3">
          {kpi.status !== 'in-progress' && kpi.status !== 'completed' && (
            <Button
              onClick={() => startKPI(index)}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start
            </Button>
          )}
          {kpi.status === 'in-progress' && (
            <Button
              onClick={() => completeKPI(index)}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Complete
            </Button>
          )}
          {kpi.status === 'completed' && (
            <Button
              onClick={() => startKPI(index)}
              size="sm"
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
            >
              Restart
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.currentValue || !formData.targetValue || !formData.unit) {
      return;
    }

    const newKpi = {
      name: formData.name,
      value: formData.currentValue,
      target: formData.targetValue,
      unit: formData.unit,
      progress: Math.min((parseFloat(formData.currentValue) / parseFloat(formData.targetValue)) * 100, 100),
      trend: '+0%', // Default trend
      category: activeTab as KPICategory,
      status: 'not-started' as const,
    };

    setKpis(prev => [...prev, newKpi]);
    setFormData({ name: '', currentValue: '', targetValue: '', unit: '' });
    setShowAddModal(false);
  };

  const handleSyncIntegratedData = async () => {
    try {
      await refreshData();
      toast.success('Data refreshed from business modules');

      // Convert integrated metrics to KPI format and add them
      const categoryMap: Record<string, KPICategory> = {
        customers: 'customers',
        sales: 'sales',
        marketing: 'marketing',
        'customer-performance': 'customer-performance',
        operations: 'operations',
        team: 'team',
        'debt-collection': 'debt-collection'
      };

      const newKpis: typeof kpis = [];

      Object.entries(integratedMetrics).forEach(([category, metrics]) => {
        metrics.forEach((metric: IntegratedKPIData) => {
          const progress = Math.min((metric.currentValue / metric.targetValue) * 100, 100);
          const existingKpi = kpis.find(kpi =>
            kpi.name === metric.name && kpi.category === categoryMap[category]
          );

          if (!existingKpi) {
            newKpis.push({
              name: metric.name,
              value: metric.currentValue.toString(),
              target: metric.targetValue.toString(),
              unit: metric.unit,
              progress,
              trend: '+0%',
              category: categoryMap[category],
              status: (progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started') as 'completed' | 'in-progress' | 'not-started'
            });
          }
        });
      });

      if (newKpis.length > 0) {
        setKpis(prev => [...prev, ...newKpis]);
        toast.success(`Added ${newKpis.length} new KPIs from business modules`);
      } else {
        toast.info('All available KPIs are already synced');
      }
    } catch (error) {
      toast.error('Failed to sync data from business modules');
      console.error('Sync error:', error);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Business Health Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Business Health Score</h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">{businessHealthScore}%</span>
            <span className="text-sm text-green-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {businessHealthTrend}
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${businessHealthScore}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">
          Overall business performance across all key areas. Score based on KPI achievement and trend analysis.
        </p>
      </Card>

      {/* Data Integration Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Data Integration</h3>
              <p className="text-sm text-gray-600">Sync KPIs from business modules</p>
            </div>
          </div>
          <Button
            onClick={handleSyncIntegratedData}
            disabled={integratedLoading}
            className="flex items-center space-x-2"
          >
            {integratedLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{integratedLoading ? 'Syncing...' : 'Sync Data'}</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Customers: {integratedMetrics.customers.length} metrics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Sales: {integratedMetrics.sales.length} metrics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Marketing: {integratedMetrics.marketing.length} metrics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span>Customer Perf: {integratedMetrics.customerPerformance.length} metrics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span>Operations: {integratedMetrics.operations.length} metrics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <span>Team: {integratedMetrics.team.length} metrics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Debt Collection: {integratedMetrics.debtCollection.length} metrics</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Automatically pulls live data from Customers, Sales, Marketing, After Sales, Operations, Team, and Debt Collection modules.
        </p>
      </Card>

      {/* KPI Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCategories.slice(1).map((category) => {
          // Calculate average progress for this category
          const categoryKpis = kpis.filter(kpi => kpi.category === category.id);
          const avgProgress = categoryKpis.length > 0
            ? Math.round(categoryKpis.reduce((sum, kpi) => sum + kpi.progress, 0) / categoryKpis.length)
            : 0;

          return (
            <Card
              key={category.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab(category.id)}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${category.color}`}>
                  <category.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-medium">{category.name}</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Score</span>
                  <span className="font-medium">
                    {categoryKpis.length > 0 ? `${avgProgress}%` : 'No Data'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: categoryKpis.length > 0 ? `${avgProgress}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* AI Insights - Only show when KPIs exist */}
      {kpis.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">AI Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Brain className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">AI Analysis Coming Soon</p>
                <p className="text-sm text-gray-700">Add more KPIs across different categories to receive personalized AI-driven insights and recommendations.</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderCustomersKPIs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer KPIs</h2>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add KPI</span>
        </Button>
      </div>

      {/* Integrated Customer KPIs */}
      {integratedMetrics.customers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg font-semibold">Live Customer Metrics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integratedMetrics.customers.map((metric, index) => {
              const progress = Math.min((metric.currentValue / metric.targetValue) * 100, 100);
              const kpiData = {
                name: metric.name,
                value: metric.currentValue.toString(),
                target: metric.targetValue.toString(),
                unit: metric.unit,
                progress,
                trend: '+0%',
                category: 'customers' as KPICategory,
                status: (progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started') as 'completed' | 'in-progress' | 'not-started'
              };
              return renderKPICard(kpiData, index, {
                bgColor: 'bg-green-100',
                icon: Users,
                label: 'Customer Metric',
                progressColor: 'bg-green-500'
              });
            })}
          </div>
        </div>
      )}

      {/* User Added KPIs */}
      {kpis.filter(kpi => kpi.category === 'customers').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Customer KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.filter(kpi => kpi.category === 'customers').map((kpi) => 
              renderKPICard(kpi, kpis.findIndex(k => k === kpi), {
                bgColor: 'bg-green-100',
                icon: Users,
                label: 'Customer KPI',
                progressColor: 'bg-green-500'
              })
            )}
          </div>
        </div>
      )}

      {/* AI Insights for Customers - Only show when Customer KPIs exist */}
      {kpis.filter(kpi => kpi.category === 'customers').length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">AI Customer Insights</h3>
          </div>
          <div className="space-y-3">
            {generateCustomerInsights().map((insight, index) => (
              <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                insight.type === 'success' ? 'bg-green-50' :
                insight.type === 'warning' ? 'bg-yellow-50' :
                'bg-red-50'
              }`}>
                <insight.icon className={`w-5 h-5 mt-0.5 ${
                  insight.type === 'success' ? 'text-green-600' :
                  insight.type === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`} />
                <div>
                  <p className={`font-medium ${
                    insight.type === 'success' ? 'text-green-900' :
                    insight.type === 'warning' ? 'text-yellow-900' :
                    'text-red-900'
                  }`}>{insight.title}</p>
                  <p className={`text-sm ${
                    insight.type === 'success' ? 'text-green-700' :
                    insight.type === 'warning' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>{insight.message}</p>
                </div>
              </div>
            ))}
            {generateCustomerInsights().length === 0 && (
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Brain className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">AI Analysis Coming Soon</p>
                  <p className="text-sm text-gray-700">Add more KPIs to receive personalized AI-driven insights and recommendations.</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );

  const renderSalesKPIs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales KPIs</h2>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add KPI</span>
        </Button>
      </div>

      {/* Integrated Sales KPIs */}
      {integratedMetrics.sales.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg font-semibold">Live Sales Metrics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integratedMetrics.sales.map((metric, index) => {
              const progress = Math.min((metric.currentValue / metric.targetValue) * 100, 100);
              const kpiData = {
                name: metric.name,
                value: metric.currentValue.toString(),
                target: metric.targetValue.toString(),
                unit: metric.unit,
                progress,
                trend: '+0%',
                category: 'sales' as KPICategory,
                status: (progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started') as 'completed' | 'in-progress' | 'not-started'
              };
              return renderKPICard(kpiData, index, {
                bgColor: 'bg-purple-100',
                icon: DollarSign,
                label: 'Sales Metric',
                progressColor: 'bg-purple-500'
              });
            })}
          </div>
        </div>
      )}

      {/* User Added KPIs */}
      {kpis.filter(kpi => kpi.category === 'sales').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Sales KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.filter(kpi => kpi.category === 'sales').map((kpi) => 
              renderKPICard(kpi, kpis.findIndex(k => k === kpi), {
                bgColor: 'bg-purple-100',
                icon: DollarSign,
                label: 'Sales KPI',
                progressColor: 'bg-purple-500'
              })
            )}
          </div>
        </div>
      )}

      {/* AI Insights for Sales - Only show when Sales KPIs exist */}
      {kpis.filter(kpi => kpi.category === 'sales').length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">AI Sales Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Brain className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">AI Analysis Coming Soon</p>
                <p className="text-sm text-gray-700">Add more KPIs to receive personalized AI-driven insights and recommendations.</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderMarketingKPIs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Marketing KPIs</h2>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add KPI</span>
        </Button>
      </div>

      {/* Integrated Marketing KPIs */}
      {integratedMetrics.marketing.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg font-semibold">Live Marketing Metrics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integratedMetrics.marketing.map((metric, index) => {
              const progress = Math.min((metric.currentValue / metric.targetValue) * 100, 100);
              const kpiData = {
                name: metric.name,
                value: metric.currentValue.toString(),
                target: metric.targetValue.toString(),
                unit: metric.unit,
                progress,
                trend: '+0%',
                category: 'marketing' as KPICategory,
                status: (progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started') as 'completed' | 'in-progress' | 'not-started'
              };
              return renderKPICard(kpiData, index, {
                bgColor: 'bg-orange-100',
                icon: Megaphone,
                label: 'Marketing Metric',
                progressColor: 'bg-orange-500'
              });
            })}
          </div>
        </div>
      )}

      {/* User Added KPIs */}
      {kpis.filter(kpi => kpi.category === 'marketing').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Marketing KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.filter(kpi => kpi.category === 'marketing').map((kpi) => 
              renderKPICard(kpi, kpis.findIndex(k => k === kpi), {
                bgColor: 'bg-orange-100',
                icon: Megaphone,
                label: 'Marketing KPI',
                progressColor: 'bg-orange-500'
              })
            )}
          </div>
        </div>
      )}

      {/* AI Insights for Marketing - Only show when Marketing KPIs exist */}
      {kpis.filter(kpi => kpi.category === 'marketing').length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">AI Marketing Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Brain className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">AI Analysis Coming Soon</p>
                <p className="text-sm text-gray-700">Add more KPIs to receive personalized AI-driven insights and recommendations.</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderCustomerPerformanceKPIs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Performance KPIs</h2>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add KPI</span>
        </Button>
      </div>

      {/* Integrated Customer Performance KPIs */}
      {integratedMetrics.customerPerformance.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg font-semibold">Live Customer Performance Metrics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integratedMetrics.customerPerformance.map((metric, index) => {
              const progress = Math.min((metric.currentValue / metric.targetValue) * 100, 100);
              const kpiData = {
                name: metric.name,
                value: metric.currentValue.toString(),
                target: metric.targetValue.toString(),
                unit: metric.unit,
                progress,
                trend: '+0%',
                category: 'customer-performance' as KPICategory,
                status: (progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started') as 'completed' | 'in-progress' | 'not-started'
              };
              return renderKPICard(kpiData, index, {
                bgColor: 'bg-pink-100',
                icon: Brain,
                label: 'Customer Performance Metric',
                progressColor: 'bg-pink-500'
              });
            })}
          </div>
        </div>
      )}

      {/* User Added KPIs */}
      {kpis.filter(kpi => kpi.category === 'customer-performance').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Customer Performance KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.filter(kpi => kpi.category === 'customer-performance').map((kpi) => 
              renderKPICard(kpi, kpis.findIndex(k => k === kpi), {
                bgColor: 'bg-pink-100',
                icon: Brain,
                label: 'Customer Performance KPI',
                progressColor: 'bg-pink-500'
              })
            )}
          </div>
        </div>
      )}

      {/* AI Insights for Customer Performance - Only show when Customer Performance KPIs exist */}
      {kpis.filter(kpi => kpi.category === 'customer-performance').length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">AI Customer Performance Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Brain className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">AI Analysis Coming Soon</p>
                <p className="text-sm text-gray-700">Add more KPIs to receive personalized AI-driven insights and recommendations.</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderOperationsKPIs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Operations KPIs</h2>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add KPI</span>
        </Button>
      </div>

      {/* Integrated Operations KPIs */}
      {integratedMetrics.operations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg font-semibold">Live Operations Metrics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integratedMetrics.operations.map((metric, index) => {
              const progress = Math.min((metric.currentValue / metric.targetValue) * 100, 100);
              const kpiData = {
                name: metric.name,
                value: metric.currentValue.toString(),
                target: metric.targetValue.toString(),
                unit: metric.unit,
                progress,
                trend: '+0%',
                category: 'operations' as KPICategory,
                status: (progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started') as 'completed' | 'in-progress' | 'not-started'
              };
              return renderKPICard(kpiData, index, {
                bgColor: 'bg-indigo-100',
                icon: Settings,
                label: 'Operations Metric',
                progressColor: 'bg-indigo-500'
              });
            })}
          </div>
        </div>
      )}

      {/* User Added KPIs */}
      {kpis.filter(kpi => kpi.category === 'operations').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Operations KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.filter(kpi => kpi.category === 'operations').map((kpi) => 
              renderKPICard(kpi, kpis.findIndex(k => k === kpi), {
                bgColor: 'bg-indigo-100',
                icon: Settings,
                label: 'Operations KPI',
                progressColor: 'bg-indigo-500'
              })
            )}
          </div>
        </div>
      )}

      {/* AI Insights for Operations - Only show when Operations KPIs exist */}
      {kpis.filter(kpi => kpi.category === 'operations').length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">AI Operations Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Brain className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">AI Analysis Coming Soon</p>
                <p className="text-sm text-gray-700">Add more KPIs to receive personalized AI-driven insights and recommendations.</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderTeamKPIs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Team KPIs</h2>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add KPI</span>
        </Button>
      </div>

      {/* Integrated Team KPIs */}
      {integratedMetrics.team.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg font-semibold">Live Team Metrics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integratedMetrics.team.map((metric, index) => {
              const progress = Math.min((metric.currentValue / metric.targetValue) * 100, 100);
              const kpiData = {
                name: metric.name,
                value: metric.currentValue.toString(),
                target: metric.targetValue.toString(),
                unit: metric.unit,
                progress,
                trend: '+0%',
                category: 'team' as KPICategory,
                status: (progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started') as 'completed' | 'in-progress' | 'not-started'
              };
              return renderKPICard(kpiData, index, {
                bgColor: 'bg-teal-100',
                icon: Handshake,
                label: 'Team Metric',
                progressColor: 'bg-teal-500'
              });
            })}
          </div>
        </div>
      )}

      {/* User Added KPIs */}
      {kpis.filter(kpi => kpi.category === 'team').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Team KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.filter(kpi => kpi.category === 'team').map((kpi) => 
              renderKPICard(kpi, kpis.findIndex(k => k === kpi), {
                bgColor: 'bg-teal-100',
                icon: Handshake,
                label: 'Team KPI',
                progressColor: 'bg-teal-500'
              })
            )}
          </div>
        </div>
      )}

      {/* AI Insights for Team - Only show when Team KPIs exist */}
      {kpis.filter(kpi => kpi.category === 'team').length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">AI Team Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Brain className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">AI Analysis Coming Soon</p>
                <p className="text-sm text-gray-700">Add more KPIs to receive personalized AI-driven insights and recommendations.</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderDebtCollectionKPIs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Debt Collection KPIs</h2>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add KPI</span>
        </Button>
      </div>

      {/* Integrated Debt Collection KPIs */}
      {integratedMetrics.debtCollection.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg font-semibold">Live Debt Collection Metrics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integratedMetrics.debtCollection.map((metric, index) => {
              const progress = Math.min((metric.currentValue / metric.targetValue) * 100, 100);
              const kpiData = {
                name: metric.name,
                value: metric.currentValue.toString(),
                target: metric.targetValue.toString(),
                unit: metric.unit,
                progress,
                trend: '+0%',
                category: 'debt-collection' as KPICategory,
                status: (progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started') as 'completed' | 'in-progress' | 'not-started'
              };
              return renderKPICard(kpiData, index, {
                bgColor: 'bg-red-100',
                icon: CreditCard,
                label: 'Debt Collection Metric',
                progressColor: 'bg-red-500'
              });
            })}
          </div>
        </div>
      )}

      {/* User Added KPIs */}
      {kpis.filter(kpi => kpi.category === 'debt-collection').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Debt Collection KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.filter(kpi => kpi.category === 'debt-collection').map((kpi) => 
              renderKPICard(kpi, kpis.findIndex(k => k === kpi), {
                bgColor: 'bg-red-100',
                icon: CreditCard,
                label: 'Debt Collection KPI',
                progressColor: 'bg-red-500'
              })
            )}
          </div>
        </div>
      )}

      {/* AI Insights for Debt Collection - Only show when Debt Collection KPIs exist */}
      {kpis.filter(kpi => kpi.category === 'debt-collection').length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">AI Debt Collection Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Brain className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">AI Analysis Coming Soon</p>
                <p className="text-sm text-gray-700">Add more KPIs to receive personalized AI-driven insights and recommendations.</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'customers':
        return renderCustomersKPIs();
      case 'sales':
        return renderSalesKPIs();
      case 'marketing':
        return renderMarketingKPIs();
      case 'customer-performance':
        return renderCustomerPerformanceKPIs();
      case 'operations':
        return renderOperationsKPIs();
      case 'team':
        return renderTeamKPIs();
      case 'debt-collection':
        return renderDebtCollectionKPIs();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">KPI Center</h1>
        <p className="text-gray-600">Comprehensive business performance tracking and AI-driven insights</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          {kpiCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === category.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <category.icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Add KPI Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New KPI">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter KPI name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
              <Input
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                placeholder="Current value"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
              <Input
                type="number"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                placeholder="Target value"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <Input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="e.g., %, $, customers"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add KPI</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
