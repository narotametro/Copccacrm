import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreVertical } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  value: number;
  probability: number;
  customer?: string;
  nextAction?: string;
  daysInStage: number;
  owner?: string;
}

interface PipelineColumnProps {
  stageId: string;
  stageName: string;
  stageColor: string;
  deals: Deal[];
  onAddDeal?: () => void;
  children: React.ReactNode;
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
  stageId,
  stageName,
  stageColor,
  deals,
  onAddDeal,
  children,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stageId,
  });

  // Calculate total value for this stage
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const avgProbability =
    deals.length > 0
      ? Math.round(deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length)
      : 0;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full min-w-[300px] rounded-xl border-2 transition-all ${
        isOver ? 'border-blue-400 bg-blue-50 shadow-lg' : 'border-gray-200 bg-gray-50'
      }`}
    >
      {/* Column Header */}
      <div className={`${stageColor} rounded-t-lg p-4 border-b-2 border-gray-300`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            {stageName}
          </h3>
          <button className="p-1 hover:bg-white/50 rounded transition-colors">
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Stage Stats */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-gray-700">{deals.length}</span>
            <span className="text-gray-600 ml-1">
              {deals.length === 1 ? 'deal' : 'deals'}
            </span>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-800">
              ${(totalValue / 1000).toFixed(1)}K
            </div>
            {deals.length > 0 && (
              <div className="text-gray-600">{avgProbability}% avg</div>
            )}
          </div>
        </div>
      </div>

      {/* Droppable Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>

        {/* Empty State */}
        {deals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 text-center">No deals in this stage</p>
            <p className="text-xs text-gray-400 mt-1">Drag deals here or add new</p>
          </div>
        )}
      </div>

      {/* Add Deal Button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onAddDeal}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Deal
        </button>
      </div>

      {/* Drop Indicator */}
      {isOver && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full border-4 border-dashed border-blue-400 rounded-xl animate-pulse" />
        </div>
      )}
    </div>
  );
};
