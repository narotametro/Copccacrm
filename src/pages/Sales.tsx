import React, { useState } from 'react';
import {
  Target,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { SalesStrategy } from './sales/SalesStrategy';
import { SalesPerformance } from './sales/SalesPerformance';

type SalesSection = 'strategy' | 'performance';

const sections = [
  { id: 'strategy', label: 'Sales Strategy', icon: Target, color: 'purple' },
  { id: 'performance', label: 'Sales Performance', icon: BarChart3, color: 'green' },
];

export const Sales: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SalesSection>('strategy');

  const renderSection = () => {
    switch (activeSection) {
      case 'strategy':
        return <SalesStrategy />;
      case 'performance':
        return <SalesPerformance />;
      default:
        return <SalesStrategy />;
    }
  };

  return (
    <FeatureGate feature="sales_pipeline">
      <div className="flex gap-6">
      {/* Vertical Sticky Navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-16 space-y-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Sales Strategies & Execution</h1>
          </div>
          
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id as SalesSection)}
                className={`w-full flex items-center gap-3 px-5 py-7 rounded-lg transition-all text-left min-h-[88px] ${
                  isActive
                    ? 'bg-white text-blue-600 border-2 border-blue-500 shadow-md'
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
