import React from 'react';
import { TrendingUp, Target, Sparkles, ArrowRight, Plus, Download, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
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

export const LeadsAttribution: React.FC = () => {
  const { formatCurrency } = useCurrency();

  const sources = [
    { source: 'Direct Sales', firstTouch: 487, lastTouch: 512, revenue: 1850000, quality: 9.2 },
    { source: 'Digital Ads', firstTouch: 312, lastTouch: 198, revenue: 980000, quality: 7.1 },
    { source: 'Social Media', firstTouch: 289, lastTouch: 156, revenue: 750000, quality: 6.8 },
    { source: 'Email', firstTouch: 98, lastTouch: 245, revenue: 420000, quality: 8.5 },
    { source: 'SMS', firstTouch: 61, lastTouch: 136, revenue: 250000, quality: 8.9 },
  ];

  const conversionPaths = [
    { path: 'Social Media → Email → Direct Sales', count: 145, value: 8500000 },
    { path: 'Digital Ads → Email → Website', count: 98, value: 4200000 },
    { path: 'SMS → WhatsApp → Direct Sales', count: 67, value: 3100000 },
  ];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => toast.message('Add lead source', { description: 'Demo: add source and weight.' })}>Add Lead Source</Button>
        <Button
          icon={Download}
          variant="outline"
          onClick={() => {
            downloadText(
              `leads_attribution_${new Date().toISOString().split('T')[0]}.txt`,
              'Leads Attribution Export\n\nIncludes: source, first-touch, last-touch, revenue, quality.\n'
            );
            toast.success('Attribution data exported');
          }}
        >
          Export Data
        </Button>
        <Button
          icon={Settings}
          variant="outline"
          onClick={() => toast.message('Attribution settings', { description: 'Demo: configure model and weights.' })}
        >
          Attribution Settings
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Lead Quality Prediction</h3>
            <p className="text-sm opacity-90">
              Leads from Direct Sales have 9.2/10 quality score and 4.2% conversion rate. SMS leads 
              have higher engagement but lower volume. Consider hybrid approach for scale.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* First Touch vs Last Touch */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target size={20} className="text-blue-600" />
            First Touch vs Last Touch Attribution
          </h3>
          <div className="space-y-3">
            {sources.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{item.source}</span>
                  <span className="text-xs text-slate-600">Quality: {item.quality}/10</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-slate-600">First Touch</div>
                    <div className="font-semibold text-slate-900">{item.firstTouch} leads</div>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-slate-600">Last Touch</div>
                    <div className="font-semibold text-slate-900">{item.lastTouch} leads</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue by Source */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" />
            Revenue by Source
          </h3>
          <div className="space-y-3">
            {sources.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{item.source}</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(item.revenue)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                    style={{ width: `${(item.revenue / 1850000) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Conversion Paths */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ArrowRight size={20} className="text-purple-600" />
          Top Conversion Paths
        </h3>
        <div className="space-y-3">
          {conversionPaths.map((path, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <div className="font-medium text-slate-900">{path.path}</div>
                <div className="text-sm text-slate-600">{path.count} conversions</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-900">{formatCurrency(path.value)}</div>
                <div className="text-xs text-green-600">High value</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
