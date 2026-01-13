import React from 'react';
import { Megaphone, TrendingUp, Banknote, Users, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

export const CampaignDashboard: React.FC = () => {
  const { formatCurrency } = useCurrency();

  const kpiColorStyles: Record<string, { bg: string; icon: string }> = {
    green: { bg: 'bg-green-100', icon: 'text-green-600' },
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
    orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
    pink: { bg: 'bg-pink-100', icon: 'text-pink-600' },
  };

  const kpis = [
    { label: 'Active Campaigns', value: '14', icon: Megaphone, color: 'green' },
    { label: 'Total Leads', value: '1,247', icon: Users, color: 'blue' },
    { label: 'Conversion Rate', value: '3.8%', icon: TrendingUp, color: 'purple' },
    { label: 'Total Cost', value: formatCurrency(6540000), icon: Banknote, color: 'orange' },
    { label: 'Revenue Generated', value: formatCurrency(18970000), icon: Target, color: 'pink' },
    { label: 'ROI', value: '2.9x', icon: TrendingUp, color: 'green' },
  ];

  const campaigns = [
    { name: 'Enterprise Q1 Push', status: 'active', leads: 145, budget: 2100000, roi: 3.2, endDate: '2026-03-31' },
    { name: 'SME Digital Campaign', status: 'active', leads: 312, budget: 1950000, roi: 2.1, endDate: '2026-02-28' },
    { name: 'LinkedIn Ads - Enterprise', status: 'active', leads: 87, budget: 890000, roi: 4.5, endDate: '2026-02-15' },
    { name: 'WhatsApp Outreach', status: 'active', leads: 189, budget: 450000, roi: 3.8, endDate: '2026-03-10' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const styles = kpiColorStyles[kpi.color] ?? { bg: 'bg-slate-100', icon: 'text-slate-600' };
          // Last 2 items (Revenue Generated and ROI) span 2 columns each
          const spanClass = index >= 4 ? 'md:col-span-2' : '';
          return (
            <Card key={kpi.label} className={spanClass}>
              <div className={`p-2 rounded-lg ${styles.bg} w-fit mb-2`}>
                <Icon className={styles.icon} size={20} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="text-sm text-slate-600">{kpi.label}</div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Campaign Timeline</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.message('Calendar view', { description: 'Demo: open campaign calendar.' })}
          >
            View Calendar
          </Button>
        </div>
        <div className="space-y-3">
          {campaigns.map((campaign, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium text-slate-900">{campaign.name}</div>
                <div className="text-sm text-slate-600">Ends: {campaign.endDate}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">{campaign.leads} leads</div>
                <div className="text-xs text-green-600">{campaign.roi}x ROI</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
