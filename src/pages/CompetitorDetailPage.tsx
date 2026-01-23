import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Globe,
  Brain,
  Star,
  Zap,
  Edit,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

interface Competitor {
  id: string;
  name: string;
  brand: string;
  website: string;
  industry: string;
  competitor_type: string;
  price: number;
  price_type: 'per unit' | 'per item' | 'per month' | 'per year' | 'one-time';
  market_share: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  market_position: 'leader' | 'challenger' | 'follower' | 'niche';
  product_quality: number;
  pricing_strategy: 'premium' | 'competitive' | 'budget' | 'value';
  innovation_level: number;
  customer_satisfaction: number;
  usp?: string;
  package_design?: string;
  key_features?: string[];
  target_audience: string;
  pain_points: string;
  strengths: string;
  weaknesses: string;
  distribution_channels: string[];
  marketing_channels: string[];
  ai_threat_score: number;
  ai_recommendations: string[];
  last_activity: string;
}

export const CompetitorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency, convertAmount } = useCurrency();
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'strategy' | 'ai-insights'>('overview');

  useEffect(() => {
    // Load competitor from localStorage
    const saved = localStorage.getItem('copcca-competitors');
    if (saved) {
      const competitors: Competitor[] = JSON.parse(saved);
      const foundCompetitor = competitors.find(c => c.id === id);
      if (foundCompetitor) {
        setCompetitor(foundCompetitor);
      }
    }
  }, [id]);

  const getThreatColor = (threat: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      low: 'bg-green-100 text-green-700 border-green-300',
    };
    return colors[threat as keyof typeof colors] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const getThreatIcon = (threat: string) => {
    switch (threat) {
      case 'critical': return <AlertTriangle className="text-red-600" size={16} />;
      case 'high': return <Shield className="text-orange-600" size={16} />;
      case 'medium': return <Target className="text-yellow-600" size={16} />;
      default: return <Star className="text-green-600" size={16} />;
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'leader': return <Star className="text-purple-600" size={16} />;
      case 'challenger': return <TrendingUp className="text-blue-600" size={16} />;
      case 'follower': return <Target className="text-slate-600" size={16} />;
      default: return <Globe className="text-green-600" size={16} />;
    }
  };

  if (!competitor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Target className="mx-auto text-slate-400 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Competitor Not Found</h2>
          <p className="text-slate-600 mb-4">The competitor you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/app/competitors')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Competitors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Button
                icon={ArrowLeft}
                variant="secondary"
                size="sm"
                onClick={() => navigate('/app/competitors')}
              >
                Back to Competitors
              </Button>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r flex-shrink-0 ${getThreatGradient(competitor.threat_level)} flex items-center justify-center shadow-lg`}>
                  {getPositionIcon(competitor.market_position)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold text-slate-900">{competitor.name}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getThreatColor(competitor.threat_level)}`}>
                      {getThreatIcon(competitor.threat_level)}
                      {competitor.threat_level.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-600">{competitor.industry} • {competitor.brand}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                icon={Edit}
                variant="outline"
                onClick={() => {
                  toast.info('Edit functionality coming soon!');
                }}
              >
                Edit
              </Button>
              <Button
                icon={Trash2}
                variant="outline"
                onClick={() => {
                  // Handle delete
                  const saved = localStorage.getItem('copcca-competitors');
                  if (saved) {
                    const competitors: Competitor[] = JSON.parse(saved);
                    const updatedCompetitors = competitors.filter(c => c.id !== competitor.id);
                    localStorage.setItem('copcca-competitors', JSON.stringify(updatedCompetitors));
                    toast.success('Competitor deleted successfully');
                    navigate('/app/competitors');
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 mb-6">
            <div className="flex gap-6">
              {[
                { id: 'overview', label: 'Overview', icon: Target },
                { id: 'analysis', label: 'Market Analysis', icon: TrendingUp },
                { id: 'strategy', label: 'Strategy & USP', icon: Zap },
                { id: 'ai-insights', label: 'AI Insights', icon: Brain },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-l-4 border-red-500">
                <AlertTriangle className="text-red-600 mb-2" size={24} />
                <p className="text-sm text-slate-600">Threat Level</p>
                <p className="text-3xl font-bold text-red-600">{competitor.threat_level.toUpperCase()}</p>
              </Card>
              <Card className="border-l-4 border-blue-500">
                <Target className="text-blue-600 mb-2" size={24} />
                <p className="text-sm text-slate-600">Market Share</p>
                <p className="text-3xl font-bold text-blue-600">{competitor.market_share}%</p>
              </Card>
              <Card className="border-l-4 border-purple-500">
                <Star className="text-purple-600 mb-2" size={24} />
                <p className="text-sm text-slate-600">Product Quality</p>
                <p className="text-3xl font-bold text-purple-600">{competitor.product_quality}/10</p>
              </Card>
              <Card className="border-l-4 border-orange-500">
                <TrendingUp className="text-orange-600 mb-2" size={24} />
                <p className="text-sm text-slate-600">Innovation Level</p>
                <p className="text-3xl font-bold text-orange-600">{competitor.innovation_level}/10</p>
              </Card>
            </div>

            {/* Performance Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Market Position</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Position</span>
                    <span className="font-semibold capitalize">{competitor.market_position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Pricing Strategy</span>
                    <span className="font-semibold capitalize">{competitor.pricing_strategy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Customer Satisfaction</span>
                    <span className="font-semibold">{competitor.customer_satisfaction}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Price</span>
                    <span className="font-semibold">{formatCurrency(convertAmount(competitor.price))}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">AI Threat Assessment</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">AI Threat Score</span>
                    <span className="font-semibold">{competitor.ai_threat_score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Last Activity</span>
                    <span className="font-semibold">{new Date(competitor.last_activity).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Target Audience</p>
                    <p className="text-sm text-slate-600">{competitor.target_audience}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={20} />
                  Strengths
                </h3>
                <p className="text-slate-600">{competitor.strengths}</p>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingDown className="text-red-600" size={20} />
                  Weaknesses
                </h3>
                <p className="text-slate-600">{competitor.weaknesses}</p>
              </Card>
            </div>

            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Pain Points Addressed</h3>
              <p className="text-slate-600">{competitor.pain_points}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Distribution Channels</h3>
                <div className="flex flex-wrap gap-2">
                  {competitor.distribution_channels.map((channel, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {channel}
                    </span>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Marketing Channels</h3>
                <div className="flex flex-wrap gap-2">
                  {competitor.marketing_channels.map((channel, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {channel}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-6">
            {competitor.usp && (
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Unique Selling Proposition (USP)</h3>
                <p className="text-slate-600">{competitor.usp}</p>
              </Card>
            )}

            {competitor.package_design && (
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Package Design</h3>
                <p className="text-slate-600">{competitor.package_design}</p>
              </Card>
            )}

            {competitor.key_features && competitor.key_features.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {competitor.key_features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Zap className="text-blue-600 flex-shrink-0" size={16} />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'ai-insights' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Brain className="text-purple-600" size={20} />
                AI Strategic Recommendations
              </h3>
              <div className="space-y-3">
                {competitor.ai_recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <Sparkles className="text-purple-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-purple-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">AI Threat Assessment</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${competitor.ai_threat_score}%` }}
                  ></div>
                </div>
                <span className="text-2xl font-bold text-slate-900">{competitor.ai_threat_score}/100</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {competitor.ai_threat_score > 70 ? 'High threat - requires immediate attention' :
                 competitor.ai_threat_score > 50 ? 'Medium threat - monitor closely' :
                 'Low threat - maintain awareness'}
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const getThreatGradient = (threat: string) => {
  switch (threat) {
    case 'critical': return 'from-red-600 to-red-700';
    case 'high': return 'from-orange-600 to-orange-700';
    case 'medium': return 'from-yellow-600 to-yellow-700';
    default: return 'from-green-600 to-green-700';
  }
};