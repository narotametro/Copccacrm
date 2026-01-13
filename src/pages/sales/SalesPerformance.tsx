import React, { useMemo, useState } from 'react';
import {
  Users,
  Banknote,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  Brain,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCurrency } from '@/context/CurrencyContext';

interface SalesRep {
  id: string;
  name: string;
  deals_won: number;
  deals_lost: number;
  conversion_rate: number;
  revenue: number;
  target: number;
  avg_deal_size: number;
  avg_cycle_days: number;
}

interface WinLossReason {
  reason: string;
  percentage: number;
  ai_insight: string;
}

const initialReps: SalesRep[] = [];

const initialWinReasons: WinLossReason[] = [];

const initialLossReasons: WinLossReason[] = [];

export const SalesPerformance: React.FC = () => {
  const { formatCurrency } = useCurrency();

  const [reps, setReps] = useState<SalesRep[]>(initialReps);
  const [winReasons, setWinReasons] = useState<WinLossReason[]>(initialWinReasons);
  const [lossReasons, setLossReasons] = useState<WinLossReason[]>(initialLossReasons);

  const [repForm, setRepForm] = useState({
    name: '',
    deals_won: '',
    deals_lost: '',
    conversion_rate: '',
    revenue: '',
    target: '',
    avg_deal_size: '',
    avg_cycle_days: '',
  });

  const [winForm, setWinForm] = useState({ reason: '', percentage: '', ai_insight: '' });
  const [lossForm, setLossForm] = useState({ reason: '', percentage: '', ai_insight: '' });

  const totalRevenue = useMemo(() => reps.reduce((sum, rep) => sum + rep.revenue, 0), [reps]);
  const totalTarget = useMemo(() => reps.reduce((sum, rep) => sum + rep.target, 0), [reps]);
  const targetAchievement = totalTarget ? Math.round((totalRevenue / totalTarget) * 100) : 0;
  const avgConversion = reps.length
    ? Math.round(reps.reduce((sum, rep) => sum + rep.conversion_rate, 0) / reps.length)
    : 0;
  const avgCycle = reps.length
    ? Math.round(reps.reduce((sum, rep) => sum + rep.avg_cycle_days, 0) / reps.length)
    : 0;

  const handleAddRep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repForm.name.trim()) return;

    const newRep: SalesRep = {
      id: crypto.randomUUID(),
      name: repForm.name.trim(),
      deals_won: Number(repForm.deals_won) || 0,
      deals_lost: Number(repForm.deals_lost) || 0,
      conversion_rate: Number(repForm.conversion_rate) || 0,
      revenue: Number(repForm.revenue) || 0,
      target: Number(repForm.target) || 0,
      avg_deal_size: Number(repForm.avg_deal_size) || 0,
      avg_cycle_days: Number(repForm.avg_cycle_days) || 0,
    };

    setReps((prev) => [newRep, ...prev]);
    setRepForm({
      name: '',
      deals_won: '',
      deals_lost: '',
      conversion_rate: '',
      revenue: '',
      target: '',
      avg_deal_size: '',
      avg_cycle_days: '',
    });
  };

  const handleAddWinReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!winForm.reason.trim()) return;

    setWinReasons((prev) => [
      {
        reason: winForm.reason.trim(),
        percentage: Number(winForm.percentage) || 0,
        ai_insight: winForm.ai_insight.trim() || 'No insight yet',
      },
      ...prev,
    ]);
    setWinForm({ reason: '', percentage: '', ai_insight: '' });
  };

  const handleAddLossReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lossForm.reason.trim()) return;

    setLossReasons((prev) => [
      {
        reason: lossForm.reason.trim(),
        percentage: Number(lossForm.percentage) || 0,
        ai_insight: lossForm.ai_insight.trim() || 'No insight yet',
      },
      ...prev,
    ]);
    setLossForm({ reason: '', percentage: '', ai_insight: '' });
  };

  return (
    <div className="space-y-4">
      {/* Performance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="text-green-600" size={20} />
            <span className="text-xs text-slate-600">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-blue-600" size={20} />
            <span className="text-xs text-slate-600">Target Achievement</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{targetAchievement}%</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-purple-600" size={20} />
            <span className="text-xs text-slate-600">Avg Conversion</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgConversion}%</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-orange-600" size={20} />
            <span className="text-xs text-slate-600">Avg Sales Cycle</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgCycle} days</div>
        </Card>
      </div>

      {/* Sales Rep Performance */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-blue-600" size={22} />
          <h3 className="text-lg font-bold text-slate-900">Sales Rep Performance</h3>
        </div>
        <div className="space-y-4">
          {reps.map((rep) => {
            const targetProgress = Math.round((rep.revenue / rep.target) * 100);
            return (
              <div key={rep.id} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{rep.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-600">
                      <span>Won: {rep.deals_won}</span>
                      <span>Lost: {rep.deals_lost}</span>
                      <span>Conversion: {rep.conversion_rate}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">{formatCurrency(rep.revenue)}</div>
                    <div className="text-xs text-slate-600">of {formatCurrency(rep.target)}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">Target Progress</span>
                    <span
                      className={`text-xs font-bold ${
                        targetProgress >= 100
                          ? 'text-green-600'
                          : targetProgress >= 80
                            ? 'text-blue-600'
                            : targetProgress >= 60
                              ? 'text-orange-600'
                              : 'text-red-600'
                      }`}
                    >
                      {targetProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        targetProgress >= 100
                          ? 'bg-green-500'
                          : targetProgress >= 80
                            ? 'bg-blue-500'
                            : targetProgress >= 60
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(targetProgress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Award className="text-blue-600" size={14} />
                    <span className="text-slate-600">Avg Deal:</span>
                    <span className="font-medium text-slate-900">{formatCurrency(rep.avg_deal_size)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="text-purple-600" size={14} />
                    <span className="text-slate-600">Avg Cycle:</span>
                    <span className="font-medium text-slate-900">{rep.avg_cycle_days} days</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Win/Loss Analysis */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Win Reasons */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-green-600" size={22} />
            <h3 className="text-lg font-bold text-slate-900">Top Win Reasons</h3>
          </div>
          <div className="space-y-4">
            {winReasons.map((reason, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{reason.reason}</span>
                  <span className="text-xs font-bold text-green-600">{reason.percentage}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${reason.percentage}%` }} />
                </div>
                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                  <Brain className="text-blue-600 flex-shrink-0" size={14} />
                  <span className="text-xs text-blue-700">{reason.ai_insight}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Loss Reasons */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="text-red-600" size={22} />
            <h3 className="text-lg font-bold text-slate-900">Top Loss Reasons</h3>
          </div>
          <div className="space-y-4">
            {lossReasons.map((reason, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{reason.reason}</span>
                  <span className="text-xs font-bold text-red-600">{reason.percentage}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${reason.percentage}%` }} />
                </div>
                <div className="flex items-start gap-2 p-2 bg-orange-50 rounded">
                  <AlertCircle className="text-orange-600 flex-shrink-0" size={14} />
                  <span className="text-xs text-orange-700">{reason.ai_insight}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Data Entry Forms */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-lg font-bold text-slate-900 mb-3">Add Sales Rep (demo)</h3>
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleAddRep}>
            <Input
              label="Name"
              value={repForm.name}
              onChange={(e) => setRepForm({ ...repForm, name: e.target.value })}
              required
            />
            <Input
              label="Deals Won"
              type="number"
              value={repForm.deals_won}
              onChange={(e) => setRepForm({ ...repForm, deals_won: e.target.value })}
            />
            <Input
              label="Deals Lost"
              type="number"
              value={repForm.deals_lost}
              onChange={(e) => setRepForm({ ...repForm, deals_lost: e.target.value })}
            />
            <Input
              label="Conversion Rate %"
              type="number"
              value={repForm.conversion_rate}
              onChange={(e) => setRepForm({ ...repForm, conversion_rate: e.target.value })}
            />
            <Input
              label="Revenue"
              type="number"
              value={repForm.revenue}
              onChange={(e) => setRepForm({ ...repForm, revenue: e.target.value })}
            />
            <Input
              label="Target"
              type="number"
              value={repForm.target}
              onChange={(e) => setRepForm({ ...repForm, target: e.target.value })}
            />
            <Input
              label="Avg Deal Size"
              type="number"
              value={repForm.avg_deal_size}
              onChange={(e) => setRepForm({ ...repForm, avg_deal_size: e.target.value })}
            />
            <Input
              label="Avg Cycle Days"
              type="number"
              value={repForm.avg_cycle_days}
              onChange={(e) => setRepForm({ ...repForm, avg_cycle_days: e.target.value })}
            />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">Add Rep</Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Add Win Reason (demo)</h3>
            <form className="space-y-3" onSubmit={handleAddWinReason}>
              <Input
                label="Reason"
                value={winForm.reason}
                onChange={(e) => setWinForm({ ...winForm, reason: e.target.value })}
                required
              />
              <Input
                label="Percentage"
                type="number"
                value={winForm.percentage}
                onChange={(e) => setWinForm({ ...winForm, percentage: e.target.value })}
              />
              <Input
                label="AI Insight"
                value={winForm.ai_insight}
                onChange={(e) => setWinForm({ ...winForm, ai_insight: e.target.value })}
              />
              <div className="flex justify-end">
                <Button type="submit">Add Win Reason</Button>
              </div>
            </form>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Add Loss Reason (demo)</h3>
            <form className="space-y-3" onSubmit={handleAddLossReason}>
              <Input
                label="Reason"
                value={lossForm.reason}
                onChange={(e) => setLossForm({ ...lossForm, reason: e.target.value })}
                required
              />
              <Input
                label="Percentage"
                type="number"
                value={lossForm.percentage}
                onChange={(e) => setLossForm({ ...lossForm, percentage: e.target.value })}
              />
              <Input
                label="AI Insight"
                value={lossForm.ai_insight}
                onChange={(e) => setLossForm({ ...lossForm, ai_insight: e.target.value })}
              />
              <div className="flex justify-end">
                <Button type="submit">Add Loss Reason</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
