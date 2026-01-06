import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  DollarSign,
  TrendingUp,
  Clock,
  User,
  Building2,
  Calendar,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';

interface DealCardProps {
  id: string;
  title: string;
  value: number;
  probability: number;
  customer?: string;
  company?: string;
  nextAction?: string;
  daysInStage: number;
  owner?: string;
  expectedCloseDate?: string;
  aiScore?: number;
}

export const DealCard: React.FC<DealCardProps> = ({
  id,
  title,
  value,
  probability,
  customer,
  company,
  nextAction,
  daysInStage,
  owner,
  expectedCloseDate,
  aiScore,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Determine priority color based on days in stage
  const getPriorityColor = () => {
    if (daysInStage > 30) return 'border-red-500 bg-red-50';
    if (daysInStage > 14) return 'border-orange-500 bg-orange-50';
    return 'border-gray-300 bg-white';
  };

  // Probability badge color
  const getProbabilityColor = () => {
    if (probability >= 70) return 'bg-green-100 text-green-700 border-green-300';
    if (probability >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white rounded-lg border-2 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 rotate-2 scale-105 z-50' : ''
      } ${getPriorityColor()}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* AI Score Badge (if available) */}
      {aiScore && aiScore > 80 && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full shadow-md">
          <Sparkles className="h-3 w-3" />
          Hot Lead
        </div>
      )}

      {/* Deal Title */}
      <h4 className="text-sm font-semibold text-gray-900 pr-6 mb-2 line-clamp-2">{title}</h4>

      {/* Customer/Company */}
      {(customer || company) && (
        <div className="flex items-center gap-2 mb-2">
          {customer && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <User className="h-3 w-3" />
              <span className="truncate">{customer}</span>
            </div>
          )}
          {company && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{company}</span>
            </div>
          )}
        </div>
      )}

      {/* Deal Value & Probability */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 text-green-600 font-bold">
          <DollarSign className="h-4 w-4" />
          <span className="text-sm">${(value / 1000).toFixed(1)}K</span>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${getProbabilityColor()}`}
        >
          <TrendingUp className="h-3 w-3" />
          {probability}%
        </div>
      </div>

      {/* Next Action */}
      {nextAction && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <strong>Next:</strong> {nextAction}
        </div>
      )}

      {/* Days in Stage & Expected Close */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
            {daysInStage} {daysInStage === 1 ? 'day' : 'days'} in stage
          </span>
        </div>
        {expectedCloseDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Owner & Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        {owner && (
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              {owner.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-600 truncate max-w-[100px]">{owner}</span>
          </div>
        )}
        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
          <MoreHorizontal className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Urgent Indicator */}
      {daysInStage > 30 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-b-lg animate-pulse" />
      )}
    </div>
  );
};
