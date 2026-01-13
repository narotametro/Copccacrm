import React from 'react';
import { Zap, AlertTriangle, Bell, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const AutomationRules: React.FC = () => {
  const rules: Array<{
    name: string;
    description: string;
    status: string;
    triggered: number;
  }> = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Automation & Rules</h3>
          <p className="text-slate-600 text-sm mt-1">Intelligent automation to optimize marketing operations</p>
        </div>
        <Button icon={Plus} onClick={() => toast.message('Create rule', { description: 'Demo: opens rule builder.' })}>Create Rule</Button>
      </div>

      <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Zap size={24} />
          <div>
            <h3 className="font-semibold mb-1">Automation Impact</h3>
            <div className="grid md:grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <div className="opacity-90">Time Saved</div>
                <div className="text-2xl font-bold">18 hrs/week</div>
              </div>
              <div>
                <div className="opacity-90">Budget Optimized</div>
                <div className="text-2xl font-bold">₦950K</div>
              </div>
              <div>
                <div className="opacity-90">Actions Triggered</div>
                <div className="text-2xl font-bold">77</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {rules.map((rule, idx) => (
          <Card key={idx} className={`${rule.status === 'paused' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  {rule.status === 'active' ? (
                    <Zap size={16} className="text-green-600" />
                  ) : (
                    <AlertTriangle size={16} className="text-slate-400" />
                  )}
                  {rule.name}
                </h4>
                <p className="text-sm text-slate-600 mt-1">{rule.description}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  rule.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {rule.status}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                <Bell size={14} className="inline mr-1" />
                Triggered {rule.triggered} times
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.success(rule.status === 'active' ? 'Rule paused' : 'Rule activated', {
                    description: rule.name,
                  })
                }
              >
                {rule.status === 'active' ? 'Pause' : 'Activate'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Common Automation Examples</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-slate-900 mb-1">Campaign Triggers</div>
            <div className="text-xs text-slate-600">Auto-launch campaigns based on strategy milestones</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-slate-900 mb-1">Budget Optimization</div>
            <div className="text-xs text-slate-600">Auto-reallocate budget from low to high performers</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-sm font-medium text-slate-900 mb-1">Lead Qualification</div>
            <div className="text-xs text-slate-600">Auto-score and route leads to sales team</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-sm font-medium text-slate-900 mb-1">Performance Alerts</div>
            <div className="text-xs text-slate-600">Notify team when KPIs exceed or miss targets</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
