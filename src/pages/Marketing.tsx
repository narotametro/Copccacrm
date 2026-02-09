import React, { useState } from 'react';
import {
  LayoutDashboard,
  Target,
  Megaphone,
  Users as UsersIcon,
  BarChart3,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { MarketingOverview } from './marketing/MarketingOverview';
import { MarketingStrategy } from './marketing/MarketingStrategy';
import { MarketingCampaigns } from './marketing/MarketingCampaigns';
import { LeadsAttribution } from './marketing/LeadsAttribution';
import { MarketingAnalytics } from './marketing/MarketingAnalytics';
import { AutomationRules } from './marketing/AutomationRules';
import { FeatureGate } from '@/components/ui/FeatureGate';

type MarketingSection = 
  | 'overview' 
  | 'strategy' 
  | 'campaigns' 
  | 'leads' 
  | 'analytics' 
  | 'automation';

const sections = [
  { id: 'overview', label: 'Marketing Overview', icon: LayoutDashboard, color: 'blue' },
  { id: 'strategy', label: 'Marketing Strategy', icon: Target, color: 'purple' },
  { id: 'campaigns', label: 'Marketing Campaigns', icon: Megaphone, color: 'green' },
  { id: 'leads', label: 'Leads & Attribution', icon: UsersIcon, color: 'orange' },
  { id: 'analytics', label: 'Marketing Analytics', icon: BarChart3, color: 'pink' },
  { id: 'automation', label: 'Automation & Rules', icon: Zap, color: 'yellow' },
];

export const Marketing: React.FC = () => {
  const [activeSection, setActiveSection] = useState<MarketingSection>('overview');

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <MarketingOverview />;
      case 'strategy':
        return <MarketingStrategy />;
      case 'campaigns':
        return <MarketingCampaigns />;
      case 'leads':
        return <LeadsAttribution />;
      case 'analytics':
        return <MarketingAnalytics />;
      case 'automation':
        return <AutomationRules />;
      default:
        return <MarketingOverview />;
    }
  };

  return (
    <FeatureGate feature="marketing_campaigns">
      <div className="flex gap-6">
        {/* Vertical Sticky Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-16 space-y-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
              <p className="text-xs text-slate-600 mt-1">Strategy-first system</p>
            </div>
            
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as MarketingSection)}
                  className={`w-full flex items-center gap-3 px-5 py-5 rounded-lg transition-all text-left min-h-[72px] ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-sm font-medium leading-relaxed">{section.label}</span>
                  {isActive && <ChevronRight size={18} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Content */}
        <div className="flex-1 animate-fadeIn">
          {renderSection()}
        </div>
      </div>
    </FeatureGate>
  );
};
