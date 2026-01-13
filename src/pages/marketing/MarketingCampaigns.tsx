import React, { useState } from 'react';
import {
  LayoutDashboard,
  Wand2,
  Radio,
  FileText,
  CheckSquare,
  BarChart3,
} from 'lucide-react';
import { CampaignDashboard } from './campaigns/CampaignDashboard';
import { CampaignBuilder } from './campaigns/CampaignBuilder';
import { ChannelExecution } from './campaigns/ChannelExecution';
import { ContentAssets } from './campaigns/ContentAssets';
import { CampaignTasks } from './campaigns/CampaignTasks';
import { CampaignPerformance } from './campaigns/CampaignPerformance';

type CampaignTab = 'dashboard' | 'builder' | 'channels' | 'content' | 'tasks' | 'performance';

const tabs = [
  { id: 'dashboard', label: 'Campaign Dashboard', icon: LayoutDashboard },
  { id: 'builder', label: 'Campaign Builder', icon: Wand2 },
  { id: 'channels', label: 'Channel Execution', icon: Radio },
  { id: 'content', label: 'Content & Assets', icon: FileText },
  { id: 'tasks', label: 'Campaign Tasks', icon: CheckSquare },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
];

export const MarketingCampaigns: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CampaignTab>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CampaignDashboard />;
      case 'builder':
        return <CampaignBuilder />;
      case 'channels':
        return <ChannelExecution />;
      case 'content':
        return <ContentAssets />;
      case 'tasks':
        return <CampaignTasks />;
      case 'performance':
        return <CampaignPerformance />;
      default:
        return <CampaignDashboard />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Horizontal Tabs Navigation */}
      <div className="sticky top-16 z-10 bg-white border-b border-slate-200 pb-2 -mx-6 px-6">
        <div className="flex gap-3 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CampaignTab)}
                className={`flex items-center gap-1.5 px-2 pb-2 whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'border-green-600 text-green-600 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={16} />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Body */}
      <div className="animate-fadeIn">{renderContent()}</div>
    </div>
  );
};
