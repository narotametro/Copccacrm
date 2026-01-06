import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Star,
  MessageSquare,
  Activity,
  ShoppingBag,
  FileText,
  Edit,
  Trash2,
  Send,
} from 'lucide-react';
import { customerAPI } from '@/services/customerAPI';
import { salesAPI } from '@/services/salesAPI';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'activities' | 'notes'>(
    'overview'
  );

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.getById(id!);
      setCustomer(data);

      // Load related deals
      // const customerDeals = await salesAPI.getByCustomer(id!);
      // setDeals(customerDeals);

      // Mock activities for now
      setActivities([
        {
          id: '1',
          type: 'email',
          title: 'Email sent: Follow-up on proposal',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user: 'John Doe',
        },
        {
          id: '2',
          type: 'call',
          title: 'Phone call: Discussed pricing',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          user: 'Jane Smith',
        },
        {
          id: '3',
          type: 'meeting',
          title: 'Meeting: Product demo',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          user: 'John Doe',
        },
      ]);
    } catch (error) {
      console.error('Failed to load customer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-500">Customer not found</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const segmentColors = {
    VIP: 'bg-purple-100 text-purple-700 border-purple-300',
    High: 'bg-blue-100 text-blue-700 border-blue-300',
    Medium: 'bg-green-100 text-green-700 border-green-300',
    Low: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return 'text-red-600 bg-red-100 border-red-300';
    if (risk >= 40) return 'text-orange-600 bg-orange-100 border-orange-300';
    return 'text-green-600 bg-green-100 border-green-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full border ${
                      segmentColors[customer.segment || 'Low']
                    }`}
                  >
                    {customer.segment || 'Low'} Value
                  </span>
                  {customer.churnRisk > 40 && (
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full border flex items-center gap-1 ${getRiskColor(
                        customer.churnRisk
                      )}`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {customer.churnRisk}% Churn Risk
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {customer.company && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="h-4 w-4" />
                      {customer.company}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      {customer.email}
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {customer.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Edit className="h-5 w-5" />
              </button>
              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="h-5 w-5" />
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Send className="h-4 w-4" />
                Contact
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <DollarSign className="h-5 w-5" />
            <span className="text-sm font-medium">Lifetime Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${((customer.ltv || 0) / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-gray-500 mt-1">+12% vs last quarter</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-medium">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">24</p>
          <p className="text-xs text-gray-500 mt-1">Last order 5 days ago</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">Avg. Order Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">$2.4K</p>
          <p className="text-xs text-gray-500 mt-1">+8% from average</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">Customer Since</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">2 yrs</p>
          <p className="text-xs text-gray-500 mt-1">
            {customer.created_at
              ? new Date(customer.created_at).toLocaleDateString()
              : 'Unknown'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'deals', label: 'Deals', icon: TrendingUp },
              { id: 'activities', label: 'Activities', icon: MessageSquare },
              { id: 'notes', label: 'Notes', icon: FileText },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {customer.name} is a{' '}
                    <strong>{customer.segment || 'standard'}-value customer</strong> who has been
                    with us for over 2 years. With a lifetime value of{' '}
                    <strong>${((customer.ltv || 0) / 1000).toFixed(1)}K</strong>, they represent
                    one of our {customer.segment === 'VIP' ? 'top' : 'valued'} clients.
                    {customer.churnRisk > 40 && (
                      <span className="text-red-600 font-semibold">
                        {' '}
                        ⚠️ Requires immediate attention due to elevated churn risk.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {customer.tags && customer.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Deals Tab */}
          {activeTab === 'deals' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Deals</h3>
              <p className="text-gray-500">No active deals for this customer.</p>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
              <div className="space-y-4">
                {activities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.user} •{' '}
                        {activity.timestamp.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <textarea
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
                placeholder="Add notes about this customer..."
              />
              <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
