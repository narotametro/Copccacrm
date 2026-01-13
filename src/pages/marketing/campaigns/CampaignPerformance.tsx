import React from 'react';
import { TrendingUp, Users, Banknote, Target, Sparkles, Download, Calendar, RefreshCw } from 'lucide-react';
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

export const CampaignPerformance: React.FC = () => {
  const { formatCurrency } = useCurrency();

  const campaigns = [
    { name: 'Enterprise Q1 Push', leads: 145, revenue: 8500000, roi: 3.2, conversion: 4.2, engagement: 8.5 },
    { name: 'SME Digital Campaign', leads: 312, revenue: 4200000, roi: 2.1, conversion: 3.5, engagement: 6.8 },
    { name: 'WhatsApp Outreach', leads: 189, revenue: 3100000, roi: 3.8, conversion: 4.8, engagement: 9.2 },
    { name: 'LinkedIn Ads', leads: 87, revenue: 2100000, roi: 4.5, conversion: 5.1, engagement: 7.4 },
  ];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          icon={Download}
          onClick={() => {
            downloadText(
              `campaign_performance_${new Date().toISOString().split('T')[0]}.txt`,
              'Campaign Performance Export\n\nIncludes: leads, revenue, ROI, conversion, engagement.\n'
            );
            toast.success('Performance report exported');
          }}
        >
          Export Report
        </Button>
        <Button
          icon={Calendar}
          variant="outline"
          onClick={() => toast.message('Date range', { description: 'Demo: open date range picker.' })}
        >
          Date Range
        </Button>
        <Button
          icon={RefreshCw}
          variant="outline"
          onClick={() => toast.success('Performance data refreshed')}
        >
          Refresh Data
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Performance Insight</h3>
            <p className="text-sm opacity-90">
              SMS campaigns outperform social media by 37% for this segment. WhatsApp Outreach has 
              highest engagement (9.2/10). Consider shifting budget from low performers.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="text-center">
          <Users className="text-blue-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-slate-900">733</div>
          <div className="text-sm text-slate-600">Total Leads</div>
        </Card>
        <Card className="text-center">
          <Target className="text-purple-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-slate-900">4.1%</div>
          <div className="text-sm text-slate-600">Avg Conversion</div>
        </Card>
        <Card className="text-center">
          <Banknote className="text-green-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(17900000)}</div>
          <div className="text-sm text-slate-600">Total Revenue</div>
        </Card>
        <Card className="text-center">
          <TrendingUp className="text-orange-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-slate-900">3.4x</div>
          <div className="text-sm text-slate-600">Avg ROI</div>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Campaign Performance Breakdown</h3>
        <div className="space-y-4">
          {campaigns.map((campaign, idx) => (
            <div key={idx} className="pb-4 border-b border-slate-200 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900">{campaign.name}</h4>
                <span className="text-lg font-bold text-green-600">{campaign.roi}x ROI</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-slate-600">Leads</div>
                  <div className="font-semibold text-slate-900">{campaign.leads}</div>
                </div>
                <div>
                  <div className="text-slate-600">Revenue</div>
                  <div className="font-semibold text-slate-900">{formatCurrency(campaign.revenue)}</div>
                </div>
                <div>
                  <div className="text-slate-600">Conversion</div>
                  <div className="font-semibold text-slate-900">{campaign.conversion}%</div>
                </div>
                <div>
                  <div className="text-slate-600">Engagement</div>
                  <div className="font-semibold text-slate-900">{campaign.engagement}/10</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
