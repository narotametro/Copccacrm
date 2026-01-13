import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  Banknote,
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Plus,
  Download,
  Filter,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/types/database';
import { useAuthStore } from '@/store/authStore';

const downloadText = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
import { useCurrency } from '@/context/CurrencyContext';

type MarketingKpiRow = Database['public']['Tables']['marketing_kpis']['Row'];

interface KpiData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  color: string;
}

interface ChannelData {
  channel: string;
  leads: number;
  conversion: number;
  revenue: number;
}

export const MarketingOverview: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const user = useAuthStore((state) => state.user);
  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  const initialKpis = useMemo<KpiData[]>(() => ([]), [formatCurrency]);

  const initialChannels = useMemo<ChannelData[]>(() => ([]), []);

  const [kpis, setKpis] = useState(initialKpis);
  const [channelPerformance, setChannelPerformance] = useState(initialChannels);
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [kpiForm, setKpiForm] = useState({ label: '', value: '', change: '', trend: 'up', color: 'blue' });
  const [filterForm, setFilterForm] = useState({ channel: '', minConversion: '' });
  const maxLeads = channelPerformance.length ? Math.max(...channelPerformance.map((c) => c.leads)) : 1;
  const [loading, setLoading] = useState(false);

  const handleAddKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiForm.label.trim() || !kpiForm.value.trim()) {
      toast.error('Label and value are required');
      return;
    }

    const newKpiBase = {
      label: kpiForm.label.trim(),
      value: kpiForm.value.trim(),
      change: kpiForm.change.trim() || '+0%',
      trend: kpiForm.trend as 'up' | 'down',
      icon: Sparkles,
      color: kpiForm.color,
    };

    if (supabaseReady && user) {
      const { data, error } = await supabase
        .from('marketing_kpis')
        .insert({
          label: newKpiBase.label,
          value: newKpiBase.value,
          change: newKpiBase.change,
          trend: newKpiBase.trend,
          color: newKpiBase.color,
          created_by: user.id,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Failed to save KPI:', error);
        toast.error('Could not save KPI to database');
      } else if (data) {
        setKpis((prev) => [mapRowToKpi(data), ...prev]);
      }
    } else {
      setKpis((prev) => [newKpiBase, ...prev]);
    }

    setShowKpiModal(false);
    setKpiForm({ label: '', value: '', change: '', trend: 'up', color: 'blue' });
    toast.success('KPI target added');
  };

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = initialChannels.filter((item) => {
      const channelMatch = filterForm.channel.trim()
        ? item.channel.toLowerCase().includes(filterForm.channel.trim().toLowerCase())
        : true;
      const conversionMatch = filterForm.minConversion
        ? item.conversion >= Number(filterForm.minConversion)
        : true;
      return channelMatch && conversionMatch;
    });
    setChannelPerformance(filtered);
    setShowFilterModal(false);
    toast.success('Filters applied');
  };

  const resetFilters = () => {
    setFilterForm({ channel: '', minConversion: '' });
    setChannelPerformance(initialChannels);
    setShowFilterModal(false);
    toast.message('Filters cleared');
  };

  const mapRowToKpi = (row: MarketingKpiRow) => ({
    label: row.label,
    value: row.value,
    change: row.change,
    trend: row.trend,
    icon: Sparkles,
    color: row.color,
  });

  useEffect(() => {
    const loadKpis = async () => {
      if (!supabaseReady || !user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_kpis')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to load KPIs, using defaults:', error.message);
        setKpis(initialKpis);
        setLoading(false);
        return;
      }

      const mapped = (data || []).map(mapRowToKpi);
      setKpis(mapped.length ? mapped : initialKpis);
      setLoading(false);
    };

    loadKpis();
  }, [supabaseReady, initialKpis, user]);

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => setShowKpiModal(true)}>Add KPI Target</Button>
        <Button
          icon={Download}
          variant="outline"
          onClick={() => {
            downloadText(
              `marketing_overview_${new Date().toISOString().split('T')[0]}.txt`,
              'Marketing Overview Export\n\n- Leads\n- Conversion\n- ROI\n- Spend\n'
            );
            toast.success('Marketing overview exported');
          }}
        >
          Export Report
        </Button>
        <Button icon={Filter} variant="outline" onClick={() => setShowFilterModal(true)}>Filter Data</Button>
      </div>

      {supabaseReady && loading && (
        <p className="text-xs text-slate-500">Loading KPIs from database...</p>
      )}

      {/* AI Insight Strip */}
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles className="flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Marketing Insight</h3>
            <p className="text-sm opacity-90">
              Promotion spend is high, but conversion is low in rural regions. Consider SMS + reseller 
              channels. Your direct sales team outperforms digital by 37% in customer trust metrics.
            </p>
          </div>
        </div>
      </Card>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === 'up';
          
          return (
            <Card key={kpi.label} className="hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-${kpi.color}-100`}>
                  <Icon className={`text-${kpi.color}-600`} size={20} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {kpi.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{kpi.value}</div>
              <div className="text-sm text-slate-600">{kpi.label}</div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leads by Channel */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Leads by Channel
          </h3>
          <div className="space-y-3">
            {channelPerformance.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">{item.channel}</span>
                  <span className="text-slate-900 font-semibold">{item.leads} leads</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${(item.leads / maxLeads) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue by Campaign */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Banknote size={20} className="text-green-600" />
            Revenue by Channel
          </h3>
          <div className="space-y-4">
            {channelPerformance.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700 mb-1">{item.channel}</div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Conv: {item.conversion}%</span>
                    <span>•</span>
                    <span>{item.leads} leads</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    {formatCurrency(item.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Strategy vs Campaign Alignment */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Target size={20} className="text-purple-600" />
            Strategy vs Campaign Alignment Score
          </h3>
          <div className="text-2xl font-bold text-purple-600">87%</div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
            <div>
              <div className="text-sm font-medium text-slate-900">Well-Aligned</div>
              <div className="text-xs text-slate-600">12 campaigns linked to active strategies</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
            <div>
              <div className="text-sm font-medium text-slate-900">Needs Review</div>
              <div className="text-xs text-slate-600">2 campaigns without clear strategy link</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Sparkles className="text-blue-600 flex-shrink-0" size={20} />
            <div>
              <div className="text-sm font-medium text-slate-900">AI Suggestions</div>
              <div className="text-xs text-slate-600">3 optimization recommendations available</div>
            </div>
          </div>
        </div>
      </Card>
    
      {/* Add KPI Modal */}
      <Modal isOpen={showKpiModal} onClose={() => setShowKpiModal(false)} title="Add KPI Target">
        <form className="space-y-4" onSubmit={handleAddKpi}>
          <Input
            label="KPI Name"
            value={kpiForm.label}
            onChange={(e) => setKpiForm({ ...kpiForm, label: e.target.value })}
            placeholder="Pipeline Velocity"
            required
          />
          <Input
            label="Value"
            value={kpiForm.value}
            onChange={(e) => setKpiForm({ ...kpiForm, value: e.target.value })}
            placeholder="92%"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Change vs Target"
              value={kpiForm.change}
              onChange={(e) => setKpiForm({ ...kpiForm, change: e.target.value })}
              placeholder="+4%"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Trend</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                value={kpiForm.trend}
                onChange={(e) => setKpiForm({ ...kpiForm, trend: e.target.value })}
              >
                <option value="up">Up</option>
                <option value="down">Down</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              value={kpiForm.color}
              onChange={(e) => setKpiForm({ ...kpiForm, color: e.target.value })}
            >
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="orange">Orange</option>
              <option value="pink">Pink</option>
              <option value="indigo">Indigo</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowKpiModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save KPI</Button>
          </div>
        </form>
      </Modal>

      {/* Filter Modal */}
      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter Data">
        <form className="space-y-4" onSubmit={applyFilters}>
          <Input
            label="Channel contains"
            value={filterForm.channel}
            onChange={(e) => setFilterForm({ ...filterForm, channel: e.target.value })}
            placeholder="email, ads, sms"
          />
          <Input
            label="Minimum conversion (%)"
            type="number"
            value={filterForm.minConversion}
            onChange={(e) => setFilterForm({ ...filterForm, minConversion: e.target.value })}
            placeholder="3.0"
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit">Apply Filters</Button>
            <Button type="button" variant="secondary" onClick={resetFilters}>
              Clear
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
