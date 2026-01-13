import React, { useState } from 'react';
import {
  ArrowLeft,
  Lightbulb,
  Package,
  Users,
  Shield,
  DollarSign,
  Link as LinkIcon,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ValueProposition } from './strategy/ValueProposition';
import { FourPsStrategy } from './strategy/FourPsStrategy';
import { TargetPersonas } from './strategy/TargetPersonas';
import { CompetitivePositioning } from './strategy/CompetitivePositioning';
import { BudgetAllocation } from './strategy/BudgetAllocation';
import { StrategyCampaignMapping } from './strategy/StrategyCampaignMapping';

type StrategyView = 
  | 'dashboard' 
  | 'value-prop' 
  | 'four-ps' 
  | 'personas' 
  | 'positioning' 
  | 'budget' 
  | 'mapping';

const strategyCards = [
  { id: 'value-prop', label: 'Value Proposition', icon: Lightbulb, description: 'Define your unique value', color: 'bg-yellow-500' },
  { id: 'four-ps', label: '4Ps Strategy', icon: Package, description: 'Product, Price, Place, Promotion', color: 'bg-blue-500' },
  { id: 'personas', label: 'Target Personas', icon: Users, description: 'Know your ideal customers', color: 'bg-green-500' },
  { id: 'positioning', label: 'Competitive Positioning', icon: Shield, description: 'Stand out from competitors', color: 'bg-red-500' },
  { id: 'budget', label: 'Budget Allocation', icon: DollarSign, description: 'Allocate marketing spend', color: 'bg-purple-500' },
  { id: 'mapping', label: 'Strategy → Campaign Mapping', icon: LinkIcon, description: 'Link strategy to campaigns', color: 'bg-indigo-500' },
];

export const MarketingStrategy: React.FC = () => {
  const [activeView, setActiveView] = useState<StrategyView>('dashboard');

  const renderContent = () => {
    if (activeView === 'dashboard') {
      return (
        <div className="space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none p-4">
              <div className="text-xs opacity-90 mb-1">Strategy Health</div>
              <div className="text-2xl font-bold">87%</div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none p-4">
              <div className="text-xs opacity-90 mb-1">Active Personas</div>
              <div className="text-2xl font-bold">5</div>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none p-4">
              <div className="text-xs opacity-90 mb-1">Budget Allocated</div>
              <div className="text-2xl font-bold">92%</div>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none p-4">
              <div className="text-xs opacity-90 mb-1">Campaigns Linked</div>
              <div className="text-2xl font-bold">12</div>
            </Card>
          </div>

          {/* Strategy Cards Grid */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 mb-2">Strategy Areas</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {strategyCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-500"
                    onClick={() => setActiveView(card.id as StrategyView)}
                  >
                    <div className="flex flex-col items-center text-center p-3 space-y-1.5">
                      <div className={`${card.color} text-white p-2 rounded-lg`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 leading-tight">{card.label}</h3>
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">{card.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-purple-600 font-medium">
                        <span className="text-[10px]">Open</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Render subsection with back button
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
        >
          <ArrowLeft size={20} />
          <span>Back to Strategy Dashboard</span>
        </button>

        {activeView === 'value-prop' && <ValueProposition />}
        {activeView === 'four-ps' && <FourPsStrategy />}
        {activeView === 'personas' && <TargetPersonas />}
        {activeView === 'positioning' && <CompetitivePositioning />}
        {activeView === 'budget' && <BudgetAllocation />}
        {activeView === 'mapping' && <StrategyCampaignMapping />}
      </div>
    );
  };

  return (
    <div className="animate-fadeIn">
      {renderContent()}
    </div>
  );
};
