import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ReportStatsProps {
  reportHistory: Array<{
    id: number;
    period: string;
    createdAt: string;
    summary: any;
  }>;
}

export function ReportStats({ reportHistory }: ReportStatsProps) {
  // Ensure reportHistory is an array
  const safeHistory = Array.isArray(reportHistory) ? reportHistory : [];
  
  if (safeHistory.length === 0) return null;

  const stats = {
    totalReports: safeHistory.length,
    byPeriod: safeHistory.reduce((acc, report) => {
      acc[report.period] = (acc[report.period] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    lastReportDate: safeHistory[0]?.createdAt,
    avgCritical: Math.round(
      safeHistory.reduce((sum, r) => sum + (r.summary?.critical || 0), 0) / safeHistory.length
    ),
    avgSuccess: Math.round(
      safeHistory.reduce((sum, r) => sum + (r.summary?.success || 0), 0) / safeHistory.length
    ),
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={20} className="text-pink-500" />
        <h3 className="text-lg font-medium">Report Statistics</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-purple-600" />
            <span className="text-xs text-gray-600">Total Reports</span>
          </div>
          <div className="text-2xl font-medium text-gray-900">{stats.totalReports}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-xs text-gray-600">Avg Success</span>
          </div>
          <div className="text-2xl font-medium text-gray-900">{stats.avgSuccess}</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-xs text-gray-600">Avg Critical</span>
          </div>
          <div className="text-2xl font-medium text-gray-900">{stats.avgCritical}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-blue-600" />
            <span className="text-xs text-gray-600">Most Common</span>
          </div>
          <div className="text-sm font-medium text-gray-900 capitalize">
            {Object.entries(stats.byPeriod).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-gray-600" />
            <span className="text-xs text-gray-600">Last Report</span>
          </div>
          <div className="text-xs font-medium text-gray-900">
            {stats.lastReportDate 
              ? new Date(stats.lastReportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'N/A'
            }
          </div>
        </div>
      </div>
    </div>
  );
}
