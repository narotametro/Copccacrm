import React from 'react';
import { Sparkles, Plus, Save, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

export const BudgetAllocation: React.FC = () => {
  const { formatCurrency } = useCurrency();

  const budgets = [
    { strategy: 'Enterprise Growth', budget: 2500000, spent: 2100000, roi: 3.2, status: 'on-track' },
    { strategy: 'SME Acquisition', budget: 1800000, spent: 1950000, roi: 2.1, status: 'over-budget' },
    { strategy: 'Channel Partner Program', budget: 1200000, spent: 890000, roi: 4.5, status: 'under-budget' },
    { strategy: 'Digital Presence', budget: 950000, spent: 980000, roi: 1.8, status: 'review' },
    { strategy: 'Brand Awareness', budget: 750000, spent: 620000, roi: 2.7, status: 'on-track' },
  ];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => toast.message('Add budget line', { description: 'Demo: open budget line editor.' })}>Add Budget Line</Button>
        <Button icon={Save} variant="outline" onClick={() => toast.success('Budget changes saved')}>Save Changes</Button>
        <Button icon={RefreshCw} variant="outline" onClick={() => toast.success('AI optimization applied', { description: 'Demo: suggested budget shift prepared.' })}>Optimize with AI</Button>
      </div>

      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Budget Optimization</h3>
            <p className="text-sm opacity-90">
              Shift ₦150K from Digital Presence (low ROI: 1.8x) to Channel Partner Program (high ROI: 4.5x). 
              Expected revenue increase: ₦450K.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-sm text-slate-600 mb-1">Total Budget</div>
          <div className="text-3xl font-bold text-slate-900">{formatCurrency(7200000)}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-slate-600 mb-1">Actual Spend</div>
          <div className="text-3xl font-bold text-orange-600">{formatCurrency(6540000)}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-slate-600 mb-1">Average ROI</div>
          <div className="text-3xl font-bold text-green-600">2.9x</div>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Budget by Strategy</h3>
        <div className="space-y-4">
          {budgets.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{item.strategy}</div>
                  <div className="text-sm text-slate-600">
                    {formatCurrency(item.spent)} / {formatCurrency(item.budget)} spent
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">{item.roi}x ROI</div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.status === 'on-track' ? 'bg-green-100 text-green-700' :
                    item.status === 'over-budget' ? 'bg-red-100 text-red-700' :
                    item.status === 'under-budget' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    item.spent > item.budget ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((item.spent / item.budget) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
