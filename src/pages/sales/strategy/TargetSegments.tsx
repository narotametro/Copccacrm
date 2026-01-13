import React, { useState } from 'react';
import { ArrowLeft, Banknote, Target, TrendingUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { Input } from '@/components/ui/Input';

interface Segment {
  id: string;
  name: string;
  size: string;
  annual_value: number;
  growth_rate: number;
  pain_points: string[];
  buying_behavior: string;
  decision_makers: string[];
  avg_deal_size: number;
  sales_cycle: string;
}

const initialSegments: Segment[] = [];

interface TargetSegmentsProps {
  onBack: () => void;
}

export const TargetSegments: React.FC<TargetSegmentsProps> = ({ onBack }) => {
  const { formatCurrency } = useCurrency();
  const [segments, setSegments] = useState<Segment[]>(initialSegments);
  const [form, setForm] = useState({
    name: '',
    size: '',
    annual_value: '',
    growth_rate: '',
    buying_behavior: '',
    avg_deal_size: '',
    sales_cycle: '',
    pain_points: '',
    decision_makers: '',
  });

  const totalValue = segments.reduce((sum, seg) => sum + seg.annual_value, 0);
  const avgGrowth = Math.round(
    segments.reduce((sum, seg) => sum + seg.growth_rate, 0) / segments.length
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.size || !form.annual_value || !form.growth_rate) return;

    const newSegment: Segment = {
      id: crypto.randomUUID(),
      name: form.name,
      size: form.size,
      annual_value: Number(form.annual_value) || 0,
      growth_rate: Number(form.growth_rate) || 0,
      pain_points: form.pain_points ? form.pain_points.split(',').map((p) => p.trim()).filter(Boolean) : [],
      buying_behavior: form.buying_behavior || 'Not specified',
      decision_makers: form.decision_makers ? form.decision_makers.split(',').map((d) => d.trim()).filter(Boolean) : [],
      avg_deal_size: Number(form.avg_deal_size) || 0,
      sales_cycle: form.sales_cycle || 'Not specified',
    };

    setSegments((prev) => [newSegment, ...prev]);
    setForm({
      name: '',
      size: '',
      annual_value: '',
      growth_rate: '',
      buying_behavior: '',
      avg_deal_size: '',
      sales_cycle: '',
      pain_points: '',
      decision_makers: '',
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
            <Users className="text-blue-600" size={20} />
            <span className="text-xs text-slate-600">Total Segments</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{segments.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="text-green-600" size={20} />
            <span className="text-xs text-slate-600">Total Annual Value</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-purple-600" size={20} />
            <span className="text-xs text-slate-600">Avg Growth Rate</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgGrowth}%</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-orange-600" size={20} />
            <span className="text-xs text-slate-600">Active Campaigns</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">12</div>
        </Card>
      </div>

      {/* Segments */}
      <div className="space-y-4">
        {segments.map((segment) => (
          <Card key={segment.id} className="p-5 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{segment.name}</h3>
                <p className="text-sm text-slate-600">{segment.size}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(segment.annual_value)}
                </div>
                <div className="text-xs text-slate-600">Annual Value</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Key Metrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Growth Rate</span>
                  <span className="font-bold text-green-600">+{segment.growth_rate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Avg Deal Size</span>
                  <span className="font-medium text-slate-900">{formatCurrency(segment.avg_deal_size)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Sales Cycle</span>
                  <span className="font-medium text-slate-900">{segment.sales_cycle}</span>
                </div>
              </div>

              {/* Buying Behavior */}
              <div>
                <div className="text-xs font-medium text-slate-700 mb-2">Buying Behavior</div>
                <p className="text-sm text-slate-600">{segment.buying_behavior}</p>
              </div>
            </div>

            {/* Pain Points */}
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-700 mb-2">Key Pain Points</div>
              <div className="grid md:grid-cols-3 gap-2">
                {segment.pain_points.map((pain, idx) => (
                  <div key={idx} className="px-3 py-2 bg-red-50 rounded text-xs text-red-700">
                    {pain}
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Makers */}
            <div>
              <div className="text-xs font-medium text-slate-700 mb-2">Key Decision Makers</div>
              <div className="flex flex-wrap gap-2">
                {segment.decision_makers.map((dm, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {dm}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Add Segment</h3>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAdd}>
          <Input
            label="Segment Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Size"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            placeholder="e.g. 100-500 employees"
            required
          />
          <Input
            label="Annual Value"
            type="number"
            value={form.annual_value}
            onChange={(e) => setForm({ ...form, annual_value: e.target.value })}
            required
          />
          <Input
            label="Growth Rate (%)"
            type="number"
            value={form.growth_rate}
            onChange={(e) => setForm({ ...form, growth_rate: e.target.value })}
            required
          />
          <Input
            label="Avg Deal Size"
            type="number"
            value={form.avg_deal_size}
            onChange={(e) => setForm({ ...form, avg_deal_size: e.target.value })}
          />
          <Input
            label="Sales Cycle"
            value={form.sales_cycle}
            onChange={(e) => setForm({ ...form, sales_cycle: e.target.value })}
            placeholder="e.g. 2-4 months"
          />
          <Input
            label="Buying Behavior"
            value={form.buying_behavior}
            onChange={(e) => setForm({ ...form, buying_behavior: e.target.value })}
          />
          <Input
            label="Pain Points (comma separated)"
            value={form.pain_points}
            onChange={(e) => setForm({ ...form, pain_points: e.target.value })}
          />
          <Input
            label="Decision Makers (comma separated)"
            value={form.decision_makers}
            onChange={(e) => setForm({ ...form, decision_makers: e.target.value })}
          />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Add Segment</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
