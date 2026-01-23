import React, { useState, useEffect } from 'react';
import { Lightbulb, Save, Sparkles, Link as LinkIcon, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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

export const ValueProposition: React.FC = () => {
  const [valueProp, setValueProp] = useState({
    statement: '',
    pain: '',
    differentiation: '',
    proof: '',
    linkedProducts: [] as string[],
  });

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  // Load data on component mount
  useEffect(() => {
    loadCompetitors();
    loadCustomers();
  }, []);

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

  // Load customers from localStorage
  const loadCustomers = () => {
    try {
      const saved = localStorage.getItem('copcca-customers');
      const customerData = saved ? JSON.parse(saved) : [];
      setCustomers(customerData);
      // Select the first customer as default for analysis
      if (customerData.length > 0) {
        setSelectedCustomer(customerData[0]);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  // Generate value proposition based on real data
  const generateValueProposition = (customer: Customer) => {
    const statement = generateStatement(customer);
    const pain = generatePainAnalysis(customer);
    const differentiation = generateDifferentiation(customer);
    const proof = generateProof(customer);

    setValueProp({
      statement,
      pain,
      differentiation,
      proof,
      linkedProducts: ['CRM Software', 'Analytics Dashboard', 'Customer Support Suite'], // Default products
    });
  };

  // Generate value proposition statement
  const generateStatement = (customer: Customer): string => {
    const { customer_type, jtbd } = customer;
    
    if (jtbd) {
      return `We help ${customer_type === 'vip' ? 'enterprise organizations' : 
                      customer_type === 'active' ? 'growing businesses' : 
                      'companies'} ${jtbd.toLowerCase()}`;
    }

    // Fallback based on customer type and tier
    const baseStatement = customer_type === 'vip' 
      ? 'Enterprise-grade CRM solutions that scale with your business'
      : customer_type === 'active'
      ? 'Modern CRM tools designed for growing companies'
      : 'Affordable CRM solutions for small businesses';

    return baseStatement;
  };

  // Generate pain analysis
  const generatePainAnalysis = (customer: Customer): string => {
    const { pain_points, customer_type, churn_risk } = customer;
    
    if (pain_points && pain_points.length > 0) {
      return pain_points.slice(0, 2).join(', ') + (pain_points.length > 2 ? ', and more operational challenges' : '');
    }

    // Fallback based on customer type and risk
    if (customer_type === 'at-risk' || churn_risk > 60) {
      return 'Customer retention challenges, operational inefficiencies, and competitive pressure';
    } else if (customer_type === 'vip') {
      return 'Complex enterprise requirements, scalability challenges, and integration needs';
    } else {
      return 'Manual processes, customer data management, and sales tracking difficulties';
    }
  };

  // Generate differentiation
  const generateDifferentiation = (customer: Customer): string => {
    const { customer_type } = customer;
    
    if (customer_type === 'vip') {
      return 'Local support network, AI-powered insights, and enterprise-grade security with 24/7 dedicated support';
    } else if (customer_type === 'active') {
      return 'Affordable pricing with premium features, local market expertise, and personalized customer success management';
    } else {
      return 'User-friendly interface, rapid implementation, and comprehensive training included at no extra cost';
    }
  };

  // Generate proof/metrics
  const generateProof = (customer: Customer): string => {
    const { total_revenue, purchases, health_score, sentiment } = customer;
    
    const metrics = [];
    
    if (total_revenue > 0) {
      metrics.push(`₦${(total_revenue / 1000000).toFixed(1)}M+ in customer revenue managed`);
    }
    
    if (purchases > 0) {
      metrics.push(`${purchases}+ successful transactions processed`);
    }
    
    if (health_score && health_score > 70) {
      metrics.push(`${health_score}% customer satisfaction rate`);
    }
    
    if (sentiment === 'positive') {
      metrics.push('95% positive customer feedback');
    }
    
    return metrics.length > 0 
      ? metrics.join(', ') + '. Trusted by 500+ businesses across Nigeria.'
      : '500+ businesses trust our CRM solutions. 95% customer satisfaction rate. 24/7 local support.';
  };

  // Generate AI analysis based on real data
  const generateAIAnalysis = (customer: Customer, competitors: Competitor[]) => {
    const { customer_type, tier, sentiment, health_score, pain_points } = customer;
    
    const analysis = {
      isClear: true,
      isDifferentiated: true,
      genericInDigital: false,
      recommendations: [] as string[],
      tags: [] as string[],
    };

    // Analyze clarity
    analysis.isClear = customer_type !== 'lead' && tier !== 'bronze';
    
    // Analyze differentiation
    const topCompetitors = competitors.filter(c => c.threat_level === 'high' || c.threat_level === 'critical');
    analysis.isDifferentiated = topCompetitors.length === 0 || topCompetitors.every(c => c.market_share < 15);
    
    // Check for generic digital messaging
    analysis.genericInDigital = customer_type === 'lead' && !pain_points?.length;
    
    // Generate recommendations
    if (customer_type === 'vip') {
      analysis.recommendations.push('Emphasize enterprise scalability and security features');
    }
    if (sentiment === 'negative' || (health_score && health_score < 60)) {
      analysis.recommendations.push('Focus on customer success and support quality');
    }
    if (pain_points && pain_points.some(p => p.toLowerCase().includes('integration'))) {
      analysis.recommendations.push('Highlight seamless API integrations and technical support');
    }
    
    // Generate tags
    analysis.tags = [];
    if (analysis.isClear) analysis.tags.push('✓ Clear');
    if (analysis.isDifferentiated) analysis.tags.push('✓ Differentiated');
    if (analysis.genericInDigital) analysis.tags.push('⚠ Generic in digital');
    if (customer_type === 'vip') analysis.tags.push('🏢 Enterprise Focus');
    if (sentiment === 'positive') analysis.tags.push('😊 High Satisfaction');
    
    return analysis;
  };

  const handleSave = async () => {
    try {
      if (!valueProp.statement.trim()) {
        toast.error('Please enter a value proposition statement');
        return;
      }

      // Save to localStorage
      const valueProps = JSON.parse(localStorage.getItem('copcca-value-propositions') || '[]');
      const newValueProp = {
        id: Date.now().toString(),
        ...valueProp,
        customer_id: selectedCustomer?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      valueProps.unshift(newValueProp);
      localStorage.setItem('copcca-value-propositions', JSON.stringify(valueProps));

      // Save to database if Supabase is available
      if (supabaseReady) {
        await supabase
          .from('value_propositions')
          .insert([{
            statement: valueProp.statement,
            pain_solved: valueProp.pain,
            differentiation: valueProp.differentiation,
            proof: valueProp.proof,
            linked_products: valueProp.linkedProducts,
            customer_id: selectedCustomer?.id || null,
          }]);
      }

      toast.success('Value proposition saved successfully!', {
        description: 'Available for use in marketing campaigns and sales materials.',
      });
    } catch (error) {
      console.error('Failed to save value proposition:', error);
      toast.error('Failed to save value proposition');
    }
  };

  const handleImproveWithAI = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer to analyze');
      return;
    }
    
    generateValueProposition(selectedCustomer);
    toast.success('AI-generated value proposition created!', {
      description: 'Based on customer data and market analysis.',
    });
  };

  const aiAnalysis = selectedCustomer ? generateAIAnalysis(selectedCustomer, competitors) : null;

  return (
    <div className="space-y-6">
      {/* AI Assistant Panel */}
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles size={24} className="flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-2">AI Analysis</h3>
            <p className="text-sm opacity-90 mb-3">
              {aiAnalysis 
                ? `Your value proposition ${aiAnalysis.isClear ? 'is clear' : 'needs clarification'} and ${aiAnalysis.isDifferentiated ? 'well-differentiated' : 'could be more differentiated'}. ${aiAnalysis.genericInDigital ? 'Consider local market emphasis for digital campaigns.' : 'Strong positioning across all channels.'}`
                : 'Select a customer to get AI-powered analysis of your value proposition.'
              }
            </p>
            {aiAnalysis ? (
              <div className="flex gap-2 flex-wrap">
                {aiAnalysis.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white/20 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-white/20 rounded text-xs">✓ Clear</span>
                <span className="px-2 py-1 bg-white/20 rounded text-xs">✓ Differentiated</span>
                <span className="px-2 py-1 bg-white/20 rounded text-xs">⚠ Generic in digital</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Value Proposition Form */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="text-purple-600" size={24} />
          <h3 className="text-xl font-semibold text-slate-900">Value Proposition Builder</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Target size={16} className="inline mr-1" />
              Select Customer for Analysis
            </label>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customer = customers.find(c => c.id === e.target.value);
                setSelectedCustomer(customer || null);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Choose a customer...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.customer_type} ({customer.tier})
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Customer Profile:</strong> {selectedCustomer.jtbd}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Pain Points: {selectedCustomer.pain_points.join(', ')}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Value Proposition Statement
            </label>
            <textarea
              value={valueProp.statement}
              onChange={(e) => setValueProp({ ...valueProp, statement: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="What unique value do you offer?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Customer Pain Solved
            </label>
            <textarea
              value={valueProp.pain}
              onChange={(e) => setValueProp({ ...valueProp, pain: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="What problem do you solve?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Unique Differentiation
            </label>
            <textarea
              value={valueProp.differentiation}
              onChange={(e) => setValueProp({ ...valueProp, differentiation: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="What makes you different?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Proof (Metrics, Testimonials)
            </label>
            <textarea
              value={valueProp.proof}
              onChange={(e) => setValueProp({ ...valueProp, proof: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="What evidence supports your claims?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <LinkIcon size={16} className="inline mr-1" />
              Linked Products
            </label>
            <div className="flex flex-wrap gap-2">
              {valueProp.linkedProducts.map((product, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                >
                  {product}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button icon={Save} onClick={handleSave}>
            Save Value Proposition
          </Button>
          <Button
            variant="outline"
            onClick={handleImproveWithAI}
          >
            <Sparkles size={16} className="mr-2" />
            Improve with AI
          </Button>
        </div>
      </Card>

      {/* Competitor Comparison */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Competitor Messaging Comparison</h3>
        <div className="space-y-3">
          {competitors.slice(0, 2).map((competitor) => (
            <div key={competitor.id} className="p-3 bg-slate-50 rounded-lg">
              <div className="font-medium text-sm text-slate-700 mb-1">{competitor.name}</div>
              <div className="text-sm text-slate-600">
                {competitor.usp || `${competitor.brand} - ${competitor.industry} ${competitor.competitor_type}`}
              </div>
              <div className={`text-xs mt-1 ${
                competitor.threat_level === 'high' || competitor.threat_level === 'critical'
                  ? 'text-red-600'
                  : competitor.threat_level === 'medium'
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {competitor.threat_level === 'high' || competitor.threat_level === 'critical'
                  ? '⚠ High threat - strong positioning'
                  : competitor.threat_level === 'medium'
                  ? '⚠ Medium threat - competitive overlap'
                  : '✓ Low threat - niche positioning'
                }
              </div>
            </div>
          ))}
          {competitors.length === 0 && (
            <>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-medium text-sm text-slate-700 mb-1">Competitor A</div>
                <div className="text-sm text-slate-600">"Leading supplier of industrial equipment"</div>
                <div className="text-xs text-red-600 mt-1">⚠ Generic, no differentiation</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-medium text-sm text-slate-700 mb-1">Competitor B</div>
                <div className="text-sm text-slate-600">"Fast delivery and competitive prices"</div>
                <div className="text-xs text-yellow-600 mt-1">⚠ Similar to your positioning</div>
              </div>
            </>
          )}
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="font-medium text-sm text-slate-700 mb-1">Your Company</div>
            <div className="text-sm text-slate-600">{valueProp.statement}</div>
            <div className="text-xs text-green-600 mt-1">✓ Differentiated with local support angle</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
