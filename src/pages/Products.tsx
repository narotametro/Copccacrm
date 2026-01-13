import React, { useState } from 'react';
import {
  Package,
  TrendingUp,
  TrendingDown,
  Banknote,
  Target,
  Star,
  Brain,
  Zap,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Award,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  
  // Revenue & Performance
  monthly_revenue: number;
  total_revenue: number;
  units_sold: number;
  growth_rate: number; // percentage
  
  // Market Analysis
  market_share: number; // percentage
  market_position: 'leader' | 'growing' | 'stable' | 'declining';
  customer_satisfaction: number; // 1-10
  
  // Competitive Analysis
  competitor_products: {
    name: string;
    competitor: string;
    price: number;
    quality: number;
    advantage: string;
  }[];
  
  // Customer Feedback
  feedback_summary: {
    positive_count: number;
    negative_count: number;
    top_praise: string;
    top_complaint: string;
  };
  
  // AI Insights
  ai_score: number; // 0-100
  ai_recommendations: string[];
  pricing_recommendation: string;
  positioning_recommendation: string;
  
  // Trends (last 6 months)
  sales_trend: number[];
  revenue_trend: number[];
}

const demoProducts: Product[] = [];

export const Products: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'competitive' | 'feedback' | 'ai-insights'>('overview');
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    units_sold: '',
    monthly_revenue: '',
    market_share: '',
    market_position: 'growing',
    ai_score: '',
    growth_rate: '',
  });

  const getPositionColor = (position: string) => {
    const colors = {
      leader: 'bg-green-100 text-green-700 border-green-300',
      growing: 'bg-blue-100 text-blue-700 border-blue-300',
      stable: 'bg-slate-100 text-slate-700 border-slate-300',
      declining: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[position as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const getPositionIcon = (position: string) => {
    if (position === 'leader') return <Award className="text-green-600" size={20} />;
    if (position === 'growing') return <TrendingUp className="text-blue-600" size={20} />;
    if (position === 'stable') return <Target className="text-slate-600" size={20} />;
    return <TrendingDown className="text-red-600" size={20} />;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    const monthlyRevenue = Number(productForm.monthly_revenue) || 0;
    const unitsSold = Number(productForm.units_sold) || 0;
    const growthRate = Number(productForm.growth_rate) || 0;

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: productForm.name.trim(),
      category: productForm.category.trim() || 'General',
      price: Number(productForm.price) || 0,
      monthly_revenue: monthlyRevenue,
      total_revenue: monthlyRevenue * 12,
      units_sold: unitsSold,
      growth_rate: growthRate,
      market_share: Number(productForm.market_share) || 0,
      market_position: productForm.market_position as Product['market_position'],
      customer_satisfaction: 8,
      competitor_products: [],
      feedback_summary: {
        positive_count: 0,
        negative_count: 0,
        top_praise: 'Awaiting feedback',
        top_complaint: 'Awaiting feedback',
      },
      ai_score: Number(productForm.ai_score) || 60,
      ai_recommendations: ['Start tracking usage and feedback'],
      pricing_recommendation: 'Price review pending (demo)',
      positioning_recommendation: 'Positioning will be generated after data intake',
      sales_trend: Array(6).fill(unitsSold ? Math.max(Math.round(unitsSold / 6), 1) : 0),
      revenue_trend: Array(6).fill(monthlyRevenue ? Math.max(Math.round(monthlyRevenue / 6), 1) : 0),
    } as Product;

    await toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Adding product...',
        success: 'Product added (demo only)',
        error: 'Failed to add product',
      }
    );

    setProducts((prev) => [newProduct, ...prev]);
    setShowAddModal(false);
    setProductForm({
      name: '',
      category: '',
      price: '',
      units_sold: '',
      monthly_revenue: '',
      market_share: '',
      market_position: 'growing',
      ai_score: '',
      growth_rate: '',
    });
  };

  const totalRevenue = products.reduce((sum, p) => sum + p.monthly_revenue, 0);
  const avgGrowth = Math.round(products.reduce((sum, p) => sum + p.growth_rate, 0) / products.length);
  const avgSatisfaction = (products.reduce((sum, p) => sum + p.customer_satisfaction, 0) / products.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📦 Product Intelligence</h1>
          <p className="text-slate-600 mt-1">Know what's winning (and what's not)</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>Add Product</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-green-500">
          <Banknote className="text-green-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Monthly Revenue</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue / 1000)}<span className="text-base ml-0.5">K</span></p>
        </Card>
        <Card className="border-l-4 border-blue-500">
          <TrendingUp className="text-blue-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Avg Growth Rate</p>
          <p className="text-3xl font-bold text-blue-600">{avgGrowth}%</p>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <Star className="text-purple-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Avg Satisfaction</p>
          <p className="text-3xl font-bold text-purple-600">{avgSatisfaction}/10</p>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <Package className="text-orange-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Products</p>
          <p className="text-3xl font-bold text-orange-600">{products.length}</p>
        </Card>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {products.map((product) => (
          <div key={product.id} onClick={() => setSelectedProduct(product)}>
            <Card hover className="cursor-pointer">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center">
                  <Package className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                  <p className="text-sm text-slate-600">{product.category}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getPositionColor(product.market_position)}`}>
                {getPositionIcon(product.market_position)}
                {product.market_position.toUpperCase()}
              </span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
              <div>
                <p className="text-xs text-slate-600 mb-1">Revenue/Month</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(product.monthly_revenue / 1000)}<span className="text-xs ml-0.5">K</span></p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Growth Rate</p>
                <p className={`text-lg font-bold ${
                  product.growth_rate > 30 ? 'text-green-600' :
                  product.growth_rate > 15 ? 'text-blue-600' :
                  'text-slate-600'
                }`}>
                  +{product.growth_rate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">AI Score</p>
                <p className={`text-lg font-bold ${
                  product.ai_score > 85 ? 'text-green-600' :
                  product.ai_score > 70 ? 'text-blue-600' :
                  'text-orange-600'
                }`}>
                  {product.ai_score}/100
                </p>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Customer Satisfaction</span>
                  <span className="text-sm font-bold text-slate-900">{product.customer_satisfaction}/10</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      product.customer_satisfaction > 8 ? 'bg-green-500' :
                      product.customer_satisfaction > 6 ? 'bg-blue-500' :
                      'bg-orange-500'
                    }`}
                    style={{ width: `${product.customer_satisfaction * 10}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Market Share</span>
                  <span className="text-sm font-bold text-slate-900">{product.market_share}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${product.market_share}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Top AI Recommendation */}
            <div className="p-3 bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-lg mb-4">
              <div className="flex items-start gap-2">
                <Brain className="text-primary-600 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-xs font-bold text-primary-900 mb-1">🔥 Top AI Insight:</p>
                  <p className="text-sm text-primary-800">{product.ai_recommendations[0]}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                icon={Eye}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(product);
                }}
              >
                View Details
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(product);
                  setActiveTab('ai-insights');
                }}
              >
                Analyze
              </Button>
            </div>
          </Card>
          </div>
        ))}
      </div>

      {/* Detailed Product Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => {
            setSelectedProduct(null);
            setActiveTab('overview');
          }}
          title={selectedProduct.name}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Package className="text-white" size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-slate-900">{selectedProduct.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getPositionColor(selectedProduct.market_position)}`}>
                      {getPositionIcon(selectedProduct.market_position)}
                      {selectedProduct.market_position.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-600">{selectedProduct.category} • ${selectedProduct.price}/month</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
              <div className="flex gap-6">
                {(['overview', 'competitive', 'feedback', 'ai-insights'] as const).map((tab) => (
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
                    {tab === 'competitive' && '⚔️ Competition'}
                    {tab === 'feedback' && '💬 Feedback'}
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
                  {/* Revenue & Performance */}
                  <Card className="border-l-4 border-green-500">
                    <h3 className="font-bold text-slate-900 mb-4">💰 Revenue & Performance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedProduct.monthly_revenue / 1000)}<span className="text-sm ml-0.5">K</span></p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedProduct.total_revenue / 1000)}<span className="text-sm ml-0.5">K</span></p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Units Sold</p>
                        <p className="text-2xl font-bold text-primary-600">{selectedProduct.units_sold.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Growth Rate</p>
                        <p className={`text-2xl font-bold ${
                          selectedProduct.growth_rate > 30 ? 'text-green-600' :
                          selectedProduct.growth_rate > 15 ? 'text-blue-600' :
                          'text-slate-600'
                        }`}>
                          +{selectedProduct.growth_rate}%
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Sales Trend Chart */}
                  <Card className="border-l-4 border-blue-500">
                    <h3 className="font-bold text-slate-900 mb-4">📈 Sales Trend (Last 6 Months)</h3>
                    <div className="flex items-end justify-between gap-2 h-40">
                      {selectedProduct.sales_trend.map((value, index) => {
                        const maxValue = Math.max(...selectedProduct.sales_trend);
                        const height = (value / maxValue) * 100;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="relative w-full">
                              <div
                                className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all hover:from-primary-700 hover:to-primary-500"
                                style={{ height: `${height}%`, minHeight: '40px' }}
                              >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-900">
                                  {value}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-slate-600">M{index + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Market Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <h3 className="font-bold text-slate-900 mb-3">🎯 Market Position</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-600">Market Share</span>
                            <span className="font-bold">{selectedProduct.market_share}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                              className="bg-primary-600 h-3 rounded-full"
                              style={{ width: `${selectedProduct.market_share}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-600">Customer Satisfaction</span>
                            <span className="font-bold">{selectedProduct.customer_satisfaction}/10</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                              className="bg-green-500 h-3 rounded-full"
                              style={{ width: `${selectedProduct.customer_satisfaction * 10}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <h3 className="font-bold text-slate-900 mb-3">⭐ AI Product Score</h3>
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="#e2e8f0"
                              strokeWidth="8"
                              fill="none"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke={selectedProduct.ai_score > 85 ? '#10b981' : selectedProduct.ai_score > 70 ? '#3b82f6' : '#f59e0b'}
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${selectedProduct.ai_score * 2.51} 251`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-900">{selectedProduct.ai_score}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-2">AI Performance Rating</p>
                          <p className={`text-lg font-bold ${
                            selectedProduct.ai_score > 85 ? 'text-green-600' :
                            selectedProduct.ai_score > 70 ? 'text-blue-600' :
                            'text-orange-600'
                          }`}>
                            {selectedProduct.ai_score > 85 ? '🔥 Excellent' :
                             selectedProduct.ai_score > 70 ? '👍 Good' :
                             '⚠️ Needs Attention'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* COMPETITIVE TAB */}
              {activeTab === 'competitive' && (
                <div className="space-y-6">
                  <Card className="border-2 border-primary-200">
                    <h3 className="font-bold text-slate-900 mb-4">⚔️ Competitive Comparison</h3>
                    <div className="space-y-4">
                      {selectedProduct.competitor_products.map((comp, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-slate-900">{comp.name}</h4>
                              <p className="text-sm text-slate-600">{comp.competitor}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-slate-900">${comp.price}</p>
                              <p className="text-xs text-slate-600">Quality: {comp.quality}/10</p>
                            </div>
                          </div>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-xs font-bold text-green-900 mb-1">✅ Your Advantage:</p>
                            <p className="text-sm text-green-800">{comp.advantage}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="border-l-4 border-green-500">
                    <h3 className="font-bold text-green-700 mb-4">💪 Why You Win</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-green-800">
                        <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                        <span>Better price-to-value ratio than all competitors</span>
                      </li>
                      <li className="flex items-start gap-2 text-green-800">
                        <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                        <span>AI-native features that competitors lack</span>
                      </li>
                      <li className="flex items-start gap-2 text-green-800">
                        <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                        <span>Focused on African market needs</span>
                      </li>
                      <li className="flex items-start gap-2 text-green-800">
                        <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                        <span>Superior customer satisfaction</span>
                      </li>
                    </ul>
                  </Card>
                </div>
              )}

              {/* FEEDBACK TAB */}
              {activeTab === 'feedback' && (
                <div className="space-y-6">
                  {/* Feedback Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-green-500">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <ThumbsUp className="text-green-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Positive Feedback</p>
                          <p className="text-2xl font-bold text-green-600">{selectedProduct.feedback_summary.positive_count}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-bold text-green-900 mb-1">🔥 Top Praise:</p>
                        <p className="text-sm text-green-800">{selectedProduct.feedback_summary.top_praise}</p>
                      </div>
                    </Card>

                    <Card className="border-l-4 border-red-500">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <ThumbsDown className="text-red-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Negative Feedback</p>
                          <p className="text-2xl font-bold text-red-600">{selectedProduct.feedback_summary.negative_count}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-bold text-red-900 mb-1">⚠️ Top Complaint:</p>
                        <p className="text-sm text-red-800">{selectedProduct.feedback_summary.top_complaint}</p>
                      </div>
                    </Card>
                  </div>

                  {/* Sentiment Ratio */}
                  <Card>
                    <h3 className="font-bold text-slate-900 mb-4">📊 Sentiment Ratio</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-20">Positive</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-6">
                          <div
                            className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-3"
                            style={{
                              width: `${(selectedProduct.feedback_summary.positive_count / (selectedProduct.feedback_summary.positive_count + selectedProduct.feedback_summary.negative_count)) * 100}%`
                            }}
                          >
                            <span className="text-xs font-bold text-white">
                              {Math.round((selectedProduct.feedback_summary.positive_count / (selectedProduct.feedback_summary.positive_count + selectedProduct.feedback_summary.negative_count)) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-20">Negative</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-6">
                          <div
                            className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-3"
                            style={{
                              width: `${(selectedProduct.feedback_summary.negative_count / (selectedProduct.feedback_summary.positive_count + selectedProduct.feedback_summary.negative_count)) * 100}%`
                            }}
                          >
                            <span className="text-xs font-bold text-white">
                              {Math.round((selectedProduct.feedback_summary.negative_count / (selectedProduct.feedback_summary.positive_count + selectedProduct.feedback_summary.negative_count)) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Action Items */}
                  <Card className="bg-gradient-to-br from-blue-50 to-primary-50 border-2 border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-3">🎯 Action Items from Feedback</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-blue-800">
                        <Sparkles className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                        <span>Double down on what customers love most</span>
                      </li>
                      <li className="flex items-start gap-2 text-blue-800">
                        <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={18} />
                        <span>Address top complaint immediately to reduce churn</span>
                      </li>
                      <li className="flex items-start gap-2 text-blue-800">
                        <MessageSquare className="text-primary-600 flex-shrink-0 mt-0.5" size={18} />
                        <span>Use positive feedback in marketing materials</span>
                      </li>
                    </ul>
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
                        <h3 className="font-bold text-slate-900 text-lg">🧠 AI Strategic Recommendations</h3>
                        <p className="text-sm text-slate-600">Data-driven insights for maximum growth</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedProduct.ai_recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border-l-4 border-primary-500 hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 mb-2">{rec}</p>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                icon={Zap} 
                                onClick={() => {
                                  toast.promise(
                                    new Promise(resolve => setTimeout(resolve, 1500)),
                                    {
                                      loading: 'Executing recommendation...',
                                      success: 'Recommendation executed! Check your tasks.',
                                      error: 'Failed to execute recommendation',
                                    }
                                  );
                                }}
                              >
                                Execute
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={() => {
                                  toast.success('Added to product roadmap');
                                }}
                              >
                                Add to Roadmap
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Pricing Recommendation */}
                  <Card className="border-l-4 border-green-500">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Banknote className="text-green-600" size={20} />
                      💰 Pricing Recommendation
                    </h3>
                    <p className="text-slate-800 mb-4">{selectedProduct.pricing_recommendation}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => {
                          toast.promise(
                            new Promise(resolve => setTimeout(resolve, 2000)),
                            {
                              loading: 'Running pricing analysis...',
                              success: 'Analysis complete! View results in Reports.',
                              error: 'Analysis failed',
                            }
                          );
                        }}
                      >
                        Run Pricing Analysis
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => {
                          toast.success('A/B test created successfully', {
                            description: 'Test will run for 14 days',
                            action: {
                              label: 'View Test',
                              onClick: () => console.log('Navigate to A/B test')
                            }
                          });
                        }}
                      >
                        A/B Test Price
                      </Button>
                    </div>
                  </Card>

                  {/* Positioning Recommendation */}
                  <Card className="border-l-4 border-purple-500">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Target className="text-purple-600" size={20} />
                      🎯 Positioning Recommendation
                    </h3>
                    <p className="text-slate-800 mb-4">{selectedProduct.positioning_recommendation}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => {
                          toast.promise(
                            new Promise(resolve => setTimeout(resolve, 1500)),
                            {
                              loading: 'Generating marketing brief...',
                              success: 'Marketing brief created successfully',
                              error: 'Failed to create brief',
                            }
                          );
                        }}
                      >
                        Create Marketing Brief
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => {
                          toast.success('Messaging updated across all channels');
                        }}
                      >
                        Update Messaging
                      </Button>
                    </div>
                  </Card>

                  {/* Quick Win */}
                  <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
                    <div className="flex items-start gap-3">
                      <Sparkles className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
                      <div>
                        <h3 className="font-bold text-yellow-900 mb-2">⚡ Quick Win Opportunity</h3>
                        <p className="text-yellow-800 mb-3">
                          Based on AI analysis, implementing the top recommendation could increase revenue by 15-20% within 60 days.
                        </p>
                        <Button 
                          size="sm" 
                          icon={Zap} 
                          onClick={() => {
                            toast.promise(
                              new Promise(resolve => setTimeout(resolve, 1500)),
                              {
                                loading: 'Creating action plan...',
                                success: 'Action plan created! Added to your tasks.',
                                error: 'Failed to create plan',
                              }
                            );
                          }}
                        >
                          Create Action Plan
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Product"
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleAddProduct}>
          <p className="text-sm text-slate-600">Track your product performance and get AI-powered recommendations</p>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name"
              placeholder="COPCCA Analytics"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            />
            <Input
              label="Category"
              placeholder="Business Intelligence"
              required
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
            />
            <Input
              label="Price ($/month)"
              placeholder="29.99"
              type="number"
              step="0.01"
              required
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            />
            <Input
              label="Units Sold"
              placeholder="1500"
              type="number"
              value={productForm.units_sold}
              onChange={(e) => setProductForm({ ...productForm, units_sold: e.target.value })}
            />
            <Input
              label="Monthly Revenue"
              placeholder="45000"
              type="number"
              value={productForm.monthly_revenue}
              onChange={(e) => setProductForm({ ...productForm, monthly_revenue: e.target.value })}
            />
            <Input
              label="Market Share (%)"
              placeholder="10"
              type="number"
              value={productForm.market_share}
              onChange={(e) => setProductForm({ ...productForm, market_share: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Market Position</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={productForm.market_position}
                onChange={(e) => setProductForm({ ...productForm, market_position: e.target.value })}
              >
                <option value="leader">Leader</option>
                <option value="growing">Growing</option>
                <option value="stable">Stable</option>
                <option value="declining">Declining</option>
              </select>
            </div>
            <Input
              label="Growth Rate (%)"
              placeholder="12"
              type="number"
              value={productForm.growth_rate}
              onChange={(e) => setProductForm({ ...productForm, growth_rate: e.target.value })}
            />
            <Input
              label="AI Score"
              placeholder="75"
              type="number"
              value={productForm.ai_score}
              onChange={(e) => setProductForm({ ...productForm, ai_score: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Product & Start Tracking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
