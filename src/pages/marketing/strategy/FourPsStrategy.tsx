import React, { useState, useEffect } from 'react';
import {
  Package,
  Banknote,
  MapPin,
  Megaphone,
  Save,
  Sparkles,
  AlertTriangle,
  Plus,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  customer_satisfaction: number;
  market_share: number;
  competitor_analysis: string[];
}

interface Customer {
  id: string;
  name: string;
  contactPerson: string | null;
  status: string;
  customer_type: 'lead' | 'active' | 'vip' | 'at-risk';
  health_score: number | null;
  churn_risk: number;
  upsell_potential: number;
  email: string | null;
  phone: string | null;
  website: string | null;
  total_revenue: number;
  purchases: number;
  avg_order_value: number;
  last_purchase: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  sentiment: 'positive' | 'neutral' | 'negative';
  feedback_count: number;
  jtbd: string;
  pain_points: string[];
  feedback_history: {
    id: string;
    date: string;
    type: 'positive' | 'negative' | 'neutral';
    comment: string;
    category: string;
  }[];
  priority_actions: string[];
}

interface Competitor {
  id: string;
  name: string;
  brand: string;
  website: string;
  industry: string;
  competitor_type: string;
  price: number;
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

export const FourPsStrategy: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [activeP, setActiveP] = useState<'product' | 'price' | 'place' | 'promotion'>('product');

  const pColorStyles: Record<
    'blue' | 'green' | 'purple' | 'orange',
    { border: string; bg: string; icon: string; text: string }
  > = {
    blue: { border: 'border-blue-500', bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-700' },
    green: { border: 'border-green-500', bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-700' },
    purple: { border: 'border-purple-500', bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-700' },
    orange: { border: 'border-orange-500', bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-700' },
  };

  const [fourPs, setFourPs] = useState({
    product: {
      items: [] as string[],
      benefits: [] as string[],
      quality: '',
      differentiators: [] as string[],
    },
    price: {
      model: '',
      basePrice: 0,
      discounts: [] as string[],
      sensitivity: '',
      competitorComparison: [] as Array<{ name: string; price: number; position: string }>,
    },
    place: {
      channels: [] as Array<{ name: string; performance: number; active: boolean }>,
      coverage: [] as string[],
    },
    promotion: {
      messages: [] as string[],
      tone: '',
      channels: [] as string[],
      themes: [] as string[],
    },
  });

  // Form states
  const [productForm, setProductForm] = useState({ item: '', benefit: '', differentiator: '' });
  const [priceForm, setPriceForm] = useState({ model: '', basePrice: '', discount: '', compName: '', compPrice: '', compPosition: 'Similar' });
  const [placeForm, setPlaceForm] = useState({ channelName: '', channelPerformance: '50', location: '' });
  const [promotionForm, setPromotionForm] = useState({ message: '', tone: '', channel: '', theme: '' });

  // Real data state
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  // Load data on component mount
  useEffect(() => {
    loadFourPsData();
    loadProducts();
    loadCustomers();
    loadCompetitors();
  }, []);

  // Load 4Ps data from localStorage
  const loadFourPsData = () => {
    try {
      const saved = localStorage.getItem('copcca-4ps-strategy');
      if (saved) {
        const data = JSON.parse(saved);
        setFourPs(data);
        toast.success('4Ps strategy loaded from saved data');
      }
    } catch (error) {
      console.error('Failed to load 4Ps data:', error);
    }
  };

  // Load products from localStorage
  const loadProducts = () => {
    try {
      const saved = localStorage.getItem('copcca-products');
      const productData = saved ? JSON.parse(saved) : [];
      setProducts(productData);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  // Load customers from localStorage
  const loadCustomers = () => {
    try {
      const saved = localStorage.getItem('copcca-customers');
      const customerData = saved ? JSON.parse(saved) : [];
      setCustomers(customerData);
      // Select first customer as default
      if (customerData.length > 0) {
        setSelectedCustomer(customerData[0]);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  // Load competitors from localStorage
  const loadCompetitors = () => {
    try {
      const saved = localStorage.getItem('copcca-competitors');
      const competitorData = saved ? JSON.parse(saved) : [];
      setCompetitors(competitorData);
    } catch (error) {
      console.error('Failed to load competitors:', error);
    }
  };

  // Product handlers
  const addProductItem = () => {
    if (!productForm.item.trim()) return toast.error('Product name required');
    setFourPs(prev => ({ ...prev, product: { ...prev.product, items: [...prev.product.items, productForm.item.trim()] } }));
    setProductForm({ ...productForm, item: '' });
    toast.success('Product added');
  };

  const addProductBenefit = () => {
    if (!productForm.benefit.trim()) return toast.error('Benefit required');
    setFourPs(prev => ({ ...prev, product: { ...prev.product, benefits: [...prev.product.benefits, productForm.benefit.trim()] } }));
    setProductForm({ ...productForm, benefit: '' });
    toast.success('Benefit added');
  };

  const addProductDifferentiator = () => {
    if (!productForm.differentiator.trim()) return toast.error('Differentiator required');
    setFourPs(prev => ({ ...prev, product: { ...prev.product, differentiators: [...prev.product.differentiators, productForm.differentiator.trim()] } }));
    setProductForm({ ...productForm, differentiator: '' });
    toast.success('Differentiator added');
  };

  // Price handlers
  const updatePricingModel = () => {
    if (!priceForm.model.trim()) return toast.error('Pricing model required');
    setFourPs(prev => ({ ...prev, price: { ...prev.price, model: priceForm.model.trim(), basePrice: Number(priceForm.basePrice) || 0 } }));
    toast.success('Pricing model updated');
  };

  const addDiscount = () => {
    if (!priceForm.discount.trim()) return toast.error('Discount required');
    setFourPs(prev => ({ ...prev, price: { ...prev.price, discounts: [...prev.price.discounts, priceForm.discount.trim()] } }));
    setPriceForm({ ...priceForm, discount: '' });
    toast.success('Discount added');
  };

  const addCompetitor = () => {
    if (!priceForm.compName.trim()) return toast.error('Competitor name required');
    setFourPs(prev => ({ ...prev, price: { ...prev.price, competitorComparison: [...prev.price.competitorComparison, { name: priceForm.compName.trim(), price: Number(priceForm.compPrice) || 0, position: priceForm.compPosition }] } }));
    setPriceForm({ ...priceForm, compName: '', compPrice: '' });
    toast.success('Competitor added');
  };

  // Place handlers
  const addPlaceChannel = () => {
    if (!placeForm.channelName.trim()) return toast.error('Channel name required');
    setFourPs(prev => ({ ...prev, place: { ...prev.place, channels: [...prev.place.channels, { name: placeForm.channelName.trim(), performance: Number(placeForm.channelPerformance), active: true }] } }));
    setPlaceForm({ ...placeForm, channelName: '', channelPerformance: '50' });
    toast.success('Channel added');
  };

  const addPlaceLocation = () => {
    if (!placeForm.location.trim()) return toast.error('Location required');
    setFourPs(prev => ({ ...prev, place: { ...prev.place, coverage: [...prev.place.coverage, placeForm.location.trim()] } }));
    setPlaceForm({ ...placeForm, location: '' });
    toast.success('Location added');
  };

  // Promotion handlers
  const addPromotionMessage = () => {
    if (!promotionForm.message.trim()) return toast.error('Message required');
    setFourPs(prev => ({ ...prev, promotion: { ...prev.promotion, messages: [...prev.promotion.messages, promotionForm.message.trim()] } }));
    setPromotionForm({ ...promotionForm, message: '' });
    toast.success('Message added');
  };

  const updatePromotionTone = () => {
    if (!promotionForm.tone.trim()) return toast.error('Tone required');
    setFourPs(prev => ({ ...prev, promotion: { ...prev.promotion, tone: promotionForm.tone.trim() } }));
    toast.success('Brand tone updated');
  };

  const addPromotionChannel = () => {
    if (!promotionForm.channel.trim()) return toast.error('Channel required');
    setFourPs(prev => ({ ...prev, promotion: { ...prev.promotion, channels: [...prev.promotion.channels, promotionForm.channel.trim()] } }));
    setPromotionForm({ ...promotionForm, channel: '' });
    toast.success('Channel added');
  };

  const addPromotionTheme = () => {
    if (!promotionForm.theme.trim()) return toast.error('Theme required');
    setFourPs(prev => ({ ...prev, promotion: { ...prev.promotion, themes: [...prev.promotion.themes, promotionForm.theme.trim()] } }));
    setPromotionForm({ ...promotionForm, theme: '' });
    toast.success('Theme added');
  };

  const handleSave = async () => {
    try {
      // Save to localStorage
      localStorage.setItem('copcca-4ps-strategy', JSON.stringify(fourPs));

      // Save to Supabase if available
      if (supabaseReady) {
        const { error } = await supabase
          .from('marketing_strategies')
          .upsert({
            strategy_type: '4ps',
            content: fourPs,
            customer_id: selectedCustomer?.id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Supabase save error:', error);
          toast.error('Saved locally, but failed to sync to cloud');
        } else {
          toast.success('4Ps strategy saved to cloud');
        }
      } else {
        toast.success('4Ps strategy saved locally');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save 4Ps strategy');
    }
  };

  // AI optimization using real data
  const handleOptimizeWithAI = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer for AI analysis');
      return;
    }

    // Generate optimized 4Ps based on customer data
    const optimizedStrategy = generateOptimized4Ps(selectedCustomer, products, competitors);

    setFourPs(optimizedStrategy);
    toast.success('AI optimization completed!', {
      description: '4Ps strategy optimized based on customer data and market analysis.',
    });
  };

  // Generate optimized 4Ps strategy based on real data
  const generateOptimized4Ps = (customer: Customer, products: Product[], competitors: Competitor[]) => {
    const customerType = customer.customer_type;
    const tier = customer.tier;
    const painPoints = customer.pain_points;

    // Product optimization
    const relevantProducts = products.filter(p =>
      p.category.toLowerCase().includes('crm') ||
      p.category.toLowerCase().includes('software') ||
      p.category.toLowerCase().includes('business')
    );

    const productItems = relevantProducts.length > 0
      ? relevantProducts.map(p => p.name)
      : ['CRM Software', 'Analytics Dashboard', 'Customer Support Suite'];

    const benefits = [
      'Streamlined customer management',
      'Real-time analytics and reporting',
      'Automated workflow optimization',
      '24/7 customer support access',
      'Scalable enterprise solutions'
    ];

    const differentiators = [
      'Local market expertise and support',
      'AI-powered insights and recommendations',
      'Enterprise-grade security and compliance',
      'Personalized customer success management',
      'Competitive pricing with premium features'
    ];

    // Price optimization based on customer tier
    const basePrice = tier === 'platinum' ? 999 : tier === 'gold' ? 499 : tier === 'silver' ? 299 : 99;
    const pricingModel = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier - ${formatCurrency(basePrice)}/month`;

    const discounts = [
      'First month 50% off',
      'Annual billing discount (15%)',
      'Multi-user discount (10% for 5+ users)',
      'Loyalty discount for existing customers'
    ];

    // Competitor pricing comparison
    const competitorComparison = competitors.slice(0, 3).map(comp => ({
      name: comp.name,
      price: comp.price * (tier === 'platinum' ? 1.2 : tier === 'gold' ? 1.0 : tier === 'silver' ? 0.8 : 0.6),
      position: comp.market_position
    }));

    // Place optimization
    const channels = [
      { name: 'Direct Sales Team', performance: 85, active: true },
      { name: 'Online Platform', performance: 75, active: true },
      { name: 'Partner Network', performance: 65, active: customerType === 'vip' },
      { name: 'Reseller Program', performance: 55, active: customerType === 'active' }
    ];

    const coverage = [
      'Nigeria (Primary Market)',
      'West Africa (Expansion)',
      'Online Global Access',
      'Local Office Presence'
    ];

    // Promotion optimization
    const messages = [
      `Transform your ${customerType} business with our ${tier} CRM solution`,
      'Join 500+ businesses already using our platform',
      `Solve ${painPoints.slice(0, 2).join(' and ')} with our comprehensive CRM suite`,
      'Experience the difference with local expertise and global technology'
    ];

    const tone = customer.sentiment === 'positive' ? 'Confident and supportive' :
                 customer.sentiment === 'negative' ? 'Empathetic and solution-focused' :
                 'Professional and informative';

    const promotionChannels = [
      'Email Marketing',
      'LinkedIn Campaigns',
      'Industry Webinars',
      'Customer Success Stories',
      'Partner Referrals'
    ];

    const themes = [
      'Digital Transformation',
      'Customer-Centric Growth',
      'Local Market Leadership',
      'Technology-Driven Solutions',
      'Business Efficiency'
    ];

    return {
      product: {
        items: productItems,
        benefits,
        quality: 'Enterprise-grade with 99.9% uptime SLA',
        differentiators,
      },
      price: {
        model: pricingModel,
        basePrice,
        discounts,
        sensitivity: customer.churn_risk > 70 ? 'High - focus on value demonstration' : 'Medium - emphasize ROI',
        competitorComparison,
      },
      place: {
        channels,
        coverage,
      },
      promotion: {
        messages,
        tone,
        channels: promotionChannels,
        themes,
      },
    };
  };

  return (
    <div className="space-y-6">
      {/* Customer Selection */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Select Customer for Analysis</h3>
        <div className="space-y-3">
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find(c => c.id === e.target.value);
              setSelectedCustomer(customer || null);
            }}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a customer...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.customer_type} ({customer.tier})
              </option>
            ))}
          </select>
          {selectedCustomer && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="font-medium text-sm text-slate-700 mb-2">Customer Profile:</div>
              <div className="text-sm text-slate-600 space-y-1">
                <div><strong>JTBD:</strong> {selectedCustomer.jtbd || 'Not specified'}</div>
                <div><strong>Pain Points:</strong> {selectedCustomer.pain_points.join(', ') || 'None specified'}</div>
                <div><strong>Sentiment:</strong> {selectedCustomer.sentiment}</div>
                <div><strong>Health Score:</strong> {selectedCustomer.health_score}%</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* AI Insight */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-none">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">AI Strategy Analysis</h3>
            <p className="text-sm opacity-90">
              {selectedCustomer ? (
                <>
                  {selectedCustomer.sentiment === 'negative' && selectedCustomer.churn_risk > 70
                    ? `High-risk customer detected. Focus on ${selectedCustomer.pain_points[0] || 'customer retention'} with premium support and competitive pricing.`
                    : selectedCustomer.customer_type === 'vip'
                    ? `VIP customer opportunity. Emphasize enterprise features, dedicated support, and premium positioning to maximize lifetime value.`
                    : `Growing ${selectedCustomer.customer_type} customer. Balance value-driven messaging with quality differentiation.`
                  }
                  {competitors.length > 0 && ` Market analysis shows ${competitors.filter(c => c.threat_level === 'high').length} high-threat competitors.`}
                </>
              ) : (
                'Select a customer to get AI-powered strategy analysis based on their profile and market data.'
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* 4Ps Navigation */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { id: 'product', label: 'Product', icon: Package, color: 'blue' },
          { id: 'price', label: 'Price', icon: Banknote, color: 'green' },
          { id: 'place', label: 'Place', icon: MapPin, color: 'purple' },
          { id: 'promotion', label: 'Promotion', icon: Megaphone, color: 'orange' },
        ].map((p) => {
          const Icon = p.icon;
          const isActive = activeP === p.id;
          const styles = pColorStyles[p.color as keyof typeof pColorStyles];
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => setActiveP(p.id as typeof activeP)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isActive
                  ? `${styles.border} ${styles.bg}`
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className={`mx-auto mb-2 ${isActive ? styles.icon : 'text-slate-400'}`} size={28} />
              <div className={`text-sm font-semibold ${isActive ? styles.text : 'text-slate-600'}`}>
                {p.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Product Section */}
      {activeP === 'product' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Products / Services</h3>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Product/Service Name" placeholder="e.g., Industrial Pumps" value={productForm.item} onChange={(e) => setProductForm({ ...productForm, item: e.target.value })} />
                <div className="flex items-end"><Button icon={Plus} onClick={addProductItem} className="w-full">Add Product</Button></div>
              </div>
            </div>

            {/* Real Products from System */}
            {products.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-slate-700 mb-2">Available Products from System:</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        if (!fourPs.product.items.includes(product.name)) {
                          setFourPs(prev => ({
                            ...prev,
                            product: {
                              ...prev.product,
                              items: [...prev.product.items, product.name]
                            }
                          }));
                          toast.success(`Added ${product.name} to strategy`);
                        }
                      }}
                      className="p-2 bg-slate-50 rounded border text-left hover:bg-slate-100 transition-colors"
                    >
                      <div className="font-medium text-sm text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-600">{product.category} • {formatCurrency(product.price)}</div>
                      <div className="text-xs text-green-600">Satisfaction: {product.customer_satisfaction}/10</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fourPs.product.items.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No products added. Use form above to add your first product.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {fourPs.product.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex justify-between items-center">
                    <div><Package size={16} className="text-blue-600 inline mr-2" /><span className="font-medium text-slate-900">{item}</span></div>
                    <button onClick={() => setFourPs(prev => ({ ...prev, product: { ...prev.product, items: prev.product.items.filter((_, i) => i !== idx) } }))} className="text-red-600 hover:text-red-700"><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Key Benefits</h3>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Benefit" placeholder="e.g., Durability, Energy Efficient" value={productForm.benefit} onChange={(e) => setProductForm({ ...productForm, benefit: e.target.value })} />
                <div className="flex items-end"><Button icon={Plus} onClick={addProductBenefit} className="w-full">Add Benefit</Button></div>
              </div>
            </div>
            {fourPs.product.benefits.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No benefits added. Use form above to add benefits.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {fourPs.product.benefits.map((benefit, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2">
                    {benefit}
                    <button onClick={() => setFourPs(prev => ({ ...prev, product: { ...prev.product, benefits: prev.product.benefits.filter((_, i) => i !== idx) } }))} className="text-red-600"><X size={14} /></button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Differentiators</h3>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Differentiator" placeholder="e.g., 24/7 Support, Same-day Service" value={productForm.differentiator} onChange={(e) => setProductForm({ ...productForm, differentiator: e.target.value })} />
                <div className="flex items-end"><Button icon={Plus} onClick={addProductDifferentiator} className="w-full">Add Differentiator</Button></div>
              </div>
            </div>
            {fourPs.product.differentiators.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No differentiators added. Use form above to add differentiators.</p>
            ) : (
              <ul className="space-y-2">
                {fourPs.product.differentiators.map((diff, idx) => (
                  <li key={idx} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <div className="flex items-center gap-2"><Sparkles size={16} className="text-purple-600" /><span className="text-slate-700">{diff}</span></div>
                    <button onClick={() => setFourPs(prev => ({ ...prev, product: { ...prev.product, differentiators: prev.product.differentiators.filter((_, i) => i !== idx) } }))} className="text-red-600"><X size={16} /></button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* Price Section */}
      {activeP === 'price' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Pricing Model</h3>
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <div className="grid md:grid-cols-3 gap-3">
                <Input label="Pricing Model" placeholder="e.g., Tiered Pricing" value={priceForm.model} onChange={(e) => setPriceForm({ ...priceForm, model: e.target.value })} />
                <Input label="Base Price" type="number" placeholder="150000" value={priceForm.basePrice} onChange={(e) => setPriceForm({ ...priceForm, basePrice: e.target.value })} />
                <div className="flex items-end"><Button icon={Save} onClick={updatePricingModel} className="w-full">Update Pricing</Button></div>
              </div>
            </div>
            {fourPs.price.model ? (
              <div>
                <div className="text-lg font-medium text-slate-900 mb-2">{fourPs.price.model}</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(fourPs.price.basePrice)}</div>
                <div className="text-sm text-slate-600 mt-1">Base price per unit</div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No pricing model set. Use form above to configure pricing.</p>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Discounts & Incentives</h3>
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Discount" placeholder="e.g., 5% bulk orders" value={priceForm.discount} onChange={(e) => setPriceForm({ ...priceForm, discount: e.target.value })} />
                <div className="flex items-end"><Button icon={Plus} onClick={addDiscount} className="w-full">Add Discount</Button></div>
              </div>
            </div>
            {fourPs.price.discounts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No discounts added. Use form above to add discounts.</p>
            ) : (
              <div className="space-y-2">
                {fourPs.price.discounts.map((discount, idx) => (
                  <div key={idx} className="p-2 bg-green-50 rounded text-sm text-slate-700 flex justify-between items-center">
                    <span>✓ {discount}</span>
                    <button onClick={() => setFourPs(prev => ({ ...prev, price: { ...prev.price, discounts: prev.price.discounts.filter((_, i) => i !== idx) } }))} className="text-red-600"><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Competitor Price Comparison</h3>
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <div className="grid md:grid-cols-4 gap-3">
                <Input label="Competitor" placeholder="Competitor A" value={priceForm.compName} onChange={(e) => setPriceForm({ ...priceForm, compName: e.target.value })} />
                <Input label="Price" type="number" placeholder="165000" value={priceForm.compPrice} onChange={(e) => setPriceForm({ ...priceForm, compPrice: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                  <select value={priceForm.compPosition} onChange={(e) => setPriceForm({ ...priceForm, compPosition: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                    <option>Higher</option>
                    <option>Similar</option>
                    <option>Lower</option>
                  </select>
                </div>
                <div className="flex items-end"><Button icon={Plus} onClick={addCompetitor} className="w-full">Add Competitor</Button></div>
              </div>
            </div>

            {/* Real Competitors from System */}
            {competitors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-slate-700 mb-2">Available Competitors from System:</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {competitors.slice(0, 4).map((competitor) => (
                    <button
                      key={competitor.id}
                      onClick={() => {
                        const existingComp = fourPs.price.competitorComparison.find(c => c.name === competitor.name);
                        if (!existingComp) {
                          setFourPs(prev => ({
                            ...prev,
                            price: {
                              ...prev.price,
                              competitorComparison: [...prev.price.competitorComparison, {
                                name: competitor.name,
                                price: competitor.price,
                                position: competitor.pricing_strategy === 'premium' ? 'Higher' :
                                         competitor.pricing_strategy === 'competitive' ? 'Similar' : 'Lower'
                              }]
                            }
                          }));
                          toast.success(`Added ${competitor.name} pricing data`);
                        }
                      }}
                      className="p-2 bg-slate-50 rounded border text-left hover:bg-slate-100 transition-colors"
                    >
                      <div className="font-medium text-sm text-slate-900">{competitor.name}</div>
                      <div className="text-xs text-slate-600">{formatCurrency(competitor.price)} • {competitor.pricing_strategy}</div>
                      <div className={`text-xs ${
                        competitor.threat_level === 'high' || competitor.threat_level === 'critical'
                          ? 'text-red-600'
                          : competitor.threat_level === 'medium'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        Threat: {competitor.threat_level}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fourPs.price.competitorComparison.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No competitor data. Use form above to add competitors.</p>
            ) : (
              <div className="space-y-3">
                {fourPs.price.competitorComparison.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="font-medium text-slate-900">{comp.name}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-slate-700">{formatCurrency(comp.price)}</div>
                      <span className={`px-2 py-1 rounded text-xs ${comp.position === 'Higher' ? 'bg-red-100 text-red-700' : comp.position === 'Similar' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{comp.position}</span>
                      <button onClick={() => setFourPs(prev => ({ ...prev, price: { ...prev.price, competitorComparison: prev.price.competitorComparison.filter((_, i) => i !== idx) } }))} className="text-red-600"><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Place Section */}
      {activeP === 'place' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Distribution Channels</h3>
            <div className="mb-4 p-4 bg-purple-50 rounded-lg">
              <div className="grid md:grid-cols-3 gap-3">
                <Input label="Channel Name" placeholder="Direct Sales, Online Store" value={placeForm.channelName} onChange={(e) => setPlaceForm({ ...placeForm, channelName: e.target.value })} />
                <Input label="Performance %" type="number" min="0" max="100" placeholder="50" value={placeForm.channelPerformance} onChange={(e) => setPlaceForm({ ...placeForm, channelPerformance: e.target.value })} />
                <div className="flex items-end"><Button icon={Plus} onClick={addPlaceChannel} className="w-full">Add Channel</Button></div>
              </div>
            </div>
            {fourPs.place.channels.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No channels added. Use form above to add distribution channels.</p>
            ) : (
              <div className="space-y-3">
                {fourPs.place.channels.map((channel, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{channel.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600">{channel.performance}% performance</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${channel.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{channel.active ? 'Active' : 'Inactive'}</span>
                        <button onClick={() => setFourPs(prev => ({ ...prev, place: { ...prev.place, channels: prev.place.channels.filter((_, i) => i !== idx) } }))} className="text-red-600"><X size={16} /></button>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all" style={{ width: `${channel.performance}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Regional Coverage</h3>
            <div className="mb-4 p-4 bg-purple-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Location/Region" placeholder="Lagos, Abuja, Port Harcourt" value={placeForm.location} onChange={(e) => setPlaceForm({ ...placeForm, location: e.target.value })} />
                <div className="flex items-end"><Button icon={Plus} onClick={addPlaceLocation} className="w-full">Add Location</Button></div>
              </div>
            </div>
            {fourPs.place.coverage.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No locations added. Use form above to add regional coverage.</p>
            ) : (
              <div className="grid md:grid-cols-3 gap-3">
                {fourPs.place.coverage.map((location, idx) => (
                  <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200 flex justify-between items-center">
                    <div><MapPin size={16} className="text-purple-600 inline mr-2" /><span className="font-medium text-slate-900">{location}</span></div>
                    <button onClick={() => setFourPs(prev => ({ ...prev, place: { ...prev.place, coverage: prev.place.coverage.filter((_, i) => i !== idx) } }))} className="text-red-600"><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Promotion Section */}
      {activeP === 'promotion' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Core Messages</h3>
            <div className="mb-4 p-4 bg-orange-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Marketing Message" placeholder="Reliable. Local. Always Available." value={promotionForm.message} onChange={(e) => setPromotionForm({ ...promotionForm, message: e.target.value })} />
                <div className="flex items-end"><Button icon={Plus} onClick={addPromotionMessage} className="w-full">Add Message</Button></div>
              </div>
            </div>
            {fourPs.promotion.messages.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No messages added. Use form above to add core messages.</p>
            ) : (
              fourPs.promotion.messages.map((msg, idx) => (
                <div key={idx} className="p-3 bg-orange-50 rounded-lg mb-2 border border-orange-200 flex justify-between items-center">
                  <div><Megaphone size={16} className="text-orange-600 inline mr-2" /><span className="font-medium text-slate-900">{msg}</span></div>
                  <button onClick={() => setFourPs(prev => ({ ...prev, promotion: { ...prev.promotion, messages: prev.promotion.messages.filter((_, i) => i !== idx) } }))} className="text-red-600"><X size={16} /></button>
                </div>
              ))
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Brand Tone</h3>
            <div className="mb-4 p-4 bg-orange-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Brand Tone" placeholder="Professional, trustworthy, solution-focused" value={promotionForm.tone} onChange={(e) => setPromotionForm({ ...promotionForm, tone: e.target.value })} />
                <div className="flex items-end"><Button icon={Save} onClick={updatePromotionTone} className="w-full">Update Tone</Button></div>
              </div>
            </div>
            {fourPs.promotion.tone ? (
              <p className="text-slate-700 p-3 bg-slate-50 rounded-lg">{fourPs.promotion.tone}</p>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No brand tone defined. Use form above to set tone.</p>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Promotion Channels</h3>
            <div className="mb-4 p-4 bg-orange-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Channel" placeholder="LinkedIn, Email, Industry Events" value={promotionForm.channel} onChange={(e) => setPromotionForm({ ...promotionForm, channel: e.target.value })} />
                <div className="flex items-end"><Button icon={Plus} onClick={addPromotionChannel} className="w-full">Add Channel</Button></div>
              </div>
            </div>
            {fourPs.promotion.channels.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No channels added. Use form above to add promotion channels.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {fourPs.promotion.channels.map((channel, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                    {channel}
                    <button onClick={() => setFourPs(prev => ({ ...prev, promotion: { ...prev.promotion, channels: prev.promotion.channels.filter((_, i) => i !== idx) } }))} className="text-red-600"><X size={14} /></button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Content Themes</h3>
            <div className="mb-4 p-4 bg-orange-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Theme" placeholder="Quality, Support, Reliability" value={promotionForm.theme} onChange={(e) => setPromotionForm({ ...promotionForm, theme: e.target.value })} />
                <div className="flex items-end"><Button icon={Plus} onClick={addPromotionTheme} className="w-full">Add Theme</Button></div>
              </div>
            </div>
            {fourPs.promotion.themes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No themes added. Use form above to add content themes.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {fourPs.promotion.themes.map((theme, idx) => (
                  <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2">
                    {theme}
                    <button onClick={() => setFourPs(prev => ({ ...prev, promotion: { ...prev.promotion, themes: prev.promotion.themes.filter((_, i) => i !== idx) } }))} className="text-red-600"><X size={14} /></button>
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="flex gap-3">
        <Button icon={Save} onClick={handleSave}>
          Save 4Ps Strategy
        </Button>
        <Button
          variant="outline"
          onClick={handleOptimizeWithAI}
        >
          <Sparkles size={16} className="mr-2" />
          Optimize with AI
        </Button>
      </div>
    </div>
  );
};
