import React, { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Truck,
  Globe,
  Brain,
  Plus,
  Eye,
  Star,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';

interface Competitor {
  id: string;
  name: string;
  brand: string;
  website: string;
  industry: string;
  competitor_type: string;
  
  // Market Analysis
  price: number;
  market_share: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  market_position: 'leader' | 'challenger' | 'follower' | 'niche';
  
  // Product Strategy
  product_quality: number; // 1-10
  pricing_strategy: 'premium' | 'competitive' | 'budget' | 'value';
  innovation_level: number; // 1-10
  customer_satisfaction: number; // 1-10
  
  // USP & Product Details
  usp?: string; // Unique Selling Proposition
  package_design?: string; // Package description
  key_features?: string[]; // Main product features
  
  // Customer & Market
  target_audience: string;
  pain_points: string;
  strengths: string;
  weaknesses: string;
  
  // Distribution & Marketing
  distribution_channels: string[];
  marketing_channels: string[];
  
  // AI Analysis
  ai_threat_score: number;
  ai_recommendations: string[];
  last_activity: string;
}

export const Competitors: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>(() => {
    // Load competitors from localStorage on initial render
    try {
      const saved = localStorage.getItem('copcca-competitors');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load competitors from localStorage:', error);
      return [];
    }
  });
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'ai-strategy'>('overview');
  const { formatCurrency, convertAmount } = useCurrency();
  const [form, setForm] = useState({
    name: '',
    brand: '',
    website: '',
    industry: '',
    price: '',
    market_share: '',
    market_position: 'leader' as Competitor['market_position'],
    threat_level: 'medium' as Competitor['threat_level'],
    // Product Strategy
    product_quality: 7,
    pricing_strategy: 'competitive' as Competitor['pricing_strategy'],
    innovation_level: 6,
    customer_satisfaction: 7,
    // USP & Product Details
    usp: '',
    package_design: '',
    key_features: [] as string[],
    // Customer & Market
    target_audience: '',
    pain_points: '',
    strengths: '',
    weaknesses: '',
    // Distribution & Marketing
    distribution_channels: [] as string[],
    marketing_channels: [] as string[],
  });

  // Save competitors to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('copcca-competitors', JSON.stringify(competitors));
    } catch (error) {
      console.error('Failed to save competitors to localStorage:', error);
    }
  }, [competitors]);

  const getThreatColor = (level: string) => {
    const colors = {
      low: 'bg-green-100 text-green-700 border-green-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      critical: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[level as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const getPositionIcon = (position: string) => {
    if (position === 'leader') return <Star className="text-yellow-500" size={20} />;
    if (position === 'challenger') return <Zap className="text-orange-500" size={20} />;
    if (position === 'follower') return <TrendingDown className="text-slate-500" size={20} />;
    return <Target className="text-blue-500" size={20} />;
  };

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Competitor name is required');
      return;
    }

    // Generate AI threat score based on form data
    const aiThreatScore = Math.floor(
      (form.market_share ? Number(form.market_share) : 0) * 0.3 +
      (form.product_quality / 10) * 20 +
      (form.innovation_level / 10) * 25 +
      (form.customer_satisfaction / 10) * 15 +
      (form.threat_level === 'critical' ? 40 : form.threat_level === 'high' ? 25 : form.threat_level === 'medium' ? 10 : 5)
    );

    // Generate AI recommendations based on competitor data
    const aiRecommendations = [];
    if (form.market_share && Number(form.market_share) > 20) {
      aiRecommendations.push('High market share - monitor pricing closely');
    }
    if (form.innovation_level > 7) {
      aiRecommendations.push('High innovation - invest in R&D to stay competitive');
    }
    if (form.customer_satisfaction > 8) {
      aiRecommendations.push('Strong customer satisfaction - focus on customer experience');
    }
    if (form.strengths) {
      aiRecommendations.push(`Counter their strengths: ${form.strengths.slice(0, 50)}...`);
    }
    if (form.weaknesses) {
      aiRecommendations.push(`Exploit their weaknesses: ${form.weaknesses.slice(0, 50)}...`);
    }
    if (aiRecommendations.length === 0) {
      aiRecommendations.push('Monitor this competitor closely for emerging threats');
    }

    const newCompetitor: Competitor = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      brand: form.brand.trim() || form.name.trim(),
      website: form.website.trim() || 'example.com',
      industry: form.industry.trim() || 'General',
      competitor_type: 'Direct',
      price: Number(form.price) || 0,
      market_share: Number(form.market_share) || 0,
      threat_level: form.threat_level,
      market_position: form.market_position,
      product_quality: form.product_quality,
      pricing_strategy: form.pricing_strategy,
      innovation_level: form.innovation_level,
      customer_satisfaction: form.customer_satisfaction,
      usp: form.usp || 'Newly added competitor',
      package_design: form.package_design || 'N/A',
      key_features: form.key_features,
      target_audience: form.target_audience || 'TBD',
      pain_points: form.pain_points || 'TBD',
      strengths: form.strengths || 'TBD',
      weaknesses: form.weaknesses || 'TBD',
      distribution_channels: form.distribution_channels,
      marketing_channels: form.marketing_channels,
      ai_threat_score: Math.min(aiThreatScore, 100),
      ai_recommendations: aiRecommendations,
      last_activity: new Date().toISOString().slice(0, 10),
    };

    setCompetitors((prev) => [newCompetitor, ...prev]);
    toast.success('Competitor added with AI analysis activated! 🧠');
    setShowAddModal(false);
    setForm({
      name: '',
      brand: '',
      website: '',
      industry: '',
      price: '',
      market_share: '',
      market_position: 'leader',
      threat_level: 'medium',
      product_quality: 7,
      pricing_strategy: 'competitive',
      innovation_level: 6,
      customer_satisfaction: 7,
      usp: '',
      package_design: '',
      key_features: [],
      target_audience: '',
      pain_points: '',
      strengths: '',
      weaknesses: '',
      distribution_channels: [],
      marketing_channels: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🎯 Competitive Intelligence</h1>
          <p className="text-slate-600 mt-1">Know your enemies, win the market</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>Add Competitor</Button>
      </div>

      {/* Threat Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-red-500">
          <AlertTriangle className="text-red-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Critical Threats</p>
          <p className="text-3xl font-bold text-red-600">{competitors.filter(c => c.threat_level === 'critical').length}</p>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <Shield className="text-orange-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">High Threats</p>
          <p className="text-3xl font-bold text-orange-600">{competitors.filter(c => c.threat_level === 'high').length}</p>
        </Card>
        <Card className="border-l-4 border-primary-500">
          <Target className="text-primary-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Avg Market Share</p>
          <p className="text-3xl font-bold text-primary-600">
            {Math.round(competitors.reduce((sum, c) => sum + c.market_share, 0) / competitors.length)}%
          </p>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <Brain className="text-purple-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">AI Monitoring</p>
          <p className="text-3xl font-bold text-purple-600">{competitors.length}</p>
        </Card>
      </div>

      {/* Competitor Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {competitors.map((competitor) => (
          <Card 
            key={competitor.id} 
            hover 
            className="cursor-pointer"
            onClick={() => setSelectedCompetitor(competitor)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getPositionIcon(competitor.market_position)}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{competitor.name}</h3>
                  <p className="text-sm text-slate-600">{competitor.industry} • {competitor.competitor_type}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getThreatColor(competitor.threat_level)}`}>
                {competitor.threat_level.toUpperCase()}
              </span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
              <div>
                <p className="text-xs text-slate-600 mb-1">Market Share</p>
                <p className="text-xl font-bold text-primary-600">{competitor.market_share}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Price</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(convertAmount(competitor.price))}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">AI Threat</p>
                <p className={`text-xl font-bold ${
                  competitor.ai_threat_score > 70 ? 'text-red-600' :
                  competitor.ai_threat_score > 50 ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {competitor.ai_threat_score}
                </p>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="space-y-3 mb-4">
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-1 flex items-center gap-1">
                  <TrendingUp size={14} />
                  Strengths
                </h4>
                <p className="text-sm text-slate-700 line-clamp-2">{competitor.strengths}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-1 flex items-center gap-1">
                  <TrendingDown size={14} />
                  Weaknesses
                </h4>
                <p className="text-sm text-slate-700 line-clamp-2">{competitor.weaknesses}</p>
              </div>
            </div>

            {/* Last Activity */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-900">Last Activity:</p>
              <p className="text-sm text-blue-700">{competitor.last_activity}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button 
                size="sm" 
                icon={Eye}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCompetitor(competitor);
                }}
              >
                View Intel
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.success('Comparison report generated');
                }}
              >
                Compare
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Detailed Competitor Modal */}
      {selectedCompetitor && (
        <Modal
          isOpen={!!selectedCompetitor}
          onClose={() => {
            setSelectedCompetitor(null);
            setActiveTab('overview');
          }}
          title={selectedCompetitor.name}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${
                  selectedCompetitor.threat_level === 'critical' ? 'from-red-600 to-pink-600' :
                  selectedCompetitor.threat_level === 'high' ? 'from-orange-600 to-red-600' :
                  selectedCompetitor.threat_level === 'medium' ? 'from-yellow-600 to-orange-600' :
                  'from-green-600 to-emerald-600'
                } flex items-center justify-center shadow-lg`}>
                  <Target className="text-white" size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-slate-900">{selectedCompetitor.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getThreatColor(selectedCompetitor.threat_level)}`}>
                      {selectedCompetitor.threat_level.toUpperCase()} THREAT
                    </span>
                  </div>
                  <p className="text-slate-600">{selectedCompetitor.brand} • {selectedCompetitor.industry}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
              <div className="flex gap-6">
                {(['overview', 'comparison', 'ai-strategy'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 px-2 font-medium transition-colors relative ${
                      activeTab === tab
                        ? 'text-primary-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'overview' && '📊 Overview'}
                    {tab === 'comparison' && '⚔️ Comparison'}
                    {tab === 'ai-strategy' && '🧠 AI Strategy'}
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
                  {/* Market Analysis */}
                  <Card className="border-l-4 border-primary-500">
                    <h3 className="font-bold text-slate-900 mb-4">📈 Market Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Market Share</p>
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                              className="bg-primary-600 h-3 rounded-full"
                              style={{ width: `${selectedCompetitor.market_share}%` }}
                            />
                          </div>
                          <span className="text-lg font-bold text-slate-900">{selectedCompetitor.market_share}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Price</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(convertAmount(selectedCompetitor.price))}</p>
                        <p className="text-xs text-slate-600 capitalize">{selectedCompetitor.pricing_strategy} strategy</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Market Position</p>
                        <div className="flex items-center gap-2">
                          {getPositionIcon(selectedCompetitor.market_position)}
                          <span className="font-bold text-slate-900 capitalize">{selectedCompetitor.market_position}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">AI Threat Score</p>
                        <p className={`text-2xl font-bold ${
                          selectedCompetitor.ai_threat_score > 70 ? 'text-red-600' :
                          selectedCompetitor.ai_threat_score > 50 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {selectedCompetitor.ai_threat_score}/100
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Product Strategy */}
                  <Card className="border-l-4 border-purple-500">
                    <h3 className="font-bold text-slate-900 mb-4">🎯 Product Strategy</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Product Quality</span>
                          <span className="font-bold">{selectedCompetitor.product_quality}/10</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${selectedCompetitor.product_quality * 10}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Innovation Level</span>
                          <span className="font-bold">{selectedCompetitor.innovation_level}/10</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${selectedCompetitor.innovation_level * 10}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Customer Satisfaction</span>
                          <span className="font-bold">{selectedCompetitor.customer_satisfaction}/10</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${selectedCompetitor.customer_satisfaction * 10}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* SWOT-style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-green-500">
                      <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Strengths
                      </h3>
                      <p className="text-slate-700">{selectedCompetitor.strengths}</p>
                    </Card>
                    <Card className="border-l-4 border-red-500">
                      <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                        <TrendingDown size={20} />
                        Weaknesses
                      </h3>
                      <p className="text-slate-700">{selectedCompetitor.weaknesses}</p>
                    </Card>
                  </div>

                  {/* Customer & Market */}
                  <Card className="border-l-4 border-blue-500">
                    <h3 className="font-bold text-slate-900 mb-4">👥 Customer & Market Insights</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Target Audience</p>
                        <p className="text-slate-900">{selectedCompetitor.target_audience}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Their Customer Pain Points</p>
                        <p className="text-slate-900">{selectedCompetitor.pain_points}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Distribution & Marketing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Truck className="text-orange-600" size={20} />
                        Distribution Channels
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCompetitor.distribution_channels.map((channel, idx) => (
                          <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            {channel}
                          </span>
                        ))}
                      </div>
                    </Card>
                    <Card>
                      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Globe className="text-blue-600" size={20} />
                        Marketing Channels
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCompetitor.marketing_channels.map((channel, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {channel}
                          </span>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* COMPARISON TAB */}
              {activeTab === 'comparison' && (
                <div className="space-y-6">
                  <Card className="border-2 border-primary-200">
                    <h3 className="font-bold text-slate-900 mb-4">⚔️ Your Product vs {selectedCompetitor.name}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-medium text-slate-900">Metric</th>
                            <th className="text-center py-3 px-4 font-medium text-green-700">✅ Your Product</th>
                            <th className="text-center py-3 px-4 font-medium text-red-700">❌ {selectedCompetitor.brand}</th>
                            <th className="text-center py-3 px-4 font-medium text-slate-900">Winner</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-3 px-4 font-medium">Price</td>
                            <td className="py-3 px-4 text-center text-green-700 font-bold">{formatCurrency(convertAmount(24.99))}</td>
                            <td className="py-3 px-4 text-center text-red-700 font-bold">{formatCurrency(convertAmount(selectedCompetitor.price))}</td>
                            <td className="py-3 px-4 text-center">
                              {24.99 < selectedCompetitor.price ? '🏆 You' : '🏆 Them'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-3 px-4 font-medium">Product Quality</td>
                            <td className="py-3 px-4 text-center text-green-700 font-bold">9/10</td>
                            <td className="py-3 px-4 text-center text-red-700 font-bold">{selectedCompetitor.product_quality}/10</td>
                            <td className="py-3 px-4 text-center">
                              {9 > selectedCompetitor.product_quality ? '🏆 You' : '🏆 Them'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-3 px-4 font-medium">Innovation</td>
                            <td className="py-3 px-4 text-center text-green-700 font-bold">9/10</td>
                            <td className="py-3 px-4 text-center text-red-700 font-bold">{selectedCompetitor.innovation_level}/10</td>
                            <td className="py-3 px-4 text-center">
                              {9 > selectedCompetitor.innovation_level ? '🏆 You' : '🏆 Them'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-3 px-4 font-medium">Customer Satisfaction</td>
                            <td className="py-3 px-4 text-center text-green-700 font-bold">8.5/10</td>
                            <td className="py-3 px-4 text-center text-red-700 font-bold">{selectedCompetitor.customer_satisfaction}/10</td>
                            <td className="py-3 px-4 text-center">
                              {8.5 > selectedCompetitor.customer_satisfaction ? '🏆 You' : '🏆 Them'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-3 px-4 font-medium">Market Share</td>
                            <td className="py-3 px-4 text-center text-green-700 font-bold">15%</td>
                            <td className="py-3 px-4 text-center text-red-700 font-bold">{selectedCompetitor.market_share}%</td>
                            <td className="py-3 px-4 text-center">
                              {15 > selectedCompetitor.market_share ? '🏆 You' : '🏆 Them'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                    <h3 className="font-bold text-green-900 mb-3">💪 Your Competitive Advantages</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-green-800">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Better pricing with more features</span>
                      </li>
                      <li className="flex items-start gap-2 text-green-800">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Superior customer support & faster response time</span>
                      </li>
                      <li className="flex items-start gap-2 text-green-800">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Mobile-first design (they don't have a mobile app)</span>
                      </li>
                      <li className="flex items-start gap-2 text-green-800">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>AI-powered competitive intelligence (unique to you)</span>
                      </li>
                    </ul>
                  </Card>
                </div>
              )}

              {/* AI STRATEGY TAB */}
              {activeTab === 'ai-strategy' && (
                <div className="space-y-6">
                  <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-purple-50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center">
                        <Brain className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">🧠 AI Strategy Recommendations</h3>
                        <p className="text-sm text-slate-600">Based on competitive intelligence analysis</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedCompetitor.ai_recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border-l-4 border-primary-500 hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 mb-2">{rec}</p>
                            <div className="flex gap-2">
                              <Button size="sm" icon={Zap} onClick={() => toast.success('Strategy activated')}>
                                Execute
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => toast.success('Added to task list')}>
                                Create Task
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="border-l-4 border-orange-500">
                    <h3 className="font-bold text-slate-900 mb-4">⚠️ Threat Assessment</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Overall Threat Level</span>
                          <span className={`font-bold text-lg ${
                            selectedCompetitor.ai_threat_score > 70 ? 'text-red-600' :
                            selectedCompetitor.ai_threat_score > 50 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {selectedCompetitor.ai_threat_score}/100
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-4">
                          <div
                            className={`h-4 rounded-full ${
                              selectedCompetitor.ai_threat_score > 70 ? 'bg-red-500' :
                              selectedCompetitor.ai_threat_score > 50 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${selectedCompetitor.ai_threat_score}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2">💡 AI Insight:</p>
                        <p className="text-sm text-blue-700">
                          {selectedCompetitor.threat_level === 'critical' && 
                            'This competitor requires immediate attention. Schedule weekly monitoring and activate defensive pricing strategy.'}
                          {selectedCompetitor.threat_level === 'high' && 
                            'Monitor closely. They are innovating fast. Consider highlighting your advantages in marketing.'}
                          {selectedCompetitor.threat_level === 'medium' && 
                            'Standard monitoring. Focus on maintaining your competitive advantages.'}
                          {selectedCompetitor.threat_level === 'low' && 
                            'Low priority threat. You can poach their customers as they seek to scale.'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="border-l-4 border-purple-500">
                    <h3 className="font-bold text-slate-900 mb-4">📅 Recommended Actions Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-16 text-center">
                          <p className="text-xs font-bold text-red-600">NOW</p>
                        </div>
                        <div className="flex-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-slate-900">Review their recent pricing change</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-16 text-center">
                          <p className="text-xs font-bold text-orange-600">WEEK 1</p>
                        </div>
                        <div className="flex-1 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm font-medium text-slate-900">Launch counter-marketing campaign</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-16 text-center">
                          <p className="text-xs font-bold text-blue-600">WEEK 2-4</p>
                        </div>
                        <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-slate-900">Target their unhappy customers with migration offers</p>
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

      {/* Add Competitor Modal - Comprehensive Form */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="🎯 Add New Competitor - Deep Analysis"
        size="xl"
      >
        <form className="space-y-6 max-h-[600px] overflow-y-auto pr-2" onSubmit={handleAddCompetitor}>
          <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            🤖 Complete this form to activate AI-powered competitive intelligence and strategic counter-moves
          </p>
          
          {/* Basic Information */}
          <Card className="border-l-4 border-blue-500">
            <h3 className="font-bold text-slate-900 mb-4">📋 Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name"
                placeholder="RivalTech Pro"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Brand"
                placeholder="RivalTech"
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
              <Input
                label="Website"
                placeholder="https://rivaltech.com"
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
              <Input
                label="Industry"
                placeholder="SaaS, Fintech"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Competitor Type</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                  <option>Direct</option>
                  <option>Indirect</option>
                  <option>Potential</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Package Design Description</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                  rows={2}
                  placeholder="Describe packaging: colors, size, materials, unique features..."
                  value={form.package_design}
                  onChange={(e) => setForm({ ...form, package_design: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Market Analysis */}
          <Card className="border-l-4 border-orange-500">
            <h3 className="font-bold text-slate-900 mb-4">📊 Market Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Price (₦)" 
                placeholder="29.99" 
                type="number" 
                step="0.01" 
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <Input
                label="Market Share (%)"
                placeholder="25"
                type="number"
                min="0"
                max="100"
                value={form.market_share}
                onChange={(e) => setForm({ ...form, market_share: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Threat Level</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  value={form.threat_level}
                  onChange={(e) => setForm({ ...form, threat_level: e.target.value as Competitor['threat_level'] })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Market Position</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  value={form.market_position}
                  onChange={(e) => setForm({ ...form, market_position: e.target.value as Competitor['market_position'] })}
                >
                  <option value="leader">Leader</option>
                  <option value="challenger">Challenger</option>
                  <option value="follower">Follower</option>
                  <option value="niche">Niche</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Product Strategy */}
          <Card className="border-l-4 border-purple-500">
            <h3 className="font-bold text-slate-900 mb-4">🎯 Product Strategy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Product Quality (1-10)" 
                placeholder="8" 
                type="number" 
                min="1" 
                max="10"
                value={form.product_quality}
                onChange={(e) => setForm({ ...form, product_quality: Number(e.target.value) })}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pricing Strategy</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  value={form.pricing_strategy}
                  onChange={(e) => setForm({ ...form, pricing_strategy: e.target.value as Competitor['pricing_strategy'] })}
                >
                  <option value="premium">Premium</option>
                  <option value="competitive">Competitive</option>
                  <option value="budget">Budget</option>
                  <option value="value">Value-Based</option>
                </select>
              </div>
              <Input 
                label="Innovation Level (1-10)" 
                placeholder="9" 
                type="number" 
                min="1" 
                max="10"
                value={form.innovation_level}
                onChange={(e) => setForm({ ...form, innovation_level: Number(e.target.value) })}
              />
              <Input 
                label="Customer Satisfaction (1-10)" 
                placeholder="7" 
                type="number" 
                min="1" 
                max="10"
                value={form.customer_satisfaction}
                onChange={(e) => setForm({ ...form, customer_satisfaction: Number(e.target.value) })}
              />
            </div>
          </Card>

          {/* USP & Features */}
          <Card className="border-l-4 border-green-500">
            <h3 className="font-bold text-slate-900 mb-4">💡 USP & Key Features</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Unique Selling Proposition (USP)</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                  rows={2}
                  placeholder="What makes them unique? Their main competitive advantage..."
                  value={form.usp}
                  onChange={(e) => setForm({ ...form, usp: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Key Features (comma-separated)</label>
                <Input 
                  placeholder="AI-powered analytics, Real-time reporting, Mobile app, 24/7 support"
                  value={form.key_features.join(', ')}
                  onChange={(e) => setForm({ ...form, key_features: e.target.value.split(',').map(f => f.trim()).filter(f => f) })}
                />
              </div>
            </div>
          </Card>

          {/* Customer Insights */}
          <Card className="border-l-4 border-red-500">
            <h3 className="font-bold text-slate-900 mb-4">👥 Customer Insights</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
                <Input 
                  placeholder="SMBs, Startups, Enterprise customers..."
                  value={form.target_audience}
                  onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer Pain Points</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                  rows={2}
                  placeholder="What problems do their customers face?"
                  value={form.pain_points}
                  onChange={(e) => setForm({ ...form, pain_points: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Their Strengths</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                  rows={2}
                  placeholder="What are they doing well?"
                  value={form.strengths}
                  onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Their Weaknesses</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                  rows={2}
                  placeholder="Where can we beat them?"
                  value={form.weaknesses}
                  onChange={(e) => setForm({ ...form, weaknesses: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Distribution Channels */}
          <Card className="border-l-4 border-cyan-500">
            <h3 className="font-bold text-slate-900 mb-4">🚚 Distribution Channels</h3>
            <p className="text-sm text-slate-600 mb-3">Select all channels they use:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Online Store', 'Retail Stores', 'Wholesale', 'Direct Sales', 'Distributors', 'Social Media'].map((channel) => (
                <label key={channel} className="flex items-center gap-2 p-2 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-primary-600"
                    checked={form.distribution_channels.includes(channel)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, distribution_channels: [...form.distribution_channels, channel] });
                      } else {
                        setForm({ ...form, distribution_channels: form.distribution_channels.filter(c => c !== channel) });
                      }
                    }}
                  />
                  <span className="text-sm text-slate-700">{channel}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Marketing Channels */}
          <Card className="border-l-4 border-pink-500">
            <h3 className="font-bold text-slate-900 mb-4">📢 Marketing Channels</h3>
            <p className="text-sm text-slate-600 mb-3">Select all marketing channels they're active on:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Social Media', 'TV Ads', 'Radio', 'Print Media', 'Digital Ads', 'Influencers', 'SEO/Content', 'Email Marketing'].map((channel) => (
                <label key={channel} className="flex items-center gap-2 p-2 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-primary-600"
                    checked={form.marketing_channels.includes(channel)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, marketing_channels: [...form.marketing_channels, channel] });
                      } else {
                        setForm({ ...form, marketing_channels: form.marketing_channels.filter(c => c !== channel) });
                      }
                    }}
                  />
                  <span className="text-sm text-slate-700">{channel}</span>
                </label>
              ))}
            </div>
          </Card>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={Brain}>Add Competitor & Activate AI Analysis</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
