import React, { useState } from 'react';
import { Building2, Users, TrendingUp, DollarSign, Activity, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useCurrency } from '@/context/CurrencyContext';

export const AdminDashboard: React.FC = () => {
  const { formatCurrency, convertAmount } = useCurrency();

  const stats = {
    totalCompanies: 127,
    activeSubscriptions: 98,
    trialAccounts: 15,
    expiredAccounts: 14,
    totalUsers: 1847,
    activeUsers: 1523,
    monthlyRevenue: 45600000, // NGN
    avgRevenuePerCompany: 358267,
    growthRate: 24.5,
  };

  const recentActivity = [
    { id: 1, company: 'TechCorp Nigeria Ltd', action: 'Subscription renewed', time: '2 hours ago', status: 'success' },
    { id: 2, company: 'Global Trade Solutions', action: 'Trial expired', time: '5 hours ago', status: 'warning' },
    { id: 3, company: 'Innovation Hub Lagos', action: 'New company registered', time: '1 day ago', status: 'success' },
    { id: 4, company: 'DataSync Systems', action: 'Payment failed', time: '1 day ago', status: 'error' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Platform Dashboard</h1>
        <p className="text-purple-200">Overview of all companies and subscriptions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Total Companies</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalCompanies}</p>
              <p className="text-green-400 text-xs mt-1">+{stats.growthRate}% this month</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Building2 className="text-blue-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Active Subscriptions</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.activeSubscriptions}</p>
              <p className="text-purple-200 text-xs mt-1">{stats.trialAccounts} trials active</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="text-green-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</p>
              <p className="text-purple-200 text-xs mt-1">{stats.activeUsers} active</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Users className="text-purple-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Monthly Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(convertAmount(stats.monthlyRevenue))}</p>
              <p className="text-purple-200 text-xs mt-1">Avg: {formatCurrency(convertAmount(stats.avgRevenuePerCompany))}</p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <DollarSign className="text-yellow-400" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Subscription Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-400" size={20} />
                <span className="text-white">Active</span>
              </div>
              <span className="text-2xl font-bold text-green-400">{stats.activeSubscriptions}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2">
                <Activity className="text-blue-400" size={20} />
                <span className="text-white">Trial</span>
              </div>
              <span className="text-2xl font-bold text-blue-400">{stats.trialAccounts}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-400" size={20} />
                <span className="text-white">Expired</span>
              </div>
              <span className="text-2xl font-bold text-red-400">{stats.expiredAccounts}</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{activity.company}</p>
                  <p className="text-purple-200 text-xs">{activity.action}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-200 text-xs">{activity.time}</span>
                  {activity.status === 'success' && <CheckCircle className="text-green-400" size={16} />}
                  {activity.status === 'warning' && <AlertTriangle className="text-yellow-400" size={16} />}
                  {activity.status === 'error' && <AlertTriangle className="text-red-400" size={16} />}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
