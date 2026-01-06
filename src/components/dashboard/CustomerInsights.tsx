import React from 'react';
import { Users, TrendingUp, AlertTriangle, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

interface Customer {
  id: string;
  name: string;
  company?: string;
  ltv: number;
  churnRisk: number;
  segment: 'VIP' | 'High' | 'Medium' | 'Low';
  lastContact?: string;
}

interface CustomerInsightsProps {
  topCustomers?: Customer[];
  churnRiskCustomers?: Customer[];
}

export const CustomerInsights: React.FC<CustomerInsightsProps> = ({
  topCustomers = [],
  churnRiskCustomers = [],
}) => {
  const navigate = useNavigate();

  const segmentColors = {
    VIP: 'bg-purple-100 text-purple-700 border-purple-300',
    High: 'bg-blue-100 text-blue-700 border-blue-300',
    Medium: 'bg-green-100 text-green-700 border-green-300',
    Low: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return 'text-red-600 bg-red-100';
    if (risk >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Customer Insights</h3>
          <p className="text-sm text-gray-500 mt-1">Top performers & at-risk customers</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.customers.path)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          View All Customers
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Customers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Top Customers</h4>
              <p className="text-xs text-gray-500">Highest lifetime value</p>
            </div>
          </div>

          <div className="space-y-3">
            {topCustomers.slice(0, 5).map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                onClick={() => navigate(`/customers/${customer.id}`)}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full text-white font-bold text-sm shadow-md">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && index + 1}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    {customer.company && (
                      <p className="text-xs text-gray-500">{customer.company}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">
                    ${(customer.ltv / 1000).toFixed(1)}K
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded border ${
                      segmentColors[customer.segment]
                    }`}
                  >
                    {customer.segment}
                  </span>
                </div>
              </div>
            ))}

            {topCustomers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No top customers yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Churn Risk Customers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">At-Risk Customers</h4>
              <p className="text-xs text-gray-500">Require immediate attention</p>
            </div>
          </div>

          <div className="space-y-3">
            {churnRiskCustomers.slice(0, 5).map(customer => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer border border-red-200"
                onClick={() => navigate(`/customers/${customer.id}`)}
              >
                <div className="flex items-center gap-3">
                  {/* Alert Icon */}
                  <div className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    {customer.lastContact && (
                      <p className="text-xs text-gray-500">
                        Last contact: {new Date(customer.lastContact).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${getRiskColor(
                      customer.churnRisk
                    )}`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {customer.churnRisk}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ${(customer.ltv / 1000).toFixed(1)}K LTV
                  </p>
                </div>
              </div>
            ))}

            {churnRiskCustomers.length === 0 && (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">All customers are healthy! 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Customers</p>
            <p className="text-lg font-bold text-gray-900">
              {topCustomers.length + churnRiskCustomers.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">VIP Customers</p>
            <p className="text-lg font-bold text-purple-600">
              {topCustomers.filter(c => c.segment === 'VIP').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">At Risk</p>
            <p className="text-lg font-bold text-red-600">{churnRiskCustomers.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
