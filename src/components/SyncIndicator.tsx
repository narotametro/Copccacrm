import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { timeAgo } from '../lib/collaboration';

interface SyncIndicatorProps {
  isRefreshing: boolean;
  lastUpdate: Date;
  hasError?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function SyncIndicator({
  isRefreshing,
  lastUpdate,
  hasError = false,
  showLabel = true,
  className = '',
}: SyncIndicatorProps) {
  if (hasError) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <WifiOff size={16} className="animate-pulse" />
        {showLabel && <span className="text-sm">Sync error</span>}
      </div>
    );
  }

  if (isRefreshing) {
    return (
      <div className={`flex items-center gap-2 text-blue-600 ${className}`}>
        <RefreshCw size={16} className="animate-spin" />
        {showLabel && <span className="text-sm">Syncing...</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-green-600 ${className}`}>
      <div className="relative">
        <Wifi size={16} />
        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      {showLabel && (
        <span className="text-sm text-gray-600">
          {timeAgo(lastUpdate)}
        </span>
      )}
    </div>
  );
}

interface CollaborationBannerProps {
  activeUsers?: number;
  isRefreshing: boolean;
  lastUpdate: Date;
  onRefresh?: () => void;
}

export function CollaborationBanner({
  activeUsers = 1,
  isRefreshing,
  lastUpdate,
  onRefresh,
}: CollaborationBannerProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">
            <strong className="text-gray-900">{activeUsers}</strong>
            <span className="text-gray-600"> team {activeUsers === 1 ? 'member' : 'members'} active</span>
          </span>
        </div>
        <div className="w-px h-4 bg-gray-300"></div>
        <SyncIndicator 
          isRefreshing={isRefreshing} 
          lastUpdate={lastUpdate}
          showLabel={true}
        />
      </div>
      
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      )}
    </div>
  );
}

interface TeamPresenceProps {
  teamMembers: Array<{
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  }>;
  maxDisplay?: number;
}

export function TeamPresence({ teamMembers, maxDisplay = 5 }: TeamPresenceProps) {
  const displayMembers = teamMembers.slice(0, maxDisplay);
  const remainingCount = Math.max(0, teamMembers.length - maxDisplay);

  if (teamMembers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Team online:</span>
      <div className="flex -space-x-2">
        {displayMembers.map((member) => (
          <div
            key={member.id}
            className="relative w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 border-2 border-white flex items-center justify-center text-white text-xs"
            title={member.name}
          >
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{member.name.charAt(0).toUpperCase()}</span>
            )}
            {member.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-xs">
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}
