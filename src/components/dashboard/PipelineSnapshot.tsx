import React from 'react';
import { ArrowRight, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  daysInStage: number;
}

interface PipelineSnapshotProps {
  deals?: Deal[];
}

const stages = [
  { id: 'lead', name: 'Leads', color: 'bg-gray-100 border-gray-300' },
  { id: 'qualified', name: 'Qualified', color: 'bg-blue-100 border-blue-300' },
  { id: 'proposal', name: 'Proposal', color: 'bg-purple-100 border-purple-300' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-100 border-orange-300' },
  { id: 'won', name: 'Won', color: 'bg-green-100 border-green-300' },
];

export const PipelineSnapshot: React.FC<PipelineSnapshotProps> = ({ deals = [] }) => {
  const navigate = useNavigate();

  // Group deals by stage
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => deal.stage === stage.id);
    return acc;
  }, {} as Record<string, Deal[]>);

  // Calculate total value per stage
  const stageValues = Object.entries(dealsByStage).reduce((acc, [stageId, stageDeals]) => {
    acc[stageId] = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
    return acc;
  }, {} as Record<string, number>);

  const totalPipelineValue = Object.values(stageValues).reduce((sum, val) => sum + val, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pipeline Overview</h3>
          <p className="text-sm text-gray-500 mt-1">Mini snapshot of your sales funnel</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.pipeline.path)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          View Full Pipeline
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Pipeline Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            ${(totalPipelineValue / 1000).toFixed(1)}K
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Active Deals</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{deals.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Avg. Cycle</span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {deals.length > 0
              ? Math.round(deals.reduce((sum, d) => sum + d.daysInStage, 0) / deals.length)
              : 0}d
          </p>
        </div>
      </div>

      {/* Mini Kanban Board */}
      <div className="grid grid-cols-5 gap-3">
        {stages.map(stage => {
          const stageDeals = dealsByStage[stage.id] || [];
          const stageValue = stageValues[stage.id] || 0;

          return (
            <div key={stage.id} className="space-y-2">
              {/* Stage Header */}
              <div className={`${stage.color} rounded-lg p-2 border`}>
                <h4 className="text-xs font-semibold text-gray-700">{stage.name}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-600">{stageDeals.length} deals</span>
                  <span className="text-[10px] font-medium text-gray-700">
                    ${(stageValue / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>

              {/* Mini Deal Cards (show max 3) */}
              <div className="space-y-1.5">
                {stageDeals.slice(0, 3).map(deal => (
                  <div
                    key={deal.id}
                    className="bg-white border border-gray-200 rounded-md p-2 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    <p className="text-[11px] font-medium text-gray-900 truncate">
                      {deal.title}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-600">
                        ${(deal.value / 1000).toFixed(1)}K
                      </span>
                      <span className="text-[10px] text-green-600 font-medium">
                        {deal.probability}%
                      </span>
                    </div>
                  </div>
                ))}

                {/* Show count if more deals */}
                {stageDeals.length > 3 && (
                  <div className="text-center py-1">
                    <span className="text-[10px] text-gray-500">
                      +{stageDeals.length - 3} more
                    </span>
                  </div>
                )}

                {/* Empty state */}
                {stageDeals.length === 0 && (
                  <div className="text-center py-3">
                    <span className="text-[10px] text-gray-400">No deals</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            🎯 <strong>{dealsByStage['negotiation']?.length || 0}</strong> deals in negotiation
            <span className="mx-2">•</span>
            🔥 <strong>{dealsByStage['proposal']?.length || 0}</strong> proposals pending
          </p>
          <button
            onClick={() => navigate('/deals/new')}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            + Add Deal
          </button>
        </div>
      </div>
    </div>
  );
};
