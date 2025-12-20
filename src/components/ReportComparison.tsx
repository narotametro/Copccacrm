import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonProps {
  current: number;
  previous: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

export function MetricComparison({ current, previous, label, suffix = '', prefix = '' }: ComparisonProps) {
  const difference = current - previous;
  const percentChange = previous !== 0 ? ((difference / previous) * 100) : 0;
  const isPositive = difference > 0;
  const isNeutral = difference === 0;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-medium text-gray-900">
            {prefix}{current.toLocaleString()}{suffix}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Previous: {prefix}{previous.toLocaleString()}{suffix}
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm ${
          isNeutral ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isNeutral ? (
            <Minus size={16} />
          ) : isPositive ? (
            <TrendingUp size={16} />
          ) : (
            <TrendingDown size={16} />
          )}
          <span className="font-medium">
            {isNeutral ? '0' : Math.abs(percentChange).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

interface ReportComparisonProps {
  currentSummary: {
    total: number;
    critical: number;
    warning: number;
    success: number;
    actionable: number;
  };
  previousSummary: {
    total: number;
    critical: number;
    warning: number;
    success: number;
    actionable: number;
  };
}

export function ReportComparison({ currentSummary, previousSummary }: ReportComparisonProps) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-purple-600" />
        <h3 className="text-lg font-medium text-gray-900">Performance Comparison</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricComparison
          current={currentSummary.total}
          previous={previousSummary.total}
          label="Total Insights"
        />
        <MetricComparison
          current={currentSummary.success}
          previous={previousSummary.success}
          label="Positive"
        />
        <MetricComparison
          current={currentSummary.warning}
          previous={previousSummary.warning}
          label="Warnings"
        />
        <MetricComparison
          current={currentSummary.critical}
          previous={previousSummary.critical}
          label="Critical"
        />
        <MetricComparison
          current={currentSummary.actionable}
          previous={previousSummary.actionable}
          label="Need Action"
        />
      </div>
    </div>
  );
}
