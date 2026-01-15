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
  BarChart,
  CheckCircle,
  AlertTriangle,
  Star
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

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
    };

    setKpis(prev => [...prev, newKpi]);
    setFormData({ name: '', currentValue: '', targetValue: '', unit: '' });
    setShowAddModal(false);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for when no KPIs are added */}
        {kpis.length === 0 && (
          <Card className="p-6 col-span-full">
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Customer KPIs Added</h3>
              <p className="text-gray-500 mb-4">Add your first customer KPI to start tracking performance metrics.</p>
              <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 mx-auto">
                <Plus className="w-4 h-4" />
                <span>Add Customer KPI</span>
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* User Added KPIs */}
      {kpis.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{kpi.name}</h4>
                    <p className="text-sm text-gray-600">Custom KPI</p>
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
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${kpi.progress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">Target: {kpi.target} {kpi.unit}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights for Customers - Only show when KPIs exist */}
      {kpis.length > 0 && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Empty State for Sales KPIs */}
        <Card className="p-6 col-span-full">
          <div className="text-center py-12">
            <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales KPIs Added</h3>
            <p className="text-gray-600 mb-6">Start tracking your sales performance by adding your first KPI.</p>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 mx-auto">
              <Plus className="w-4 h-4" />
              <span>Add Sales KPI</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* User Added KPIs */}
      {kpis.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{kpi.name}</h4>
                    <p className="text-sm text-gray-600">Custom KPI</p>
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
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${kpi.progress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">Target: {kpi.target} {kpi.unit}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights for Sales - Only show when KPIs exist */}
      {kpis.length > 0 && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Empty State for Marketing KPIs */}
        <Card className="p-6 col-span-full">
          <div className="text-center py-12">
            <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Marketing KPIs Added</h3>
            <p className="text-gray-600 mb-6">Start tracking your marketing performance by adding your first KPI.</p>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 mx-auto">
              <Plus className="w-4 h-4" />
              <span>Add Marketing KPI</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* User Added KPIs */}
      {kpis.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{kpi.name}</h4>
                    <p className="text-sm text-gray-600">Custom KPI</p>
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
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${kpi.progress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">Target: {kpi.target} {kpi.unit}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights for Marketing - Only show when KPIs exist */}
      {kpis.length > 0 && (
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

  const renderOperationsKPIs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Operations KPIs</h2>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add KPI</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Empty State for Operations KPIs */}
        <Card className="p-6 col-span-full">
          <div className="text-center py-12">
            <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Operations KPIs Added</h3>
            <p className="text-gray-600 mb-6">Start tracking your operational performance by adding your first KPI.</p>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 mx-auto">
              <Plus className="w-4 h-4" />
              <span>Add Operations KPI</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* User Added KPIs */}
      {kpis.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{kpi.name}</h4>
                    <p className="text-sm text-gray-600">Custom KPI</p>
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
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${kpi.progress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">Target: {kpi.target} {kpi.unit}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights for Operations - Only show when KPIs exist */}
      {kpis.length > 0 && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Empty State for Team KPIs */}
        <Card className="p-6 col-span-full">
          <div className="text-center py-12">
            <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team KPIs Added</h3>
            <p className="text-gray-600 mb-6">Start tracking your team performance by adding your first KPI.</p>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 mx-auto">
              <Plus className="w-4 h-4" />
              <span>Add Team KPI</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* User Added KPIs */}
      {kpis.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{kpi.name}</h4>
                    <p className="text-sm text-gray-600">Custom KPI</p>
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
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${kpi.progress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">Target: {kpi.target} {kpi.unit}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights for Team - Only show when KPIs exist */}
      {kpis.length > 0 && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Empty State for Debt Collection KPIs */}
        <Card className="p-6 col-span-full">
          <div className="text-center py-12">
            <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Debt Collection KPIs Added</h3>
            <p className="text-gray-600 mb-6">Start tracking your debt collection performance by adding your first KPI.</p>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 mx-auto">
              <Plus className="w-4 h-4" />
              <span>Add Debt Collection KPI</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* User Added KPIs */}
      {kpis.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{kpi.name}</h4>
                    <p className="text-sm text-gray-600">Custom KPI</p>
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
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${kpi.progress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">Target: {kpi.target} {kpi.unit}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights for Debt Collection - Only show when KPIs exist */}
      {kpis.length > 0 && (
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

  const renderCustomerPerformanceKPIs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Performance KPIs</h2>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add KPI</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Empty State for Customer Performance KPIs */}
        <Card className="p-6 col-span-full">
          <div className="text-center py-12">
            <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Customer Performance KPIs Added</h3>
            <p className="text-gray-600 mb-6">Start tracking your customer performance by adding your first KPI.</p>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 mx-auto">
              <Plus className="w-4 h-4" />
              <span>Add Customer Performance KPI</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* User Added KPIs */}
      {kpis.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{kpi.name}</h4>
                    <p className="text-sm text-gray-600">Custom KPI</p>
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
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${kpi.progress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">Target: {kpi.target} {kpi.unit}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights for Customer Performance - Only show when KPIs exist */}
      {kpis.length > 0 && (
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
