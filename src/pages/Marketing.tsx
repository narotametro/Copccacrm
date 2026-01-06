import React, { useState, useEffect } from 'react';
import {
  Plus,
  Mail,
  MessageSquare,
  Send,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  BarChart3,
} from 'lucide-react';
import { marketingAPI } from '@/services/marketingAPI';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  channels: string[];
  targetSegment?: string;
  budget: number;
  reach: number;
  engagementRate: number;
  conversionRate: number;
  roi: number;
  startDate?: string;
  endDate?: string;
}

export const Marketing: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await marketingAPI.getAll();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
      active: 'bg-green-100 text-green-700 border-green-300',
      paused: 'bg-orange-100 text-orange-700 border-orange-300',
      completed: 'bg-purple-100 text-purple-700 border-purple-300',
    };
    return colors[status];
  };

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, any> = {
      email: Mail,
      sms: MessageSquare,
      whatsapp: MessageSquare,
      social: Users,
    };
    return icons[channel.toLowerCase()] || Send;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {view === 'list' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marketing Campaigns</h1>
              <p className="text-gray-500 mt-1">Create, manage, and track your campaigns</p>
            </div>
            <button
              onClick={() => setView('builder')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus className="h-5 w-5" />
              Create Campaign
            </button>
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Target className="h-5 w-5" />
                <span className="text-sm font-medium">Active Campaigns</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {campaigns.filter(c => c.status === 'active').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {campaigns.filter(c => c.status === 'scheduled').length} scheduled
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Total Reach</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {(campaigns.reduce((sum, c) => sum + c.reach, 0) / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-gray-500 mt-1">Across all channels</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">Avg. Conversion</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {campaigns.length > 0
                  ? (
                      campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
              <p className="text-xs text-gray-500 mt-1">+2.3% from last month</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <DollarSign className="h-5 w-5" />
                <span className="text-sm font-medium">Total ROI</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {campaigns.length > 0
                  ? (campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length).toFixed(1)
                  : 0}
                x
              </p>
              <p className="text-xs text-gray-500 mt-1">Return on investment</p>
            </div>
          </div>

          {/* Campaigns List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Campaigns</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-500 mb-4">
                  Get started by creating your first marketing campaign
                </p>
                <button
                  onClick={() => setView('builder')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {campaigns.map(campaign => {
                  const Icon = getChannelIcon(campaign.channels[0] || 'email');
                  return (
                    <div
                      key={campaign.id}
                      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Icon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {campaign.name}
                            </h3>
                            {campaign.description && (
                              <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span
                                className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                                  campaign.status
                                )}`}
                              >
                                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                              </span>
                              <div className="flex items-center gap-2">
                                {campaign.channels.map(channel => {
                                  const ChannelIcon = getChannelIcon(channel);
                                  return (
                                    <span
                                      key={channel}
                                      className="flex items-center gap-1 text-xs text-gray-600"
                                    >
                                      <ChannelIcon className="h-3 w-3" />
                                      {channel}
                                    </span>
                                  );
                                })}
                              </div>
                              {campaign.targetSegment && (
                                <span className="text-xs text-gray-500">
                                  Target: {campaign.targetSegment}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {campaign.status === 'active' && (
                            <button className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg">
                              <Pause className="h-4 w-4" />
                            </button>
                          )}
                          {(campaign.status === 'paused' || campaign.status === 'draft') && (
                            <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Campaign Metrics */}
                      <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="text-sm font-semibold text-gray-900">
                            ${campaign.budget.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Reach</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {campaign.reach.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Engagement</p>
                          <p className="text-sm font-semibold text-green-600">
                            {campaign.engagementRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Conversion</p>
                          <p className="text-sm font-semibold text-blue-600">
                            {campaign.conversionRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">ROI</p>
                          <p className="text-sm font-semibold text-purple-600">
                            {campaign.roi}x
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Campaign Builder View */}
      {view === 'builder' && (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              ← Back to Campaigns
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Builder</h1>
            <p className="text-gray-500 mt-1">Create a new marketing campaign</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Summer Product Launch"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Brief description of the campaign goals and strategy..."
                />
              </div>

              {/* Channels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channels *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Email', 'SMS', 'WhatsApp', 'Social Media', 'Web Push', 'In-App'].map(
                    channel => (
                      <label
                        key={channel}
                        className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input type="checkbox" className="rounded text-blue-600" />
                        <span className="text-sm text-gray-700">{channel}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Target Segment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Segment
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>All Customers</option>
                  <option>VIP Customers</option>
                  <option>High Value</option>
                  <option>Medium Value</option>
                  <option>Low Value</option>
                  <option>At Risk</option>
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget ($)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="5000"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
