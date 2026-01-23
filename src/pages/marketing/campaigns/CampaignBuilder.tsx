import React, { useState, useEffect, useCallback } from 'react';
import { Wand2, Target, Banknote, Calendar, Sparkles, Plus, ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { supabase } from '@/lib/supabase';

interface MarketingCampaignRow {
  id: string;
  name: string;
  strategy?: string;
  objective?: string;
  audience?: string;
  channels?: string[];
  budget?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at?: string;
}

export const CampaignBuilder: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [campaigns, setCampaigns] = useState<
    Array<{
      id: string;
      name: string;
      strategy: string;
      objective: string;
      audience: string;
      channels: string[];
      budget: number;
      startDate: string;
      endDate: string;
      notes: string;
    }>
  >([]);

  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  // Load campaigns from localStorage and Supabase
  const loadCampaigns = useCallback(async () => {
    try {
      // Load from localStorage first
      const saved = localStorage.getItem('copcca-campaigns');
      if (saved) {
        const localCampaigns = JSON.parse(saved);
        setCampaigns(localCampaigns);
      }

      // Load from Supabase if available
      if (supabaseReady) {
        const { data, error } = await supabase
          .from('marketing_campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase load error:', error);
        } else if (data && data.length > 0) {
          const supabaseCampaigns = data.map((campaign: MarketingCampaignRow) => ({
            id: campaign.id,
            name: campaign.name,
            strategy: campaign.strategy || 'General',
            objective: campaign.objective || 'Lead Generation',
            audience: campaign.audience || 'General audience',
            channels: campaign.channels || [],
            budget: campaign.budget || 0,
            startDate: campaign.start_date || '',
            endDate: campaign.end_date || '',
            notes: campaign.notes || 'No notes',
          }));
          setCampaigns(supabaseCampaigns);
          // Update localStorage with Supabase data
          localStorage.setItem('copcca-campaigns', JSON.stringify(supabaseCampaigns));
        }
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  }, [supabaseReady]);

  // Load campaigns on component mount
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Save campaign to localStorage and Supabase
  const saveCampaign = async (campaign: {
    id: string;
    name: string;
    strategy: string;
    objective: string;
    audience: string;
    channels: string[];
    budget: number;
    startDate: string;
    endDate: string;
    notes: string;
  }) => {
    try {
      // Save to localStorage
      const updatedCampaigns = [campaign, ...campaigns];
      setCampaigns(updatedCampaigns);
      localStorage.setItem('copcca-campaigns', JSON.stringify(updatedCampaigns));

      // Save to Supabase if available
      if (supabaseReady) {
        const { error } = await supabase
          .from('marketing_campaigns')
          .insert({
            id: campaign.id,
            name: campaign.name,
            strategy: campaign.strategy,
            objective: campaign.objective,
            audience: campaign.audience,
            channels: campaign.channels,
            budget: campaign.budget,
            start_date: campaign.startDate,
            end_date: campaign.endDate,
            notes: campaign.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Supabase save error:', error);
          toast.error('Saved locally, but failed to sync to cloud');
        } else {
          toast.success('Campaign saved to cloud');
        }
      } else {
        toast.success('Campaign saved locally');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save campaign');
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    strategy: 'SME Acquisition',
    objective: 'Lead Generation',
    audience: '',
    budget: '',
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['Email', 'SMS']);

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const getRecommendedChannels = (campaigns: Array<{
    id: string;
    name: string;
    strategy: string;
    objective: string;
    audience: string;
    channels: string[];
    budget: number;
    startDate: string;
    endDate: string;
    notes: string;
  }>) => {
    const channelCounts: Record<string, number> = {};
    campaigns.forEach(campaign => {
      campaign.channels.forEach((channel: string) => {
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      });
    });

    const sortedChannels = Object.entries(channelCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([channel]) => channel);

    return sortedChannels.length > 0 ? sortedChannels.join(', ') : 'Email, SMS, Social Media';
  };

  const getBudgetRange = (campaigns: Array<{
    id: string;
    name: string;
    strategy: string;
    objective: string;
    audience: string;
    channels: string[];
    budget: number;
    startDate: string;
    endDate: string;
    notes: string;
  }>) => {
    const budgets = campaigns.map(c => c.budget).filter(b => b > 0);
    if (budgets.length === 0) return formatCurrency(500000) + ' - ' + formatCurrency(2000000);

    const min = Math.min(...budgets);
    const max = Math.max(...budgets);

    return formatCurrency(min) + ' - ' + formatCurrency(max);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    const newCampaign = {
      id: crypto.randomUUID(),
      name: formData.name.trim(),
      strategy: formData.strategy,
      objective: formData.objective,
      audience: formData.audience.trim() || 'General audience',
      channels: selectedChannels,
      budget: Number(formData.budget) || 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      notes: formData.notes.trim() || 'No notes yet',
    };

    await saveCampaign(newCampaign);
    setFormData({
      name: '',
      strategy: 'SME Acquisition',
      objective: 'Lead Generation',
      audience: '',
      budget: '',
      startDate: '',
      endDate: '',
      notes: '',
    });
    setSelectedChannels(['Email', 'SMS']);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Campaign Assistant</h3>
            <p className="text-sm opacity-90">
              {campaigns.length > 0
                ? `You have ${campaigns.length} active campaigns. Based on your recent campaigns, recommended channels: ${getRecommendedChannels(campaigns)}. Estimated budget range: ${getBudgetRange(campaigns)}.`
                : 'Create your first campaign to get AI-powered recommendations based on your marketing data and customer insights.'
              }
            </p>
          </div>
        </div>
      </Card>

      {!showForm ? (
        <div className="text-center py-12">
          <Wand2 size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Create New Campaign</h3>
          <p className="text-slate-600 mb-6">Build data-driven campaigns linked to your marketing strategy</p>
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            Start Campaign Builder
          </Button>
        </div>
      ) : (
        <Card>
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Campaign Builder</h3>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name</label>
              <Input
                placeholder="e.g., SME Digital Campaign Q1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Target size={16} className="inline mr-1" />
                Linked Strategy (Required)
              </label>
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.strategy}
                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
              >
                <option>Enterprise Growth</option>
                <option>SME Acquisition</option>
                <option>Channel Partner Program</option>
                <option>Digital Presence</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Objective</label>
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              >
                <option>Lead Generation</option>
                <option>Brand Awareness</option>
                <option>Customer Retention</option>
                <option>Product Launch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
              <Input
                placeholder="SME Sarah, Reseller Mike"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Channels</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Email', 'SMS', 'Social Media', 'Digital Ads', 'Direct Sales', 'Events'].map((ch) => (
                  <label
                    key={ch}
                    className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                      selectedChannels.includes(ch) ? 'bg-primary-50 border-primary-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(ch)}
                      onChange={() => toggleChannel(ch)}
                    />
                    <span className="text-sm">{ch}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Banknote size={16} className="inline mr-1" />
                  Budget
                </label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-4 py-2 min-h-[90px] focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="Key messaging, offers, or target segments"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit">Create Campaign</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Recently added campaigns */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="text-primary-600" size={18} />
          <h3 className="text-lg font-semibold text-slate-900">Recent Campaigns</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {campaigns.map((c) => (
            <div key={c.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-slate-900">{c.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                  {c.objective}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-2">Linked to: {c.strategy}</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-700 mb-2">
                <span className="font-medium">Channels:</span>
                {c.channels.map((ch) => (
                  <span key={ch} className="px-2 py-0.5 rounded-full bg-white border text-slate-700">
                    {ch}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  {c.startDate || 'Start TBD'} → {c.endDate || 'End TBD'}
                </span>
                <span className="font-semibold text-slate-900">{formatCurrency(c.budget)}</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">Notes: {c.notes}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
