import React, { useState } from 'react';
import {
  Plus,
  Megaphone,
  Calendar,
  Banknote,
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  Instagram,
  Radio,
  Tv,
  Target,
  Brain,
  Eye,
  Play,
  Pause,
  CheckCircle,
  Zap,
  Edit,
  Copy,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  
  // Target Audience
  target_audience: string[];
  estimated_reach: number;
  
  // Channels
  channels: {
    email: boolean;
    sms: boolean;
    social: boolean;
    ads: boolean;
    tv: boolean;
    radio: boolean;
  };
  
  // Campaign Details
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  
  // Performance Metrics
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
  
  // AI Recommendations
  ai_score: number;
  ai_recommendations: string[];
  best_channel: string;
  best_time: string;
  
  // A/B Testing
  ab_testing: {
    enabled: boolean;
    variant_a: string;
    variant_b: string;
    winner: 'A' | 'B' | null;
  };
  
  // Message
  message_subject: string;
  message_preview: string;
}

const demoCampaigns: Campaign[] = [];

export const SalesStrategies: React.FC = () => {
  const { formatCurrency, currency } = useCurrency();
  const [campaigns] = useState<Campaign[]>(demoCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'ai-insights'>('overview');
  const [showEditMessageModal, setShowEditMessageModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700 border-slate-300',
      scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
      active: 'bg-green-100 text-green-700 border-green-300',
      paused: 'bg-orange-100 text-orange-700 border-orange-300',
      completed: 'bg-purple-100 text-purple-700 border-purple-300',
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'active') return <Play className="text-green-600" size={16} />;
    if (status === 'paused') return <Pause className="text-orange-600" size={16} />;
    if (status === 'completed') return <CheckCircle className="text-purple-600" size={16} />;
    if (status === 'scheduled') return <Calendar className="text-blue-600" size={16} />;
    return <Edit className="text-slate-600" size={16} />;
  };

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const avgROI = campaigns.length > 0 ? Math.round(campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length) : 0;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📢 Campaign Builder</h1>
          <p className="text-slate-600 mt-1">AI-powered multi-channel marketing</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>Create Campaign</Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-green-500">
          <Banknote className="text-green-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue / 1000)}<span className="text-sm ml-0.5">K</span></p>
        </Card>
        <Card className="border-l-4 border-blue-500">
          <TrendingUp className="text-blue-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Avg ROI</p>
          <p className="text-2xl font-bold text-blue-600">{avgROI}%</p>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <Megaphone className="text-purple-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Active Campaigns</p>
          <p className="text-2xl font-bold text-purple-600">{activeCampaigns}</p>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <Banknote className="text-orange-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Budget Used</p>
          <p className="text-2xl font-bold text-orange-600">{Math.round((totalSpent / totalBudget) * 100)}%</p>
        </Card>
        <Card className="border-l-4 border-primary-500">
          <Brain className="text-primary-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">AI Optimized</p>
          <p className="text-2xl font-bold text-primary-600">{campaigns.length}</p>
        </Card>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} onClick={() => setSelectedCampaign(campaign)}>
            <Card hover className="cursor-pointer">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center">
                    <Megaphone className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{campaign.name}</h3>
                    <p className="text-sm text-slate-600">{campaign.target_audience.join(', ')}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(campaign.status)}`}>
                  {getStatusIcon(campaign.status)}
                  {campaign.status.toUpperCase()}
                </span>
              </div>

              {/* Channels */}
              <div className="mb-4 pb-4 border-b border-slate-200">
                <p className="text-xs text-slate-600 mb-2">Active Channels:</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.channels.email && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1">
                      <Mail size={12} />
                      Email
                    </span>
                  )}
                  {campaign.channels.sms && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                      <MessageSquare size={12} />
                      SMS
                    </span>
                  )}
                  {campaign.channels.social && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center gap-1">
                      <Instagram size={12} />
                      Social
                    </span>
                  )}
                  {campaign.channels.ads && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium flex items-center gap-1">
                      <Target size={12} />
                      Ads
                    </span>
                  )}
                  {campaign.channels.tv && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1">
                      <Tv size={12} />
                      TV
                    </span>
                  )}
                  {campaign.channels.radio && (
                    <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium flex items-center gap-1">
                      <Radio size={12} />
                      Radio
                    </span>
                  )}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Budget</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(campaign.budget / 1000)}<span className="text-xs ml-0.5">K</span></p>
                  <div className="w-full bg-slate-200 rounded-full h-1 mt-1">
                    <div
                      className="bg-orange-500 h-1 rounded-full"
                      style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">ROI</p>
                  <p className={`text-lg font-bold ${
                    campaign.roi > 150 ? 'text-green-600' :
                    campaign.roi > 100 ? 'text-blue-600' :
                    'text-slate-900'
                  }`}>
                    {campaign.roi > 0 ? `${campaign.roi}%` : 'TBD'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">AI Score</p>
                  <p className={`text-lg font-bold ${
                    campaign.ai_score > 85 ? 'text-green-600' :
                    campaign.ai_score > 70 ? 'text-blue-600' :
                    'text-orange-600'
                  }`}>
                    {campaign.ai_score}/100
                  </p>
                </div>
              </div>

              {/* Performance Summary */}
              {campaign.status !== 'draft' && campaign.status !== 'scheduled' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xs text-slate-600">Impressions</p>
                      <p className="font-bold text-slate-900 text-sm">{(campaign.impressions / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Clicks</p>
                      <p className="font-bold text-slate-900 text-sm">{(campaign.clicks / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Conversions</p>
                      <p className="font-bold text-green-600 text-sm">{campaign.conversions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Revenue</p>
                      <p className="font-bold text-green-600 text-sm">{formatCurrency(campaign.revenue / 1000)}<span className="text-xs ml-0.5">K</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Top AI Recommendation */}
              <div className="p-3 bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Brain className="text-primary-600 flex-shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-xs font-bold text-primary-900 mb-1">Top AI Insight:</p>
                    <p className="text-sm text-primary-800">{campaign.ai_recommendations[0]}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button 
                  size="sm" 
                  icon={Eye}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCampaign(campaign);
                  }}
                >
                  View Details
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  icon={Copy}
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.success(`"${campaign.name}" duplicated successfully!`);
                    setTimeout(() => toast.info('New campaign added to drafts'), 1000);
                  }}
                >
                  Duplicate
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Detailed Campaign Modal */}
      {selectedCampaign && (
        <Modal
          isOpen={!!selectedCampaign}
          onClose={() => {
            setSelectedCampaign(null);
            setActiveTab('overview');
          }}
          title={selectedCampaign.name}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Megaphone className="text-white" size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-slate-900">{selectedCampaign.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(selectedCampaign.status)}`}>
                      {getStatusIcon(selectedCampaign.status)}
                      {selectedCampaign.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-600">Target: {selectedCampaign.target_audience.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
              <div className="flex gap-6">
                {(['overview', 'performance', 'ai-insights'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 px-2 font-medium transition-colors relative ${
                      activeTab === tab
                        ? 'text-primary-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'performance' && 'Performance'}
                    {tab === 'ai-insights' && '🧠 AI Insights'}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Campaign Message */}
                  <Card className="border-l-4 border-primary-500">
                    <h3 className="font-bold text-slate-900 mb-3">Campaign Message</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Subject/Headline:</p>
                        <p className="font-bold text-slate-900">{selectedCampaign.message_subject}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Preview:</p>
                        <p className="text-slate-700">{selectedCampaign.message_preview}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" icon={Edit} onClick={() => {
                        setMessageSubject(selectedCampaign.message_subject);
                        setMessageBody(selectedCampaign.message_preview);
                        setShowEditMessageModal(true);
                      }}>
                        Edit Message
                      </Button>
                    </div>
                  </Card>

                  {/* Target Audience & Channels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Users className="text-blue-600" size={20} />
                        Target Audience
                      </h3>
                      <div className="space-y-2">
                        {selectedCampaign.target_audience.map((audience, idx) => (
                          <span key={idx} className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mr-2 mb-2">
                            {audience}
                          </span>
                        ))}
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-sm text-slate-600">Estimated Reach:</p>
                          <p className="text-2xl font-bold text-blue-600">{selectedCampaign.estimated_reach.toLocaleString()}</p>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Target className="text-purple-600" size={20} />
                        Active Channels
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(selectedCampaign.channels).map(([channel, active]) => (
                          active && (
                            <div key={channel} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                              {channel === 'email' && <Mail className="text-blue-600" size={18} />}
                              {channel === 'sms' && <MessageSquare className="text-green-600" size={18} />}
                              {channel === 'social' && <Instagram className="text-purple-600" size={18} />}
                              {channel === 'ads' && <Target className="text-orange-600" size={18} />}
                              {channel === 'tv' && <Tv className="text-red-600" size={18} />}
                              {channel === 'radio' && <Radio className="text-pink-600" size={18} />}
                              <span className="font-medium text-slate-900 capitalize">{channel}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Budget & Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-green-500">
                      <h3 className="font-bold text-slate-900 mb-4">Budget & Spend</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Total Budget</span>
                          <span className="font-bold text-slate-900">{formatCurrency(selectedCampaign.budget)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Spent</span>
                          <span className="font-bold text-orange-600">{formatCurrency(selectedCampaign.spent)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Remaining</span>
                          <span className="font-bold text-green-600">{formatCurrency(selectedCampaign.budget - selectedCampaign.spent)}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 mt-2">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-green-500 h-3 rounded-full"
                            style={{ width: `${(selectedCampaign.spent / selectedCampaign.budget) * 100}%` }}
                          />
                        </div>
                      </div>
                    </Card>

                    <Card className="border-l-4 border-blue-500">
                      <h3 className="font-bold text-slate-900 mb-4">Timeline</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Start Date</span>
                          <span className="font-bold text-slate-900">
                            {new Date(selectedCampaign.start_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">End Date</span>
                          <span className="font-bold text-slate-900">
                            {new Date(selectedCampaign.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Duration</span>
                          <span className="font-bold text-blue-600">
                            {Math.ceil((new Date(selectedCampaign.end_date).getTime() - new Date(selectedCampaign.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* A/B Testing */}
                  {selectedCampaign.ab_testing.enabled && (
                    <Card className="border-l-4 border-purple-500">
                      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Sparkles className="text-purple-600" size={20} />
                        A/B Testing
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-bold text-blue-900 mb-1">Variant A</p>
                          <p className="text-sm text-blue-800">{selectedCampaign.ab_testing.variant_a}</p>
                          {selectedCampaign.ab_testing.winner === 'A' && (
                            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                              Winner
                            </span>
                          )}
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-xs font-bold text-purple-900 mb-1">Variant B</p>
                          <p className="text-sm text-purple-800">{selectedCampaign.ab_testing.variant_b}</p>
                          {selectedCampaign.ab_testing.winner === 'B' && (
                            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                              Winner
                            </span>
                          )}
                        </div>
                      </div>
                      {!selectedCampaign.ab_testing.winner && (
                        <p className="text-sm text-slate-600 mt-3">Testing in progress - winner TBD</p>
                      )}
                    </Card>
                  )}
                </div>
              )}

              {/* PERFORMANCE TAB */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-blue-500">
                      <p className="text-xs text-slate-600 mb-1">Impressions</p>
                      <p className="text-2xl font-bold text-blue-600">{(selectedCampaign.impressions / 1000).toFixed(0)}K</p>
                    </Card>
                    <Card className="border-l-4 border-purple-500">
                      <p className="text-xs text-slate-600 mb-1">Clicks</p>
                      <p className="text-2xl font-bold text-purple-600">{(selectedCampaign.clicks / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-slate-600 mt-1">
                        CTR: {((selectedCampaign.clicks / selectedCampaign.impressions) * 100).toFixed(1)}%
                      </p>
                    </Card>
                    <Card className="border-l-4 border-orange-500">
                      <p className="text-xs text-slate-600 mb-1">Conversions</p>
                      <p className="text-2xl font-bold text-orange-600">{selectedCampaign.conversions}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Conv Rate: {((selectedCampaign.conversions / selectedCampaign.clicks) * 100).toFixed(1)}%
                      </p>
                    </Card>
                    <Card className="border-l-4 border-green-500">
                      <p className="text-xs text-slate-600 mb-1">Revenue</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCampaign.revenue / 1000)}<span className="text-sm ml-0.5">K</span></p>
                    </Card>
                  </div>

                  {/* ROI Card */}
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="flex items-center gap-4">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="#e2e8f0"
                            strokeWidth="12"
                            fill="none"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke={selectedCampaign.roi > 150 ? '#10b981' : selectedCampaign.roi > 100 ? '#3b82f6' : '#f59e0b'}
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${Math.min(selectedCampaign.roi * 3.51, 351)} 351`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-3xl font-bold text-slate-900">{selectedCampaign.roi}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-xl mb-2">Return on Investment</h3>
                        <p className={`text-2xl font-bold mb-2 ${
                          selectedCampaign.roi > 150 ? 'text-green-600' :
                          selectedCampaign.roi > 100 ? 'text-blue-600' :
                          'text-orange-600'
                        }`}>
                          {selectedCampaign.roi > 150 ? 'Excellent' :
                           selectedCampaign.roi > 100 ? 'Good' :
                           'Needs Improvement'}
                        </p>
                        <p className="text-sm text-slate-600">
                          For every {currency.symbol}1 spent, you earned {currency.symbol}{(selectedCampaign.roi / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Channel Performance */}
                  <Card className="border-l-4 border-primary-500">
                    <h3 className="font-bold text-slate-900 mb-4">Channel Performance</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600 flex items-center gap-2">
                            <Mail size={16} className="text-blue-600" />
                            Email
                          </span>
                          <span className="text-sm font-bold text-slate-900">45% of conversions</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600 flex items-center gap-2">
                            <Instagram size={16} className="text-purple-600" />
                            Social Media
                          </span>
                          <span className="text-sm font-bold text-slate-900">30% of conversions</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '30%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600 flex items-center gap-2">
                            <Target size={16} className="text-orange-600" />
                            Paid Ads
                          </span>
                          <span className="text-sm font-bold text-slate-900">15% of conversions</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: '15%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600 flex items-center gap-2">
                            <MessageSquare size={16} className="text-green-600" />
                            SMS
                          </span>
                          <span className="text-sm font-bold text-slate-900">10% of conversions</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '10%' }} />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* AI INSIGHTS TAB */}
              {activeTab === 'ai-insights' && (
                <div className="space-y-6">
                  <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-purple-50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center">
                        <Brain className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">🧠 AI Campaign Optimization</h3>
                        <p className="text-sm text-slate-600">Data-driven recommendations to improve performance</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedCampaign.ai_recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border-l-4 border-primary-500 hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 mb-2">{rec}</p>
                            <div className="flex gap-2">
                              <Button size="sm" icon={Zap} onClick={() => {
                                toast.success(`Applying: ${rec}`);
                                setTimeout(() => toast.success('Optimization applied! Campaign updated.'), 1500);
                              }}>
                                Apply Now
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => {
                                setShowScheduleModal(true);
                              }}>
                                Schedule
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Best Performance Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-green-500">
                      <h3 className="font-bold text-green-700 mb-3">Best Performing Channel</h3>
                      <p className="text-2xl font-bold text-slate-900 mb-2">{selectedCampaign.best_channel}</p>
                      <p className="text-sm text-slate-600">Highest conversion rate and ROI</p>
                    </Card>
                    <Card className="border-l-4 border-blue-500">
                      <h3 className="font-bold text-blue-700 mb-3">Best Time to Send</h3>
                      <p className="text-2xl font-bold text-slate-900 mb-2">{selectedCampaign.best_time}</p>
                      <p className="text-sm text-slate-600">Optimal engagement window</p>
                    </Card>
                  </div>

                  {/* AI Score Breakdown */}
                  <Card>
                    <h3 className="font-bold text-slate-900 mb-4">AI Campaign Score: {selectedCampaign.ai_score}/100</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Message Quality</span>
                          <span className="text-sm font-bold">92/100</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Audience Targeting</span>
                          <span className="text-sm font-bold">88/100</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '88%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Channel Mix</span>
                          <span className="text-sm font-bold">95/100</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Timing Strategy</span>
                          <span className="text-sm font-bold">90/100</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }} />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Campaign"
        size="lg"
      >
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          toast.success('Campaign created! AI is analyzing...');
          setShowCreateModal(false);
        }}>
          <p className="text-sm text-slate-600">AI will optimize your campaign for maximum ROI</p>
          
          <div className="space-y-4">
            <Input label="Campaign Name" placeholder="Q1 Product Launch" required />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience (select all that apply)</label>
              <div className="grid grid-cols-2 gap-2">
                {['SMBs', 'Enterprises', 'Startups', 'Nigeria', 'Kenya', 'Ghana', 'Tech', 'Finance'].map((audience) => (
                  <label key={audience} className="flex items-center gap-2 p-2 border border-slate-300 rounded hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{audience}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Channels (AI will optimize)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Email', icon: Mail, color: 'blue' },
                  { name: 'SMS', icon: MessageSquare, color: 'green' },
                  { name: 'Social', icon: Instagram, color: 'purple' },
                  { name: 'Ads', icon: Target, color: 'orange' },
                  { name: 'TV', icon: Tv, color: 'red' },
                  { name: 'Radio', icon: Radio, color: 'pink' },
                ].map(({ name, icon: Icon, color }) => (
                  <label key={name} className={`flex items-center gap-2 p-3 border-2 border-${color}-200 bg-${color}-50 rounded hover:bg-${color}-100 cursor-pointer`}>
                    <input type="checkbox" className="rounded" defaultChecked={['Email', 'SMS', 'Social'].includes(name)} />
                    <Icon className={`text-${color}-600`} size={18} />
                    <span className="text-sm font-medium">{name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label={`Budget (${currency.symbol})`} placeholder="150000" type="number" required />
              <Input label="Start Date" type="date" required />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm font-medium">Enable A/B Testing (AI will create variants)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create & Get AI Recommendations</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Message Modal */}
      {selectedCampaign && (
        <Modal
          isOpen={showEditMessageModal}
          onClose={() => {
            setShowEditMessageModal(false);
            setMessageSubject('');
            setMessageBody('');
          }}
          title="Edit Campaign Message"
          size="lg"
        >
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            toast.success('Message updated successfully!');
            setShowEditMessageModal(false);
            setMessageSubject('');
            setMessageBody('');
          }}>
            <Card className="border-l-4 border-primary-500 bg-primary-50">
              <h3 className="font-bold text-primary-900 mb-2">Campaign: {selectedCampaign.name}</h3>
              <p className="text-sm text-primary-700">Edit your message content below</p>
            </Card>

            <Input
              label="Subject Line / Headline"
              placeholder="Enter compelling subject..."
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Edit className="inline mr-2" size={16} />
                Message Body
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all min-h-[180px]"
                placeholder="Write your message content here..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Tip: Use clear, action-oriented language for best results</p>
            </div>

            <Card>
              <h3 className="font-bold text-slate-900 mb-3">🧠 AI Suggestions</h3>
              <div className="space-y-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setMessageBody('Boost your sales with our proven CRM system. Join 500+ businesses growing 3x faster. Limited time offer!')}>
                  Use AI Template 1
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setMessageBody('Transform your customer relationships today. Get personalized demos and exclusive pricing for early adopters.')}>
                  Use AI Template 2
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setMessageBody('See how industry leaders are scaling their businesses. Request your free consultation now.')}>
                  Use AI Template 3
                </Button>
              </div>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => {
                setShowEditMessageModal(false);
                setMessageSubject('');
                setMessageBody('');
              }}>
                Cancel
              </Button>
              <Button type="submit" icon={CheckCircle}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Schedule Modal */}
      {selectedCampaign && (
        <Modal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setScheduleDate('');
            setScheduleTime('');
          }}
          title="Schedule Optimization"
          size="lg"
        >
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            toast.success(`Optimization scheduled for ${scheduleDate} at ${scheduleTime}`);
            setShowScheduleModal(false);
            setScheduleDate('');
            setScheduleTime('');
          }}>
            <Card className="border-l-4 border-blue-500 bg-blue-50">
              <h3 className="font-bold text-blue-900 mb-2">Campaign: {selectedCampaign.name}</h3>
              <p className="text-sm text-blue-700">Schedule when to apply AI recommendations</p>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Schedule Date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                required
              />
              <Input
                type="time"
                label="Schedule Time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                required
              />
            </div>

            <Card>
              <h3 className="font-bold text-slate-900 mb-3">Quick Schedule</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="secondary" size="sm" onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setScheduleDate(tomorrow.toISOString().split('T')[0]);
                  setScheduleTime('08:00');
                }}>
                  Tomorrow 8 AM
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setScheduleDate(nextWeek.toISOString().split('T')[0]);
                  setScheduleTime('09:00');
                }}>
                  Next Week
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => {
                  const today = new Date();
                  setScheduleDate(today.toISOString().split('T')[0]);
                  setScheduleTime('18:00');
                }}>
                  Today 6 PM
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setScheduleDate(tomorrow.toISOString().split('T')[0]);
                  setScheduleTime('12:00');
                }}>
                  Tomorrow Noon
                </Button>
              </div>
            </Card>

            <Card className="border-l-4 border-green-500 bg-green-50">
              <div className="flex items-start gap-2">
                <Sparkles className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-green-900 mb-1">AI Recommendation</p>
                  <p className="text-sm text-green-800">
                    Best time to apply optimization: {selectedCampaign.best_time} for maximum engagement
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => {
                setShowScheduleModal(false);
                setScheduleDate('');
                setScheduleTime('');
              }}>
                Cancel
              </Button>
              <Button type="submit" icon={Calendar}>
                Schedule Optimization
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
