import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  Banknote,
  Target,
  Star,
  Brain,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Award,
  Sparkles,
  Edit,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

interface Competitor {
  brand: string;
  name: string;
  industry: string;
  threat_level: 'critical' | 'high' | 'medium' | 'low';
  price?: number;
  market_share?: number;
  product_quality?: number;
  customer_satisfaction?: number;
  market_position?: string;
  strategy?: string;
  pricing_strategy?: string;
  key_features?: string[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  monthly_revenue: number;
  total_revenue: number;
  units_sold: number;
  growth_rate: number;
  market_share: number;
  market_position: 'leader' | 'growing' | 'stable' | 'declining';
  customer_satisfaction: number;
  ai_score: number;
  ai_recommendations: string[];
  pricing_recommendation: string;
  positioning_recommendation: string;
  sales_trend: number[];
  revenue_trend: number[];
  competitor_products: {
    name: string;
    competitor: string;
    price: number;
    quality: number;
    advantage: string;
  }[];
  feedback_summary: {
    positive_count: number;
    negative_count: number;
    top_praise: string;
    top_complaint: string;
  };
}

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency, convertAmount } = useCurrency();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'competitive' | 'feedback' | 'ai-insights'>('overview');

  useEffect(() => {
    // Load product from localStorage
    const saved = localStorage.getItem('copcca-products');
    if (saved) {
      const products: Product[] = JSON.parse(saved);
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
      }
    }
  }, [id]);

  const getPositionColor = (position: string) => {
    const colors = {
      leader: 'bg-green-100 text-green-700 border-green-300',
      growing: 'bg-blue-100 text-blue-700 border-blue-300',
      stable: 'bg-slate-100 text-slate-700 border-slate-300',
      declining: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[position as keyof typeof colors] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'leader': return <Award className="text-green-600" size={16} />;
      case 'growing': return <TrendingUp className="text-blue-600" size={16} />;
      case 'stable': return <Target className="text-slate-600" size={16} />;
      default: return <TrendingDown className="text-red-600" size={16} />;
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto text-slate-400 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Product Not Found</h2>
          <p className="text-slate-600 mb-4">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/app/products')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Products
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
                onClick={() => navigate('/app/products')}
              >
                Back to Products
              </Button>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r flex-shrink-0 ${getPositionGradient(product.market_position)} flex items-center justify-center shadow-lg`}>
                  <Package className="text-white" size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getPositionColor(product.market_position)}`}>
                      {getPositionIcon(product.market_position)}
                      {product.market_position.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-600">{product.category} • {formatCurrency(convertAmount(product.price))}</p>
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
                  const saved = localStorage.getItem('copcca-products');
                  if (saved) {
                    const products: Product[] = JSON.parse(saved);
                    const updatedProducts = products.filter(p => p.id !== product.id);
                    localStorage.setItem('copcca-products', JSON.stringify(updatedProducts));
                    toast.success('Product deleted successfully');
                    navigate('/app/products');
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
                { id: 'overview', label: 'Overview', icon: Package },
                { id: 'competitive', label: 'Competitive Analysis', icon: Target },
                { id: 'feedback', label: 'Customer Feedback', icon: MessageSquare },
                { id: 'ai-insights', label: 'AI Insights', icon: Brain },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
              <Card className="border-l-4 border-green-500">
                <Banknote className="text-green-600 mb-2" size={24} />
                <p className="text-sm text-slate-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(product.monthly_revenue)}</p>
              </Card>
              <Card className="border-l-4 border-blue-500">
                <TrendingUp className="text-blue-600 mb-2" size={24} />
                <p className="text-sm text-slate-600">Growth Rate</p>
                <p className="text-3xl font-bold text-blue-600">{product.growth_rate}%</p>
              </Card>
              <Card className="border-l-4 border-purple-500">
                <Star className="text-purple-600 mb-2" size={24} />
                <p className="text-sm text-slate-600">Customer Satisfaction</p>
                <p className="text-3xl font-bold text-purple-600">{product.customer_satisfaction}/10</p>
              </Card>
              <Card className="border-l-4 border-orange-500">
                <Target className="text-orange-600 mb-2" size={24} />
                <p className="text-sm text-slate-600">Market Share</p>
                <p className="text-3xl font-bold text-orange-600">{product.market_share}%</p>
              </Card>
            </div>

            {/* Performance Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Revenue</span>
                    <span className="font-semibold">{formatCurrency(product.total_revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Units Sold</span>
                    <span className="font-semibold">{product.units_sold.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">AI Score</span>
                    <span className="font-semibold">{product.ai_score}/100</span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">AI Recommendations</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Pricing Strategy</p>
                    <p className="text-sm text-slate-600">{product.pricing_recommendation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Positioning</p>
                    <p className="text-sm text-slate-600">{product.positioning_recommendation}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'competitive' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Competitor Analysis</h3>
              <div className="space-y-4">
                {(() => {
                  // Load competitors from localStorage
                  const savedCompetitors = localStorage.getItem('copcca-competitors');
                  const competitors = savedCompetitors ? JSON.parse(savedCompetitors) : [];
                  
                  // Filter competitors in the same industry/category
                  const relevantCompetitors = competitors.filter((comp: Competitor) => 
                    comp.industry.toLowerCase().includes(product.category.toLowerCase()) ||
                    product.category.toLowerCase().includes(comp.industry.toLowerCase())
                  );

                  if (relevantCompetitors.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Target className="mx-auto text-slate-400 mb-4" size={48} />
                        <p className="text-slate-600">No competitors found in this category.</p>
                        <p className="text-sm text-slate-500 mt-2">Add competitors to see detailed analysis.</p>
                      </div>
                    );
                  }

                  return relevantCompetitors.map((competitor: Competitor, index: number) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-slate-900">{competitor.brand} - {competitor.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          competitor.threat_level === 'critical' ? 'bg-red-100 text-red-700' :
                          competitor.threat_level === 'high' ? 'bg-orange-100 text-orange-700' :
                          competitor.threat_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {competitor.threat_level.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-slate-600">Price:</span>
                          <span className="ml-2 font-medium">{competitor.price ? formatCurrency(competitor.price) : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Market Share:</span>
                          <span className="ml-2 font-medium">{competitor.market_share ?? 'N/A'}%</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Quality:</span>
                          <span className="ml-2 font-medium">{competitor.product_quality ?? 'N/A'}/10</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Satisfaction:</span>
                          <span className="ml-2 font-medium">{competitor.customer_satisfaction ?? 'N/A'}/10</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Position:</span>
                          <span className="ml-2 font-medium capitalize">{competitor.market_position || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Strategy:</span>
                          <span className="ml-2 font-medium capitalize">{competitor.pricing_strategy || 'Unknown'}</span>
                        </div>
                      </div>
                      {competitor.key_features && competitor.key_features.length > 0 && (
                        <div className="mt-3">
                          <span className="text-slate-600 text-sm">Key Features:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {competitor.key_features.slice(0, 4).map((feature: string, idx: number) => (
                              <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {feature}
                              </span>
                            ))}
                            {competitor.key_features.length > 4 && (
                              <span className="text-xs text-slate-500">+{competitor.key_features.length - 4} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-green-500">
                <ThumbsUp className="text-green-600 mb-2" size={24} />
                <p className="text-sm text-slate-600">Positive Feedback</p>
                <p className="text-3xl font-bold text-green-600">{product.feedback_summary.positive_count}</p>
              </Card>
              <Card className="border-l-4 border-red-500">
                <ThumbsDown className="text-red-600 mb-2" size={24} />
                <p className="text-sm text-slate-600">Negative Feedback</p>
                <p className="text-3xl font-bold text-red-600">{product.feedback_summary.negative_count}</p>
              </Card>
              <Card className="border-l-4 border-blue-500">
                <MessageSquare className="text-blue-600 mb-2" size={24} />
                <p className="text-sm text-slate-600">Total Feedback</p>
                <p className="text-3xl font-bold text-blue-600">{product.feedback_summary.positive_count + product.feedback_summary.negative_count}</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ThumbsUp className="text-green-600" size={20} />
                  Top Praise
                </h3>
                <p className="text-slate-600">{product.feedback_summary.top_praise}</p>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ThumbsDown className="text-red-600" size={20} />
                  Top Complaint
                </h3>
                <p className="text-slate-600">{product.feedback_summary.top_complaint}</p>
              </Card>
            </div>
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
                {product.ai_recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <Sparkles className="text-purple-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-purple-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">AI Performance Score</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${product.ai_score}%` }}
                  ></div>
                </div>
                <span className="text-2xl font-bold text-slate-900">{product.ai_score}/100</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const getPositionGradient = (position: string) => {
  switch (position) {
    case 'leader': return 'from-green-600 to-emerald-600';
    case 'growing': return 'from-blue-600 to-cyan-600';
    case 'stable': return 'from-slate-600 to-slate-700';
    default: return 'from-red-600 to-orange-600';
  }
};