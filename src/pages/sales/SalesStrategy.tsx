import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Lightbulb,
  DollarSign,
  Radio,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { TargetSegments } from './strategy/TargetSegments';
import { ValuePropositionAlignment } from './strategy/ValuePropositionAlignment';
import { PricingLogic } from './strategy/PricingLogic';
import { ChannelStrategy } from './strategy/ChannelStrategy';
import { CompetitiveDealPositioning } from './strategy/CompetitiveDealPositioning';

const strategyCards = [
  { id: 'segments', label: 'Target Segments', icon: Users, description: 'Define ideal customer segments', color: 'bg-blue-500' },
  { id: 'value-prop', label: 'Value Proposition', icon: Lightbulb, description: 'Align value to customer needs', color: 'bg-yellow-500' },
  { id: 'pricing', label: 'Pricing Logic', icon: DollarSign, description: 'Pricing strategy & discounts', color: 'bg-green-500' },
  { id: 'channels', label: 'Channel Strategy', icon: Radio, description: 'Sales channels & approach', color: 'bg-purple-500' },
  { id: 'positioning', label: 'Competitive Positioning', icon: Shield, description: 'Win against competitors', color: 'bg-red-500' },
 ] as const;

type StrategyView = 'dashboard' | (typeof strategyCards)[number]['id'];

export const SalesStrategy: React.FC = () => {
  const [activeView, setActiveView] = useState<StrategyView>('dashboard');

  const renderContent = () => {
    if (activeView === 'dashboard') {
      return (
        <div className="space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none p-4">
              <div className="text-xs opacity-90 mb-1">Target Segments</div>
              <div className="text-2xl font-bold">8</div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none p-4">
              <div className="text-xs opacity-90 mb-1">Active Channels</div>
              <div className="text-2xl font-bold">5</div>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none p-4">
              <div className="text-xs opacity-90 mb-1">Avg Win Rate</div>
              <div className="text-2xl font-bold">68%</div>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none p-4">
              <div className="text-xs opacity-90 mb-1">Strategy Score</div>
              <div className="text-2xl font-bold">85%</div>
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
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-500"
                    onClick={() => setActiveView(card.id)}
                  >
                    <div className="flex flex-col items-center text-center p-3 space-y-1.5">
                      <div className={`${card.color} text-white p-2 rounded-lg`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 leading-tight">{card.label}</h3>
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">{card.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 font-medium">
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
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft size={20} />
          <span>Back to Sales Strategy</span>
        </button>

        {activeView === 'segments' && <TargetSegments onBack={() => setActiveView('dashboard')} />}
        {activeView === 'value-prop' && <ValuePropositionAlignment onBack={() => setActiveView('dashboard')} />}
        {activeView === 'pricing' && <PricingLogic onBack={() => setActiveView('dashboard')} />}
        {activeView === 'channels' && <ChannelStrategy onBack={() => setActiveView('dashboard')} />}
        {activeView === 'positioning' && <CompetitiveDealPositioning onBack={() => setActiveView('dashboard')} />}
      </div>
    );
  };

  return (
    <div className="animate-fadeIn">
      {renderContent()}
    </div>
  );
};
