import { Bot, TrendingUp, Activity, Bell, RefreshCw, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useAfterSales } from '../lib/use-data';

export function AIAssistant() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { records: customers } = useAfterSales();

  const recentActivities = [
    {
      id: 1,
      time: '2 minutes ago',
      category: 'After-Sales',
      action: 'Service rating updated for Tech Solutions Inc.',
      details: 'Rating improved from 4 to 5 stars',
      priority: 'low',
    },
    {
      id: 2,
      time: '15 minutes ago',
      category: 'Competitor',
      action: 'CompetitorX launched new discount offer',
      details: '20% off annual plans until Dec 31',
      priority: 'high',
    },
    {
      id: 3,
      time: '28 minutes ago',
      category: 'Debt Collection',
      action: 'Payment received from BuildTech Supply',
      details: '$2,500 payment received for INV-2380',
      priority: 'medium',
    },
    {
      id: 4,
      time: '1 hour ago',
      category: 'After-Sales',
      action: 'Stock alert: Low inventory for Global Retail Co.',
      details: 'Only 5 units remaining',
      priority: 'high',
    },
    {
      id: 5,
      time: '2 hours ago',
      category: 'Competitor',
      action: 'SmartBiz Systems updated pricing',
      details: 'AI Collection Pro reduced to $3,499/mo',
      priority: 'medium',
    },
    {
      id: 6,
      time: '3 hours ago',
      category: 'Debt Collection',
      action: 'Follow-up scheduled with Metro Distribution',
      details: 'Phone call scheduled for Dec 10',
      priority: 'medium',
    },
    {
      id: 7,
      time: '4 hours ago',
      category: 'After-Sales',
      action: 'Price protection activated for Prime Enterprises',
      details: 'Protection valid until Mar 10, 2025',
      priority: 'low',
    },
    {
      id: 8,
      time: '5 hours ago',
      category: 'Competitor',
      action: 'New competitor added: QuickSales Inc',
      details: 'Initial analysis completed',
      priority: 'low',
    },
  ];

  // Group customers by performance category
  const customersByPerformance = {
    star: customers.filter(c => c.performanceCategory === 'star'),
    excellent: customers.filter(c => c.performanceCategory === 'excellent'),
    good: customers.filter(c => c.performanceCategory === 'good'),
    average: customers.filter(c => c.performanceCategory === 'average'),
    needsAttention: customers.filter(c => c.performanceCategory === 'needs-attention'),
  };

  // Enhanced AI Analysis for new data structures
  const analyzeProductFocus = () => {
    const productAnalysis: any = {};
    
    customers.forEach(customer => {
      // Get available products
      const availableProducts = customer.performanceData?.productAvailable || [];
      const availableArray = Array.isArray(availableProducts) ? availableProducts : [availableProducts];
      
      // Get last order products
      const lastOrderData = customer.performanceData?.lastOrder || [];
      const lastOrderArray = Array.isArray(lastOrderData) ? lastOrderData : [lastOrderData];
      
      availableArray.forEach((entry: any) => {
        if (entry.products) {
          entry.products.forEach((p: any) => {
            if (!productAnalysis[p.name]) {
              productAnalysis[p.name] = { available: 0, ordered: 0, customers: [] };
            }
            productAnalysis[p.name].available++;
            productAnalysis[p.name].customers.push(customer.customer);
          });
        }
      });
      
      lastOrderArray.forEach((entry: any) => {
        if (entry.products) {
          entry.products.forEach((p: any) => {
            if (!productAnalysis[p.product]) {
              productAnalysis[p.product] = { available: 0, ordered: 0, customers: [] };
            }
            productAnalysis[p.product].ordered++;
          });
        }
      });
    });
    
    return productAnalysis;
  };

  const analyzeRevenueTrends = () => {
    const monthlyTotals: any = {};
    
    customers.forEach(customer => {
      const revenueData = customer.performanceData?.revenueGenerated || [];
      const revenueArray = Array.isArray(revenueData) ? revenueData : [revenueData];
      
      revenueArray.forEach((entry: any) => {
        if (entry.months) {
          entry.months.forEach((m: any) => {
            if (m.revenue && m.revenue.trim()) {
              if (!monthlyTotals[m.month]) monthlyTotals[m.month] = 0;
              monthlyTotals[m.month] += parseFloat(m.revenue) || 0;
            }
          });
        }
      });
    });
    
    return monthlyTotals;
  };

  const productFocus = analyzeProductFocus();
  const revenueTrends = analyzeRevenueTrends();
  
  // Find top products
  const topProducts = Object.entries(productFocus)
    .sort((a: any, b: any) => b[1].ordered - a[1].ordered)
    .slice(0, 3);
  
  // Find underperforming products
  const underperformingProducts = Object.entries(productFocus)
    .filter((p: any) => p[1].available > 0 && p[1].ordered === 0)
    .slice(0, 3);
  
  // Revenue trends
  const months = Object.keys(revenueTrends).slice(-3);
  const lastMonthRevenue = months.length > 0 ? revenueTrends[months[months.length - 1]] : 0;
  const prevMonthRevenue = months.length > 1 ? revenueTrends[months[months.length - 2]] : 0;
  const revenueChange = prevMonthRevenue > 0 ? ((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1) : 0;

  const avgSalesPerformance = customers.length > 0
    ? Math.round(customers.reduce((sum, r) => sum + (r.salesPerformance || 0), 0) / customers.length)
    : 0;
  
  const avgServiceRating = customers.length > 0
    ? (customers.reduce((sum, r) => sum + (r.serviceRating || 0), 0) / customers.length).toFixed(1)
    : '0.0';

  const quickReports = {
    afterSales: {
      title: 'After-Sales Summary',
      icon: '📊',
      color: 'from-pink-500 to-pink-600',
      items: [
        `Total active customers: ${customers.length}`,
        `Average sales performance: ${avgSalesPerformance}%`,
        `Service satisfaction rating: ${avgServiceRating}/5`,
        `Star Performers: ${customersByPerformance.star.length} customers`,
        `Excellent: ${customersByPerformance.excellent.length} customers`,
        `Needs Attention: ${customersByPerformance.needsAttention.length} customers`,
        ...(topProducts.length > 0 ? [
          `Top selling products: ${topProducts.map((p: any) => `${p[0]} (${p[1].ordered} orders)`).join(', ')}`
        ] : []),
        ...(underperformingProducts.length > 0 ? [
          `Products needing focus: ${underperformingProducts.map((p: any) => p[0]).join(', ')}`
        ] : []),
        ...(lastMonthRevenue > 0 ? [
          `Last month revenue: $${lastMonthRevenue.toLocaleString()} (${revenueChange > 0 ? '+' : ''}${revenueChange}%)`
        ] : []),
      ],
    },
    competitors: {
      title: 'Competitors Information',
      icon: '🎯',
      color: 'from-purple-500 to-purple-600',
      items: [
        '8 competitors actively monitored',
        '45 products tracked across all competitors',
        '12 active promotional offers detected',
        'We maintain 18% average price advantage',
        'CompetitorX and SmartBiz pose high threat level',
        'Recent: CompetitorX launched 20% discount campaign',
        'Recent: SmartBiz reduced AI Collection Pro price',
      ],
    },
    debtCollection: {
      title: 'Debt Collection Status',
      icon: '💰',
      color: 'from-blue-500 to-blue-600',
      items: [
        'Total outstanding debt: $127,450 (down 12%)',
        '34 accounts with pending payments (reduced by 8)',
        'Average days overdue: 22 days (improvement of 5 days)',
        'This month recovered: $45,200 (up 18%)',
        'Critical priority: Downtown Retail - $12,400 (68 days overdue)',
        'AI successfully sent 28 follow-up attempts this week',
        'Payment plan recommended for Metro Distribution',
      ],
    },
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-blue-100 text-blue-700',
    };
    return colors[priority as keyof typeof colors];
  };

  const getCategoryColor = (category: string) => {
    if (category === 'After-Sales') return 'text-pink-600';
    if (category === 'Competitor') return 'text-purple-600';
    return 'text-blue-600';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl">AI Assistant Dashboard</h2>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Active & Monitoring</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              autoRefresh
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Quick Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(quickReports).map(([key, report]) => (
          <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`bg-gradient-to-r ${report.color} p-4 text-white`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{report.icon}</span>
                <h3 className="text-lg">{report.title}</h3>
              </div>
              <p className="text-sm text-white/80">Real-time insights and updates</p>
            </div>
            <div className="p-4">
              <ul className="space-y-3">
                {report.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-pink-500 mt-1">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Performance Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <UserCheck size={20} className="text-pink-500" />
          Customers by Performance Category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700">⭐ Star Performers</p>
              <p className="text-2xl">{customersByPerformance.star.length}</p>
            </div>
            {customersByPerformance.star.length > 0 && (
              <div className="mt-2 space-y-1">
                {customersByPerformance.star.slice(0, 3).map(c => (
                  <p key={c.id} className="text-xs text-gray-600 truncate">• {c.customer}</p>
                ))}
                {customersByPerformance.star.length > 3 && (
                  <p className="text-xs text-gray-500">+{customersByPerformance.star.length - 3} more</p>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700">✓ Excellent</p>
              <p className="text-2xl">{customersByPerformance.excellent.length}</p>
            </div>
            {customersByPerformance.excellent.length > 0 && (
              <div className="mt-2 space-y-1">
                {customersByPerformance.excellent.slice(0, 3).map(c => (
                  <p key={c.id} className="text-xs text-gray-600 truncate">• {c.customer}</p>
                ))}
                {customersByPerformance.excellent.length > 3 && (
                  <p className="text-xs text-gray-500">+{customersByPerformance.excellent.length - 3} more</p>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700">👍 Good</p>
              <p className="text-2xl">{customersByPerformance.good.length}</p>
            </div>
            {customersByPerformance.good.length > 0 && (
              <div className="mt-2 space-y-1">
                {customersByPerformance.good.slice(0, 3).map(c => (
                  <p key={c.id} className="text-xs text-gray-600 truncate">• {c.customer}</p>
                ))}
                {customersByPerformance.good.length > 3 && (
                  <p className="text-xs text-gray-500">+{customersByPerformance.good.length - 3} more</p>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700">○ Average</p>
              <p className="text-2xl">{customersByPerformance.average.length}</p>
            </div>
            {customersByPerformance.average.length > 0 && (
              <div className="mt-2 space-y-1">
                {customersByPerformance.average.slice(0, 3).map(c => (
                  <p key={c.id} className="text-xs text-gray-600 truncate">• {c.customer}</p>
                ))}
                {customersByPerformance.average.length > 3 && (
                  <p className="text-xs text-gray-500">+{customersByPerformance.average.length - 3} more</p>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700">⚠️ Needs Attention</p>
              <p className="text-2xl">{customersByPerformance.needsAttention.length}</p>
            </div>
            {customersByPerformance.needsAttention.length > 0 && (
              <div className="mt-2 space-y-1">
                {customersByPerformance.needsAttention.slice(0, 3).map(c => (
                  <p key={c.id} className="text-xs text-gray-600 truncate">• {c.customer}</p>
                ))}
                {customersByPerformance.needsAttention.length > 3 && (
                  <p className="text-xs text-gray-500">+{customersByPerformance.needsAttention.length - 3} more</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Performance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <Activity size={20} className="text-pink-500" />
          AI System Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Prediction Accuracy</p>
            <p className="text-2xl mb-2">94%</p>
            <div className="w-full bg-pink-200 rounded-full h-2">
              <div className="bg-pink-500 h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Automation Rate</p>
            <p className="text-2xl mb-2">87%</p>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '87%' }}></div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Response Time</p>
            <p className="text-2xl mb-2">1.2s</p>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95%' }}></div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
            <p className="text-2xl mb-2">91%</p>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '91%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Stream */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg flex items-center gap-2">
            <Bell size={20} className="text-pink-500" />
            Recent Activity Stream
          </h3>
          <button className="text-sm text-pink-600 hover:text-pink-700">View All</button>
        </div>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm ${getCategoryColor(activity.category)}`}>
                      {activity.category}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                  <p className="text-sm mb-1">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.details}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(activity.priority)}`}>
                  {activity.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          AI Strategic Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm mb-2 font-semibold">⚠️ Competitive Threat</p>
            <p className="text-sm text-white/90">
              CompetitorX's new 20% discount campaign may impact Q1 sales. Consider matching offer or highlighting unique value propositions.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm mb-2 font-semibold">💡 Revenue Opportunity</p>
            <p className="text-sm text-white/90">
              12 customers show high adoption rates and satisfaction. Prime candidates for upselling premium features or services.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm mb-2 font-semibold">🎯 Collection Priority</p>
            <p className="text-sm text-white/90">
              Focus on Downtown Retail ($12,400, 68 days overdue) and Metro Distribution ($8,950, 53 days overdue) for immediate action.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm mb-2 font-semibold">📈 Growth Trend</p>
            <p className="text-sm text-white/90">
              After-sales satisfaction up 0.4 points. Service improvements driving retention. Continue current support strategy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
