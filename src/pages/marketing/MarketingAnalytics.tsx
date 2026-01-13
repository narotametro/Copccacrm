import React, { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, XCircle, Download, RefreshCw, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

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

export const MarketingAnalytics: React.FC = () => {
  const [budgets, setBudgets] = useState<
    Array<{ id: string; channel: string; monthly_budget: number; target_leads: number; target_roi: number }>
  >([]);
  const [form, setForm] = useState({ channel: '', monthly_budget: '', target_leads: '', target_roi: '' });

  const totalBudget = useMemo(
    () => budgets.reduce((sum, b) => sum + b.monthly_budget, 0),
    [budgets]
  );

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.channel.trim()) {
      toast.error('Channel is required');
      return;
    }

    const newEntry = {
      id: crypto.randomUUID(),
      channel: form.channel.trim(),
      monthly_budget: Number(form.monthly_budget) || 0,
      target_leads: Number(form.target_leads) || 0,
      target_roi: Number(form.target_roi) || 0,
    };
    setBudgets((prev) => [newEntry, ...prev]);
    toast.success('Targets saved (demo only)');
    setForm({ channel: '', monthly_budget: '', target_leads: '', target_roi: '' });
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={RefreshCw} onClick={() => toast.success('AI analysis refreshed')}>Refresh AI Analysis</Button>
        <Button
          icon={Download}
          variant="outline"
          onClick={() => {
            downloadText(
              `marketing_intelligence_${new Date().toISOString().split('T')[0]}.txt`,
              'Marketing Intelligence Export\n\nStop/Scale/Fix recommendations + competitor insights.\n'
            );
            toast.success('Marketing intelligence exported');
          }}
        >
          Export Report
        </Button>
        <Button
          icon={Settings}
          variant="outline"
          onClick={() => toast.message('Configure metrics', { description: 'Demo: choose KPI set + thresholds.' })}
        >
          Configure Metrics
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-pink-500 to-rose-600 text-white border-none">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 size={28} />
          <h3 className="text-xl font-semibold">AI Marketing Intelligence</h3>
        </div>
        <div className="text-sm opacity-90">
          Comprehensive AI analysis of your marketing performance with actionable recommendations
        </div>
      </Card>

      {/* Budget & Targets (demo) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Budget & targets (demo)</h3>
            <p className="text-sm text-slate-600">Capture monthly budget, lead targets, and ROI goals per channel</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-600">Total budget</p>
            <p className="text-lg font-bold text-slate-900">₦{totalBudget.toLocaleString()}</p>
          </div>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4" onSubmit={handleAddBudget}>
          <Input
            label="Channel"
            placeholder="Email, SMS, Ads"
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value })}
            required
          />
          <Input
            label="Monthly Budget"
            type="number"
            value={form.monthly_budget}
            onChange={(e) => setForm({ ...form, monthly_budget: e.target.value })}
            placeholder="1200000"
          />
          <Input
            label="Target Leads"
            type="number"
            value={form.target_leads}
            onChange={(e) => setForm({ ...form, target_leads: e.target.value })}
            placeholder="300"
          />
          <Input
            label="Target ROI (x)"
            type="number"
            value={form.target_roi}
            onChange={(e) => setForm({ ...form, target_roi: e.target.value })}
            placeholder="4.0"
          />
          <div className="flex items-end justify-end">
            <Button type="submit">Save target</Button>
          </div>
        </form>

        <div className="grid md:grid-cols-3 gap-3">
          {budgets.map((b) => (
            <div key={b.id} className="p-3 border rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-slate-900">{b.channel}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">Target</span>
              </div>
              <p className="text-sm text-slate-600">Budget: ₦{b.monthly_budget.toLocaleString()}</p>
              <p className="text-sm text-slate-600">Leads: {b.target_leads}</p>
              <p className="text-sm text-slate-600">ROI goal: {b.target_roi}x</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* What to Stop */}
        <Card className="bg-red-50 border-red-200">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <XCircle className="text-red-600" size={20} />
            What to Stop
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-red-600">✗</span>
              <span>Digital Ads in rural regions (1.2% conversion, below 2% threshold)</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-red-600">✗</span>
              <span>Generic social media posts (0.8% engagement vs 3.2% industry avg)</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-red-600">✗</span>
              <span>Sunday email campaigns (42% lower open rates)</span>
            </li>
          </ul>
        </Card>

        {/* What to Scale */}
        <Card className="bg-green-50 border-green-200">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} />
            What to Scale
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-green-600">↑</span>
              <span>SMS campaigns (6.2% conversion, 4.5x ROI - double budget)</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-green-600">↑</span>
              <span>Direct sales in enterprise segment (4.2% conversion, best quality)</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-green-600">↑</span>
              <span>Tuesday 10am emails (40% higher open rates)</span>
            </li>
          </ul>
        </Card>

        {/* What to Fix */}
        <Card className="bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="text-yellow-600" size={20} />
            What to Fix
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-yellow-600">⚠</span>
              <span>Localize messaging for rural segments (generic copy underperforming)</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-yellow-600">⚠</span>
              <span>Add video content (2x engagement vs images)</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-yellow-600">⚠</span>
              <span>Improve mobile landing pages (57% bounce rate vs 32% desktop)</span>
            </li>
          </ul>
        </Card>

        {/* Competitor Intelligence */}
        <Card className="bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="text-blue-600" size={20} />
            What Competitors Do Better
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-blue-600">→</span>
              <span>Competitor A: 3x social media ad spend, better digital presence</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-blue-600">→</span>
              <span>Competitor B: WhatsApp Business channel (you don't have)</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-blue-600">→</span>
              <span>Industry: Loyalty programs (72% have, you don't)</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Performance Dashboards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <h4 className="text-sm font-medium text-slate-600 mb-2">Strategy Performance</h4>
          <div className="text-3xl font-bold text-green-600">87%</div>
          <div className="text-xs text-slate-600 mt-1">Above target</div>
        </Card>
        <Card className="text-center">
          <h4 className="text-sm font-medium text-slate-600 mb-2">Campaign Performance</h4>
          <div className="text-3xl font-bold text-blue-600">92%</div>
          <div className="text-xs text-slate-600 mt-1">Exceeding goals</div>
        </Card>
        <Card className="text-center">
          <h4 className="text-sm font-medium text-slate-600 mb-2">Customer Response</h4>
          <div className="text-3xl font-bold text-purple-600">78%</div>
          <div className="text-xs text-slate-600 mt-1">Positive sentiment</div>
        </Card>
      </div>
    </div>
  );
};
