/**
 * Dashboard Page - Central Action Hub
 * AI-powered control center for all SMB activities
 */

import { useState, useEffect } from 'react';
import { KPIWidget } from '@/components/shared/KPIWidget';
import { PriorityTasksPanel } from '@/components/dashboard/PriorityTasksPanel';
import { PipelineSnapshot } from '@/components/dashboard/PipelineSnapshot';
import { CustomerInsights } from '@/components/dashboard/CustomerInsights';
import { AIAssistant } from '@/components/modules/AIAssistant';
import { aiAPI } from '@/services/aiAPI';
import { salesAPI } from '@/services/salesAPI';
import { customerAPI } from '@/services/customerAPI';
import {  DollarSign, TrendingUp, Target, Users, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const [kpis, setKpis] = useState({
    revenue: { value: 0, change: 0 },
    deals: { value: 0, change: 0 },
    conversion: { value: 0, change: 0 },
    customers: { value: 0, change: 0 },
  });
  
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      
      // Load KPIs
      const [pipelineStats, topCustomers, aiRecs] = await Promise.all([
        salesAPI.getPipelineStats(),
        customerAPI.getTopCustomers(5),
        aiAPI.getDashboardRecommendations(),
      ]);

      // Calculate KPIs
      const totalValue = Object.values(pipelineStats).reduce(
        (sum: number, stat: any) => sum + stat.value,
        0
      );

      setKpis({
        revenue: { value: totalValue, change: 12.5 },
        deals: { value: Object.values(pipelineStats).reduce((sum: number, stat: any) => sum + stat.count, 0), change: 8 },
        conversion: { value: 3.4, change: -0.2 },
        customers: { value: topCustomers.length, change: 15 },
      });

      setRecommendations(aiRecs);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your business overview</p>
        </div>
        <button className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition">
          + Quick Action
        </button>
      </div>

      {/* KPI Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIWidget
          title="Total Revenue"
          value={`$${(kpis.revenue.value / 1000).toFixed(1)}K`}
          change={kpis.revenue.change}
          trend={kpis.revenue.change > 0 ? 'up' : 'down'}
          icon={DollarSign}
          color="green"
        />
        
        <KPIWidget
          title="Active Deals"
          value={kpis.deals.value}
          change={kpis.deals.change}
          trend={kpis.deals.change > 0 ? 'up' : 'down'}
          icon={TrendingUp}
          color="blue"
        />
        
        <KPIWidget
          title="Conversion Rate"
          value={`${kpis.conversion.value}%`}
          change={kpis.conversion.change}
          trend={kpis.conversion.change > 0 ? 'up' : 'down'}
          icon={Target}
          color="orange"
        />
        
        <KPIWidget
          title="Total Customers"
          value={kpis.customers.value}
          change={kpis.customers.change}
          trend="up"
          icon={Users}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority Tasks */}
          <PriorityTasksPanel recommendations={recommendations} />

          {/* Pipeline Snapshot */}
          <PipelineSnapshot />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Customer Insights */}
          <CustomerInsights />

          {/* AI Assistant */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-semibold">AI Insights</h3>
            </div>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec: any, idx: number) => (
                <div key={idx} className="p-3 bg-pink-50 rounded-lg border border-pink-100">
                  <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Assistant */}
      <AIAssistant />
    </div>
  );
}
