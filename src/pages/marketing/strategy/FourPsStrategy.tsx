import React, { useState } from 'react';
import {
  Package,
  Banknote,
  MapPin,
  Megaphone,
  Save,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';

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

  const fourPs = {
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
  };

  const handleSave = () => {
    // Save to backend
    toast.success('4Ps strategy saved', {
      description: 'Demo: stored locally (backend hookup pending).',
    });
  };

  return (
    <div className="space-y-6">
      {/* AI Insight */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-none">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">AI Strategy Alert</h3>
            <p className="text-sm opacity-90">
              Your pricing matches competitors, but promotion emphasizes premium value — potential 
              misalignment detected. Consider highlighting premium service (Place) to justify pricing.
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
            <div className="grid md:grid-cols-2 gap-4">
              {fourPs.product.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Package size={16} className="text-blue-600 inline mr-2" />
                  <span className="font-medium text-slate-900">{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Key Benefits</h3>
            <div className="flex flex-wrap gap-2">
              {fourPs.product.benefits.map((benefit, idx) => (
                <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {benefit}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Differentiators</h3>
            <ul className="space-y-2">
              {fourPs.product.differentiators.map((diff, idx) => (
                <li key={idx} className="flex items-center gap-2 text-slate-700">
                  <Sparkles size={16} className="text-purple-600" />
                  {diff}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Price Section */}
      {activeP === 'price' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Pricing Model</h3>
            <div className="text-lg font-medium text-slate-900 mb-2">{fourPs.price.model}</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(fourPs.price.basePrice)}</div>
            <div className="text-sm text-slate-600 mt-1">Base price per unit</div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Discounts & Incentives</h3>
            <div className="space-y-2">
              {fourPs.price.discounts.map((discount, idx) => (
                <div key={idx} className="p-2 bg-green-50 rounded text-sm text-slate-700">
                  ✓ {discount}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Competitor Price Comparison</h3>
            <div className="space-y-3">
              {fourPs.price.competitorComparison.map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-900">{comp.name}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-slate-700">{formatCurrency(comp.price)}</div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        comp.position === 'Higher'
                          ? 'bg-red-100 text-red-700'
                          : comp.position === 'Similar'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {comp.position}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Place Section */}
      {activeP === 'place' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Distribution Channels</h3>
            <div className="space-y-3">
              {fourPs.place.channels.map((channel, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{channel.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-600">{channel.performance}% performance</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          channel.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {channel.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${channel.performance}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Regional Coverage</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {fourPs.place.coverage.map((location, idx) => (
                <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <MapPin size={16} className="text-purple-600 inline mr-2" />
                  <span className="font-medium text-slate-900">{location}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Promotion Section */}
      {activeP === 'promotion' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Core Messages</h3>
            {fourPs.promotion.messages.map((msg, idx) => (
              <div key={idx} className="p-3 bg-orange-50 rounded-lg mb-2 border border-orange-200">
                <Megaphone size={16} className="text-orange-600 inline mr-2" />
                <span className="font-medium text-slate-900">{msg}</span>
              </div>
            ))}
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Brand Tone</h3>
            <p className="text-slate-700">{fourPs.promotion.tone}</p>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Content Themes</h3>
            <div className="flex flex-wrap gap-2">
              {fourPs.promotion.themes.map((theme, idx) => (
                <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                  {theme}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="flex gap-3">
        <Button icon={Save} onClick={handleSave}>
          Save 4Ps Strategy
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.success('AI optimization generated', {
              description: 'Demo: updated recommendations for pricing + promotion alignment.',
            })
          }
        >
          <Sparkles size={16} className="mr-2" />
          Optimize with AI
        </Button>
      </div>
    </div>
  );
};
