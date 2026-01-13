import React, { useState } from 'react';
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

  const handleSave = () => {
    toast.success('4Ps strategy saved');
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
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Product/Service Name" placeholder="e.g., Industrial Pumps" value={productForm.item} onChange={(e) => setProductForm({ ...productForm, item: e.target.value })} />
                <div className="flex items-end"><Button icon={Plus} onClick={addProductItem} className="w-full">Add Product</Button></div>
              </div>
            </div>
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
