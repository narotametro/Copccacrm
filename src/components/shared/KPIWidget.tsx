/**
 * KPI Widget Component
 * Reusable card for displaying key performance indicators
 */

import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPIWidgetProps {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color: 'green' | 'blue' | 'orange' | 'purple' | 'red';
  onClick?: () => void;
}

const colorStyles = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'text-green-600',
    border: 'border-green-200',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    icon: 'text-orange-600',
    border: 'border-orange-200',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'text-purple-600',
    border: 'border-purple-200',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: 'text-red-600',
    border: 'border-red-200',
  },
};

export function KPIWidget({ title, value, change, trend, icon: Icon, color, onClick }: KPIWidgetProps) {
  const styles = colorStyles[color];
  const isPositive = change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border ${styles.border} p-6 hover:shadow-lg transition cursor-pointer group`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          
          {/* Change Indicator */}
          <div className="flex items-center gap-1 mt-3">
            <TrendIcon className={`w-4 h-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{change}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        {/* Icon */}
        <div className={`${styles.bg} p-3 rounded-lg group-hover:scale-110 transition`}>
          <Icon className={`w-6 h-6 ${styles.icon}`} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${styles.bg} ${styles.text} transition-all duration-500`}
          style={{ width: `${Math.min(Math.abs(change) * 10, 100)}%` }}
        />
      </div>
    </div>
  );
}
