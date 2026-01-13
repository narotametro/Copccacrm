import React, { useState } from 'react';
import { ArrowLeft, Banknote, Brain, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { Input } from '@/components/ui/Input';

interface PricingTier {
  id: string;
  name: string;
  segment: string;
  base_price: number;
  pricing_model: string;
  discount_rules: string[];
  ai_discount_suggestion: string;
  typical_discount: number;
  value_drivers: string[];
  competitive_position: string;
}

const initialTiers: PricingTier[] = [
  {
    id: '1',
    name: 'Enterprise',
    segment: 'Enterprise Manufacturing',
    base_price: 150000,
    pricing_model: 'Annual license + implementation fee',
    discount_rules: [
      'Multi-year commitment: up to 15% discount',
      'Volume (500+ users): up to 10% discount',
      'Early payment: 5% discount',
    ],
    ai_discount_suggestion: 'Customer has budget approved, strong champion. Offer 8% for multi-year to close faster.',
    typical_discount: 12,
    value_drivers: ['Compliance certification', 'Enterprise support', 'Custom integrations'],
    competitive_position: 'Premium pricing justified by unique compliance features',
  },
  {
    id: '2',
    name: 'Growth',
    segment: 'Mid-Market Tech',
    base_price: 60000,
    pricing_model: 'Annual subscription per user',
    discount_rules: [
      'Annual vs monthly: 20% savings',
      'Growth commitment: up to 10% discount',
      'Referral: 5% first year',
    ],
    ai_discount_suggestion: 'Customer comparing with competitor. Match competitor price (10% off) to win deal.',
    typical_discount: 8,
    value_drivers: ['Scalability', 'Real-time collaboration', 'Security features'],
    competitive_position: 'Mid-range pricing with better feature set than competitors',
  },
  {
    id: '3',
    name: 'Starter',
    segment: 'SMB Professional Services',
    base_price: 18000,
    pricing_model: 'Monthly subscription per user',
    discount_rules: [
      'Annual prepay: 15% savings',
      'Non-profit: 20% discount',
      'No discounts for monthly plans',
    ],
    ai_discount_suggestion: 'Price-sensitive segment. Emphasize value, avoid discounts. Offer annual plan with 15% savings.',
    typical_discount: 5,
    value_drivers: ['Ease of use', 'Fast setup', 'Free migration'],
    competitive_position: 'Competitive pricing with superior support included',
  },
];

interface PricingLogicProps {
  onBack: () => void;
}

export const PricingLogic: React.FC<PricingLogicProps> = ({ onBack }) => {
  const { formatCurrency } = useCurrency();
  const [tiers, setTiers] = useState<PricingTier[]>(initialTiers);
  const [form, setForm] = useState({
    name: '',
    segment: '',
    base_price: '',
    pricing_model: '',
    discount_rules: '',
    typical_discount: '',
    value_drivers: '',
    competitive_position: '',
    ai_discount_suggestion: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.segment || !form.base_price) return;

    const newTier: PricingTier = {
      id: crypto.randomUUID(),
      name: form.name,
      segment: form.segment,
      base_price: Number(form.base_price) || 0,
      pricing_model: form.pricing_model || 'Subscription',
      discount_rules: form.discount_rules ? form.discount_rules.split(',').map((r) => r.trim()).filter(Boolean) : [],
      ai_discount_suggestion: form.ai_discount_suggestion || 'No suggestion yet',
      typical_discount: Number(form.typical_discount) || 0,
      value_drivers: form.value_drivers ? form.value_drivers.split(',').map((v) => v.trim()).filter(Boolean) : [],
      competitive_position: form.competitive_position || 'Not specified',
    };

    setTiers((prev) => [newTier, ...prev]);
    setForm({
      name: '',
      segment: '',
      base_price: '',
      pricing_model: '',
      discount_rules: '',
      typical_discount: '',
      value_drivers: '',
      competitive_position: '',
      ai_discount_suggestion: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="outline" icon={ArrowLeft} onClick={onBack}>
        Back to Strategy
      </Button>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="text-blue-600" size={20} />
            <span className="text-xs text-slate-600">Pricing Tiers</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{tiers.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-600" size={20} />
            <span className="text-xs text-slate-600">Avg Base Price</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(
              Math.round(tiers.reduce((sum, tier) => sum + tier.base_price, 0) / tiers.length || 0)
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-orange-600" size={20} />
            <span className="text-xs text-slate-600">Avg Discount</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {Math.round(tiers.reduce((sum, tier) => sum + tier.typical_discount, 0) / (tiers.length || 1))}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="text-purple-600" size={20} />
            <span className="text-xs text-slate-600">AI Suggestions</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{tiers.length}</div>
        </Card>
      </div>

      {/* Pricing Tiers */}
      <div className="space-y-4">
        {tiers.map((tier) => (
          <Card key={tier.id} className="p-5 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{tier.name} Tier</h3>
                <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {tier.segment}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(tier.base_price)}</div>
                <div className="text-xs text-slate-600">{tier.pricing_model}</div>
              </div>
            </div>

            {/* Discount Rules */}
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-700 mb-2">Discount Rules</div>
              <div className="space-y-2">
                {tier.discount_rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <TrendingDown className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-slate-700">{rule}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm">
                <span className="text-slate-600">Typical discount: </span>
                <span className="font-bold text-orange-600">{tier.typical_discount}%</span>
              </div>
            </div>

            {/* AI Suggestion */}
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Brain className="text-purple-600 flex-shrink-0" size={20} />
                <div>
                  <div className="text-xs font-medium text-purple-900 mb-1">AI Discount Suggestion</div>
                  <p className="text-sm text-purple-700">{tier.ai_discount_suggestion}</p>
                </div>
              </div>
            </div>

            {/* Value Drivers */}
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-700 mb-2">Key Value Drivers</div>
              <div className="flex flex-wrap gap-2">
                {tier.value_drivers.map((driver, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {driver}
                  </span>
                ))}
              </div>
            </div>

            {/* Competitive Position */}
            <div className="p-3 bg-slate-50 rounded">
              <div className="text-xs font-medium text-slate-700 mb-1">Competitive Position</div>
              <p className="text-sm text-slate-600">{tier.competitive_position}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Add Pricing Tier</h3>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAdd}>
          <Input
            label="Tier Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Segment"
            value={form.segment}
            onChange={(e) => setForm({ ...form, segment: e.target.value })}
            required
          />
          <Input
            label="Base Price"
            type="number"
            value={form.base_price}
            onChange={(e) => setForm({ ...form, base_price: e.target.value })}
            required
          />
          <Input
            label="Pricing Model"
            value={form.pricing_model}
            onChange={(e) => setForm({ ...form, pricing_model: e.target.value })}
            placeholder="e.g. Annual subscription"
          />
          <Input
            label="Discount Rules (comma separated)"
            value={form.discount_rules}
            onChange={(e) => setForm({ ...form, discount_rules: e.target.value })}
          />
          <Input
            label="Typical Discount (%)"
            type="number"
            value={form.typical_discount}
            onChange={(e) => setForm({ ...form, typical_discount: e.target.value })}
          />
          <Input
            label="Value Drivers (comma separated)"
            value={form.value_drivers}
            onChange={(e) => setForm({ ...form, value_drivers: e.target.value })}
          />
          <Input
            label="Competitive Position"
            value={form.competitive_position}
            onChange={(e) => setForm({ ...form, competitive_position: e.target.value })}
          />
          <Input
            label="AI Discount Suggestion"
            value={form.ai_discount_suggestion}
            onChange={(e) => setForm({ ...form, ai_discount_suggestion: e.target.value })}
          />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Add Pricing Tier</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
