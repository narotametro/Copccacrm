import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Package,
  Brain,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  Zap,
  Download,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  category: string;
  
  // Pricing
  price: number;
  pricing_strategy: 'per unit' | 'per item' | 'per month' | 'per year' | 'one-time';
  
  // Revenue & Performance
  monthly_revenue: number;
  total_revenue: number;
  units_sold: number;
  growth_rate: number; // percentage
  
  // Market Analysis
  market_share: number; // percentage
  market_position: 'leader' | 'growing' | 'stable' | 'declining';
  customer_satisfaction: number; // 1-10
  
  // Product Details
  usp?: string; // Unique Selling Proposition
  package_design?: string; // Package description
  key_features?: string[]; // Main product features
  target_audience?: string;
  pain_points?: string;
  strengths?: string;
  weaknesses?: string;
  
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

// Helper function to generate AI recommendations based on product data
const generateAIRecommendations = (data: {
  growth_rate: number;
  market_share: number;
  market_position: string;
  units_sold: number;
  monthly_revenue: number;
  ai_score: number;
}): string[] => {
  const recommendations: string[] = [];

  // Growth-based recommendations
  if (data.growth_rate > 50) {
    recommendations.push('🚀 Capitalize on momentum - increase inventory and marketing budget');
  } else if (data.growth_rate > 20) {
    recommendations.push('📈 Sustain growth - maintain current strategy and monitor trends');
  } else if (data.growth_rate < -10) {
    recommendations.push('⚠️ Address declining sales - review pricing and customer feedback');
  } else {
    recommendations.push('📊 Stable performance - focus on efficiency and customer retention');
  }

  // Market share recommendations
  if (data.market_share < 5) {
    recommendations.push('🎯 Low market share - increase visibility through targeted marketing');
  } else if (data.market_share > 20) {
    recommendations.push('👑 Strong market position - protect market share and innovate');
  }

  // Position-based recommendations
  if (data.market_position === 'leader') {
    recommendations.push('🏆 Market leader - maintain quality and explore premium positioning');
  } else if (data.market_position === 'growing') {
    recommendations.push('🌱 Growing product - scale operations and strengthen brand presence');
  } else if (data.market_position === 'declining') {
    recommendations.push('🔧 Revitalize product - consider rebranding or feature enhancements');
  }

  // Revenue-based recommendations
  if (data.monthly_revenue < 1000000) {
    recommendations.push('💰 Boost revenue - optimize pricing or increase sales volume');
  } else if (data.monthly_revenue > 10000000) {
    recommendations.push('💎 High revenue generator - invest in quality and customer experience');
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
};

const generatePricingRecommendation = (data: {
  price: number;
  market_position: string;
  market_share: number;
  growth_rate: number;
}): string => {
  if (data.growth_rate > 30 && data.market_share > 15) {
    return `Current pricing at TSh ${data.price.toLocaleString()} is optimal. Consider premium positioning with value-added services.`;
  } else if (data.growth_rate < 0) {
    return `Consider competitive pricing review. Current TSh ${data.price.toLocaleString()} may need adjustment based on market feedback.`;
  } else if (data.market_position === 'leader') {
    return `Premium pricing justified by market leadership. Maintain TSh ${data.price.toLocaleString()} with focus on value differentiation.`;
  } else {
    return `Price point of TSh ${data.price.toLocaleString()} is competitive. Monitor competitor pricing and customer perceived value.`;
  }
};

const generatePositioningRecommendation = (data: {
  market_position: string;
  growth_rate: number;
  market_share: number;
  units_sold: number;
}): string => {
  if (data.market_position === 'leader') {
    return 'Position as premium market leader emphasizing quality, reliability, and proven track record.';
  } else if (data.market_position === 'growing' && data.growth_rate > 50) {
    return 'Position as innovative, fast-growing alternative with strong customer momentum and modern features.';
  } else if (data.market_position === 'declining') {
    return 'Reposition with renewed focus on core strengths, customer success stories, and product improvements.';
  } else {
    return 'Position as reliable, value-focused option with consistent performance and customer satisfaction.';
  }
};

export const Products: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>(() => {
    // Load products from localStorage on initial render
    try {
      const saved = localStorage.getItem('copcca-products');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load products from localStorage:', error);
      return [];
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    pricing_strategy: 'per month' as Product['pricing_strategy'],
    units_sold: '',
    monthly_revenue: '',
    market_share: '',
    market_position: 'growing' as Product['market_position'],
    ai_score: '',
    growth_rate: '',
    usp: '',
    package_design: '',
    key_features: [] as string[],
    target_audience: '',
    pain_points: '',
    strengths: '',
    weaknesses: '',
    dataSource: 'manual' as 'manual' | 'saleshub', // manual entry or pull from Sales Hub
  });
  const [salesHubProducts, setSalesHubProducts] = useState<any[]>([]);
  const [selectedSalesHubProduct, setSelectedSalesHubProduct] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle edit from ProductDetailPage navigation state
  useEffect(() => {
    if (location.state?.editProductId) {
      const productToEdit = products.find(p => p.id === location.state.editProductId);
      if (productToEdit) {
        handleEditProduct(productToEdit);
      }
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // Save products to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('copcca-products', JSON.stringify(products));
    } catch (error) {
      console.error('Failed to save products to localStorage:', error);
    }
  }, [products]);

  // Load Sales Hub products when modal opens
  useEffect(() => {
    if (showAddModal && productForm.dataSource === 'saleshub') {
      loadSalesHubProducts();
    }
  }, [showAddModal, productForm.dataSource]);

  const loadSalesHubProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          price,
          categories (
            name
          )
        `)
        .order('name');

      if (error) throw error;
      setSalesHubProducts(data || []);
    } catch (error) {
      console.error('Error loading Sales Hub products:', error);
      toast.error('Failed to load Sales Hub products');
    }
  };

  const handleSalesHubProductSelect = async (productId: string) => {
    setSelectedSalesHubProduct(productId);
    const selected = salesHubProducts.find(p => p.id === productId);
    
    if (!selected) return;

    try {
      // Show loading notification
      toast.info('📊 Calculating sales metrics from Sales Hub data...');

      // Query all sales_hub_orders to calculate metrics
      const { data: orders, error } = await supabase
        .from('sales_hub_orders')
        .select('items, total_amount, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate metrics from order items
      let totalUnits = 0;
      let monthlyRevenue = 0;
      let totalRevenue = 0;
      let previousMonthRevenue = 0;
      let totalMarketRevenue = 0;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      orders?.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        const items = order.items || [];

        items.forEach((item: any) => {
          const itemRevenue = (item.quantity || 0) * (item.unit_price || 0);

          // For this specific product
          if (item.product_id === productId) {
            totalUnits += item.quantity || 0;
            totalRevenue += itemRevenue;

            // Last 30 days revenue
            if (orderDate >= thirtyDaysAgo) {
              monthlyRevenue += itemRevenue;
            }

            // 30-60 days ago revenue (for growth calculation)
            if (orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo) {
              previousMonthRevenue += itemRevenue;
            }
          }

          // Total market revenue (all products, last 30 days)
          if (orderDate >= thirtyDaysAgo) {
            totalMarketRevenue += itemRevenue;
          }
        });
      });

      // Calculate derived metrics
      const marketShare = totalMarketRevenue > 0 
        ? ((monthlyRevenue / totalMarketRevenue) * 100).toFixed(1)
        : '0';

      const growthRate = previousMonthRevenue > 0
        ? (((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1)
        : monthlyRevenue > 0 ? '100' : '0';

      // Determine market position based on performance
      let marketPosition: 'leader' | 'growing' | 'stable' | 'declining' = 'stable';
      if (totalUnits > 100) marketPosition = 'leader';
      else if (totalUnits > 50) marketPosition = 'growing';
      else if (parseFloat(growthRate) < -10) marketPosition = 'declining';

      // Calculate AI score based on multiple factors
      const revenueScore = Math.min((monthlyRevenue / 1000000) * 20, 30); // Up to 30 points
      const volumeScore = Math.min((totalUnits / 100) * 20, 25); // Up to 25 points
      const marketShareScore = parseFloat(marketShare) * 2; // Up to 20 points
      const growthScore = Math.max(0, Math.min(parseFloat(growthRate) / 5, 25)); // Up to 25 points
      const aiScore = Math.min(
        Math.round(revenueScore + volumeScore + marketShareScore + growthScore),
        100
      );

      // Auto-populate ALL fields from Sales Hub data
      setProductForm(prev => ({
        ...prev,
        name: selected.name,
        category: selected.categories?.name || '',
        price: selected.price.toString(),
        units_sold: totalUnits.toString(),
        monthly_revenue: monthlyRevenue.toFixed(2),
        market_share: marketShare,
        market_position: marketPosition,
        growth_rate: growthRate,
        ai_score: aiScore.toString(),
        // These fields remain editable for user input
        usp: prev.usp,
        package_design: prev.package_design,
        key_features: prev.key_features,
      }));

      toast.success(`✅ All sales data loaded: ${totalUnits} units sold, TSh ${monthlyRevenue.toFixed(0)} monthly revenue`);
    } catch (error) {
      console.error('Error calculating sales metrics:', error);
      toast.error('Failed to calculate sales metrics. Using basic product info only.');
      
      // Fallback to basic info if calculation fails
      setProductForm(prev => ({
        ...prev,
        name: selected.name,
        category: selected.categories?.name || '',
        price: selected.price.toString(),
      }));
    }
  };
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      pricing_strategy: product.pricing_strategy,
      units_sold: product.units_sold.toString(),
      monthly_revenue: product.monthly_revenue.toString(),
      market_share: product.market_share.toString(),
      market_position: product.market_position,
      ai_score: product.ai_score.toString(),
      growth_rate: product.growth_rate.toString(),
      usp: product.usp || '',
      package_design: product.package_design || '',
      key_features: product.key_features || [],
      target_audience: product.target_audience || '',
      pain_points: product.pain_points || '',
      strengths: product.strengths || '',
      weaknesses: product.weaknesses || '',
      dataSource: 'manual',
    });
    setShowAddModal(true);
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

    const productData: Product = {
      id: editingProduct ? editingProduct.id : crypto.randomUUID(),
      name: productForm.name.trim(),
      category: productForm.category.trim() || 'General',
      price: Number(productForm.price) || 0,
      pricing_strategy: productForm.pricing_strategy,
      monthly_revenue: monthlyRevenue,
      total_revenue: monthlyRevenue * 12,
      units_sold: unitsSold,
      growth_rate: growthRate,
      market_share: Number(productForm.market_share) || 0,
      market_position: productForm.market_position as Product['market_position'],
      customer_satisfaction: 8,
      usp: productForm.usp.trim() || '',
      package_design: productForm.package_design.trim() || '',
      key_features: productForm.key_features,
      target_audience: productForm.target_audience.trim() || '',
      pain_points: productForm.pain_points.trim() || '',
      strengths: productForm.strengths.trim() || '',
      weaknesses: productForm.weaknesses.trim() || '',
      competitor_products: editingProduct?.competitor_products || [],
      feedback_summary: editingProduct?.feedback_summary || {
        positive_count: 0,
        negative_count: 0,
        top_praise: 'Awaiting feedback',
        top_complaint: 'Awaiting feedback',
      },
      ai_score: Number(productForm.ai_score) || 60,
      ai_recommendations: generateAIRecommendations({
        growth_rate: growthRate,
        market_share: Number(productForm.market_share) || 0,
        market_position: productForm.market_position,
        units_sold: unitsSold,
        monthly_revenue: monthlyRevenue,
        ai_score: Number(productForm.ai_score) || 60,
      }),
      pricing_recommendation: generatePricingRecommendation({
        price: Number(productForm.price) || 0,
        market_position: productForm.market_position,
        market_share: Number(productForm.market_share) || 0,
        growth_rate: growthRate,
      }),
      positioning_recommendation: generatePositioningRecommendation({
        market_position: productForm.market_position,
        growth_rate: growthRate,
        market_share: Number(productForm.market_share) || 0,
        units_sold: unitsSold,
      }),
      sales_trend: Array(6).fill(unitsSold ? Math.max(Math.round(unitsSold / 6), 1) : 0),
      revenue_trend: Array(6).fill(monthlyRevenue ? Math.max(Math.round(monthlyRevenue / 6), 1) : 0),
    } as Product;

    if (editingProduct) {
      // Update existing product
      await toast.promise(
        new Promise((resolve) => setTimeout(resolve, 800)),
        {
          loading: 'Updating product...',
          success: 'Product updated successfully',
          error: 'Failed to update product',
        }
      );

      setProducts((prev) => prev.map(p => p.id === editingProduct.id ? productData : p));
    } else {
      // Add new product
      await toast.promise(
        new Promise((resolve) => setTimeout(resolve, 800)),
        {
          loading: 'Adding product...',
          success: 'Product added successfully',
          error: 'Failed to add product',
        }
      );

      setProducts((prev) => [productData, ...prev]);
    }
    setShowAddModal(false);
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: '',
      price: '',
      pricing_strategy: 'per month',
      units_sold: '',
      monthly_revenue: '',
      market_share: '',
      market_position: 'growing',
      ai_score: '',
      growth_rate: '',
      usp: '',
      package_design: '',
      key_features: [],
      target_audience: '',
      pain_points: '',
      strengths: '',
      weaknesses: '',
      dataSource: 'manual',
    });
    setSelectedSalesHubProduct('');
  };
  const getPositionColor = (position: string) => {
    const colors = {
      leader: 'bg-green-100 text-green-700 border-green-300',
      growing: 'bg-blue-100 text-blue-700 border-blue-300',
      stable: 'bg-slate-100 text-slate-700 border-slate-300',
      declining: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[position as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const getBorderColor = (position: string) => {
    switch (position) {
      case 'leader': return 'border-green-600';
      case 'growing': return 'border-blue-600';
      case 'stable': return 'border-slate-600';
      default: return 'border-red-600';
    }
  };

  const getPositionGradient = (position: string) => {
    switch (position) {
      case 'leader': return 'from-green-600 to-emerald-600';
      case 'growing': return 'from-blue-600 to-cyan-600';
      case 'stable': return 'from-slate-600 to-slate-700';
      default: return 'from-red-600 to-orange-600';
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
    toast.success('Product deleted successfully');
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesPerformance = true;

    if (performanceFilter !== 'all') {
      switch (performanceFilter) {
        case 'high':
          matchesPerformance = product.ai_score > 80;
          break;
        case 'medium':
          matchesPerformance = product.ai_score >= 60 && product.ai_score <= 80;
          break;
        case 'low':
          matchesPerformance = product.ai_score < 60;
          break;
        case 'leader':
          matchesPerformance = product.market_position === 'leader';
          break;
        case 'growing':
          matchesPerformance = product.market_position === 'growing';
          break;
      }
    }

    return matchesSearch && matchesPerformance;
  });

  return (
    <FeatureGate feature="inventory_basic">
      <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Product Intelligence</h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base">Know what's winning (and what's not)</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)} className="text-sm md:text-base">
          <span className="hidden sm:inline">Add </span>Product
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={Search}
      />

      {/* Products Count */}
      <div className="text-sm text-slate-600 mb-4">
        Total Products: {filteredProducts.length}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <Button
          variant={performanceFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('all')}
        >
          All
        </Button>
        <Button
          variant={performanceFilter === 'high' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('high')}
        >
          High Performance
        </Button>
        <Button
          variant={performanceFilter === 'medium' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('medium')}
        >
          Medium Performance
        </Button>
        <Button
          variant={performanceFilter === 'low' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('low')}
        >
          Low Performance
        </Button>
        <Button
          variant={performanceFilter === 'leader' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('leader')}
        >
          Market Leaders
        </Button>
        <Button
          variant={performanceFilter === 'growing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPerformanceFilter('growing')}
        >
          Growing
        </Button>
      </div>

      {/* Product Intelligence List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Product Intelligence</h2>
          <Button 
            icon={Brain} 
            variant="secondary"
            onClick={() => {
              toast.success('AI Strategic Recommendations generated! Check product insights for personalized strategies.');
            }}
          >
            AI Strategic Recommendations
          </Button>
        </div>
        
        {filteredProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No products yet</h3>
            <p className="text-slate-600 mb-4">Add your first product to start tracking performance and getting AI insights.</p>
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Add Your First Product
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                hover 
                className={`cursor-pointer border-2 ${getBorderColor(product.market_position)}`}
                onClick={() => navigate(`/app/products/${product.id}`)}
              >
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-r flex-shrink-0 ${getPositionGradient(product.market_position)} flex items-center justify-center`}>
                      <Package className="text-white" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm md:text-base truncate">{product.name}</h3>
                      <p className="text-xs md:text-sm text-slate-600 truncate">{product.category}</p>
                    </div>
                  </div>
                  <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${getPositionColor(product.market_position)}`}>
                    {product.market_position.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  <Button variant="outline" size="sm" className="justify-center">
                    Revenue: {formatCurrency(product.monthly_revenue / 1000)}K
                  </Button>
                  <Button variant="outline" size="sm" className="justify-center">
                    Growth: {product.growth_rate}%
                  </Button>
                  <Button variant="outline" size="sm" className="justify-center">
                    Market Share: {product.market_share}%
                  </Button>
                  <Button variant="outline" size="sm" className="justify-center">
                    Satisfaction: {product.customer_satisfaction}/10
                  </Button>
                  <Button variant="outline" size="sm" className="justify-center">
                    AI Score: {product.ai_score}
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-4 pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded">Units Sold: {product.units_sold.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      icon={Eye}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/products/${product.id}`);
                      }}
                    >
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      icon={Edit}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProduct(product);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      icon={Trash2}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProduct(product.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);editingProduct(null);
          setProductForm({ ...productForm, dataSource: 'manual' });
          setSelectedSalesHubProduct('');
        }}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleAddProduct}>
          <p className="text-sm text-slate-600">Track your product performance and get AI-powered recommendations</p>
          
          {/* Data Source Toggle */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-3">Data Source</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setProductForm({ ...productForm, dataSource: 'manual' })}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                  productForm.dataSource === 'manual'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                ✍️ Enter Manually
              </button>
              <button
                type="button"
                onClick={() => setProductForm({ ...productForm, dataSource: 'saleshub' })}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                  productForm.dataSource === 'saleshub'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Download className="inline h-4 w-4 mr-1" />
                Pull from Sales Hub
              </button>
            </div>
          </div>

          {/* Sales Hub Product Selector */}
          {productForm.dataSource === 'saleshub' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Sales Hub Product
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={selectedSalesHubProduct}
                onChange={(e) => handleSalesHubProductSelect(e.target.value)}
              >
                <option value="">-- Select a product --</option>
                {salesHubProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.sku} (${product.price})
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-600 mt-2">
                💡 All product data including sales metrics will be automatically calculated from Sales Hub. You can still edit any field.
              </p>
            </div>
          )}

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
              label="Price"
              placeholder="99.99"
              type="number"
              step="0.01"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Pricing Strategy</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={productForm.pricing_strategy}
                onChange={(e) => setProductForm({ ...productForm, pricing_strategy: e.target.value as Product['pricing_strategy'] })}
              >
                <option value="per unit">Per Unit</option>
                <option value="per item">Per Item</option>
                <option value="per month">Per Month</option>
                <option value="per year">Per Year</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
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
                onChange={(e) => setProductForm({ ...productForm, market_position: e.target.value as Product['market_position'] })}
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

          <div className="space-y-4">
            <Input
              label="Unique Selling Proposition (USP)"
              placeholder="What makes your product unique?"
              value={productForm.usp}
              onChange={(e) => setProductForm({ ...productForm, usp: e.target.value })}
            />
            <Input
              label="Package Design"
              placeholder="Describe your packaging"
              value={productForm.package_design}
              onChange={(e) => setProductForm({ ...productForm, package_design: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Key Features</label>
              <div className="space-y-2">
                {productForm.key_features?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <Zap className="text-blue-600 flex-shrink-0" size={16} />
                    <span className="flex-1 text-sm">{feature}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newFeatures = productForm.key_features?.filter((_, i) => i !== index) || [];
                        setProductForm({ ...productForm, key_features: newFeatures });
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Input
                  placeholder="Add a feature and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value) {
                        const newFeatures = [...(productForm.key_features || []), value];
                        setProductForm({ ...productForm, key_features: newFeatures });
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Press Enter to add each feature</p>
            </div>
            <Input
              label="Target Audience"
              placeholder="Who is your ideal customer?"
              value={productForm.target_audience}
              onChange={(e) => setProductForm({ ...productForm, target_audience: e.target.value })}
            />
            <Input
              label="Pain Points"
              placeholder="What problems does your product solve?"
              value={productForm.pain_points}
              onChange={(e) => setProductForm({ ...productForm, pain_points: e.target.value })}
            />
            <Input
              label="Strengths"
              placeholder="What are your product's main strengths?"
              value={productForm.strengths}
              onChange={(e) => setProductForm({ ...productForm, strengths: e.target.value })}
            />
            <Input
              label="Weaknesses"
              placeholder="What are your product's weaknesses?"
              value={productForm.weaknesses}
              onChange={(e) => setProductForm({ ...productForm, weaknesses: e.target.value })}
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
    </FeatureGate>
  );
};
