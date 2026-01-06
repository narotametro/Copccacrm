import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingBag,
  Target,
  Percent,
  Clock,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

export const KPIs: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 45000, target: 50000, previousYear: 38000 },
    { month: 'Feb', revenue: 52000, target: 50000, previousYear: 41000 },
    { month: 'Mar', revenue: 48000, target: 50000, previousYear: 39000 },
    { month: 'Apr', revenue: 61000, target: 55000, previousYear: 45000 },
    { month: 'May', revenue: 55000, target: 55000, previousYear: 47000 },
    { month: 'Jun', revenue: 67000, target: 60000, previousYear: 52000 },
  ];

  const customerAcquisitionData = [
    { month: 'Jan', new: 120, churn: 15 },
    { month: 'Feb', new: 145, churn: 18 },
    { month: 'Mar', new: 132, churn: 22 },
    { month: 'Apr', new: 165, churn: 12 },
    { month: 'May', new: 178, churn: 25 },
    { month: 'Jun', new: 195, churn: 20 },
  ];

  const salesFunnelData = [
    { name: 'Leads', value: 500, color: '#3b82f6' },
    { name: 'Qualified', value: 320, color: '#8b5cf6' },
    { name: 'Proposal', value: 180, color: '#ec4899' },
    { name: 'Negotiation', value: 95, color: '#f59e0b' },
    { name: 'Won', value: 62, color: '#10b981' },
  ];

  const productPerformanceData = [
    { name: 'Product A', sales: 4200, revenue: 84000 },
    { name: 'Product B', sales: 3800, revenue: 76000 },
    { name: 'Product C', sales: 3200, revenue: 64000 },
    { name: 'Product D', sales: 2800, revenue: 56000 },
    { name: 'Product E', sales: 2100, revenue: 42000 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Key Performance Indicators</h1>
          <p className="text-gray-500 mt-1">Track your business metrics and performance</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            {(['week', 'month', 'quarter', 'year'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Calendar className="h-4 w-4" />
            Custom Range
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-500 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
              <TrendingUp className="h-4 w-4" />
              +18.2%
            </span>
          </div>
          <h3 className="text-sm font-medium text-green-700 mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-900">$328K</p>
          <p className="text-xs text-green-600 mt-2">Target: $300K (109%)</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-blue-600">
              <TrendingUp className="h-4 w-4" />
              +12.5%
            </span>
          </div>
          <h3 className="text-sm font-medium text-blue-700 mb-1">Active Customers</h3>
          <p className="text-3xl font-bold text-blue-900">1,235</p>
          <p className="text-xs text-blue-600 mt-2">+135 new this month</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-500 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-purple-600">
              <TrendingUp className="h-4 w-4" />
              +8.7%
            </span>
          </div>
          <h3 className="text-sm font-medium text-purple-700 mb-1">Average Order Value</h3>
          <p className="text-3xl font-bold text-purple-900">$2,450</p>
          <p className="text-xs text-purple-600 mt-2">From 214 orders</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Percent className="h-6 w-6 text-white" />
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-red-600">
              <TrendingDown className="h-4 w-4" />
              -2.1%
            </span>
          </div>
          <h3 className="text-sm font-medium text-orange-700 mb-1">Conversion Rate</h3>
          <p className="text-3xl font-bold text-orange-900">24.3%</p>
          <p className="text-xs text-orange-600 mt-2">62 of 255 deals closed</p>
        </div>
      </div>

      {/* AI Insights Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-md p-6 mb-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
            <ul className="space-y-1 text-sm">
              <li>
                🚀 <strong>Revenue is trending 18% above target</strong> - Excellent performance
                this quarter
              </li>
              <li>
                ⚠️ <strong>Conversion rate dropped 2.1%</strong> - Consider reviewing your sales
                funnel
              </li>
              <li>
                💡 <strong>Product A demand increased 34%</strong> - Opportunity to upsell to
                existing customers
              </li>
              <li>
                📈 <strong>Customer lifetime value up 15%</strong> - Retention strategies are
                working well
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-sm text-gray-500">Monthly comparison with targets</p>
            </div>
            <LineChartIcon className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#f59e0b"
                strokeDasharray="5 5"
                name="Target"
              />
              <Line
                type="monotone"
                dataKey="previousYear"
                stroke="#9ca3af"
                strokeDasharray="3 3"
                name="Last Year"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Acquisition */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Customer Acquisition</h3>
              <p className="text-sm text-gray-500">New customers vs churn rate</p>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={customerAcquisitionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="new" fill="#10b981" name="New Customers" />
              <Bar dataKey="churn" fill="#ef4444" name="Churned" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Funnel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sales Funnel</h3>
              <p className="text-sm text-gray-500">Conversion by stage</p>
            </div>
            <PieChartIcon className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salesFunnelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {salesFunnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Product Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              <p className="text-sm text-gray-500">Sales and revenue by product</p>
            </div>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productPerformanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional KPIs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { metric: 'Customer Lifetime Value', current: '$12,450', target: '$10,000', change: '+24.5%', status: 'above' },
                { metric: 'Customer Acquisition Cost', current: '$245', target: '$300', change: '-18.3%', status: 'above' },
                { metric: 'Churn Rate', current: '4.2%', target: '5.0%', change: '-16.0%', status: 'above' },
                { metric: 'Net Promoter Score', current: '68', target: '65', change: '+4.6%', status: 'above' },
                { metric: 'Average Deal Size', current: '$8,200', target: '$7,500', change: '+9.3%', status: 'above' },
                { metric: 'Sales Cycle Length', current: '32 days', target: '28 days', change: '+14.3%', status: 'below' },
              ].map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.metric}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.current}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.target}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`flex items-center gap-1 ${
                        row.status === 'above' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {row.status === 'above' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {row.change}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        row.status === 'above'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {row.status === 'above' ? 'On Track' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
