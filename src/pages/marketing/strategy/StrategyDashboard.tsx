import React from 'react';
import {
  Target,
  Brain,
  Users,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const StrategyDashboard: React.FC = () => {
  const aiInsights = {
    strengths: [
      'Strong value proposition in enterprise segment',
      'Pricing competitive with premium positioning',
      'Direct sales channel outperforms competitors',
    ],
    risks: [
      'Digital presence weaker than Competitor A',
      'Rural market penetration below target',
      'Promotion budget allocation misaligned with conversion data',
    ],
    gaps: [
      'Competitor B dominates social media engagement',
      'Missing WhatsApp Business channel',
      'No loyalty program vs competitors',
    ],
    recommendations: [
      'Shift 15% budget from digital ads to SMS campaigns',
      'Launch reseller program for rural expansion',
      'Strengthen value messaging in digital channels',
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
          <div className="flex items-center gap-3 mb-3">
            <Target size={24} />
            <span className="text-sm opacity-90">Primary Objective</span>
          </div>
          <div className="text-2xl font-bold">Growth</div>
          <div className="text-sm opacity-90 mt-1">+35% Revenue Target</div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none">
          <div className="flex items-center gap-3 mb-3">
            <Brain size={24} />
            <span className="text-sm opacity-90">Value Proposition</span>
          </div>
          <div className="text-lg font-bold">Active</div>
          <div className="text-sm opacity-90 mt-1">Premium quality at fair prices</div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none">
          <div className="flex items-center gap-3 mb-3">
            <Users size={24} />
            <span className="text-sm opacity-90">Target Segments</span>
          </div>
          <div className="text-2xl font-bold">5</div>
          <div className="text-sm opacity-90 mt-1">Active personas</div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={24} />
            <span className="text-sm opacity-90">Competitive Advantage</span>
          </div>
          <div className="text-2xl font-bold">78%</div>
          <div className="text-sm opacity-90 mt-1">AI Score</div>
        </Card>
      </div>

      {/* Strategy Health Card */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={28} />
            <div>
              <h3 className="text-xl font-bold">Strategy Health Score</h3>
              <p className="text-sm opacity-90">AI-calculated overall effectiveness</p>
            </div>
          </div>
          <div className="text-5xl font-bold">87%</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">92%</div>
            <div className="text-xs opacity-90 mt-1">Alignment</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">85%</div>
            <div className="text-xs opacity-90 mt-1">Execution</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">81%</div>
            <div className="text-xs opacity-90 mt-1">ROI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">90%</div>
            <div className="text-xs opacity-90 mt-1">Differentiation</div>
          </div>
        </div>
      </Card>

      {/* AI Insights Panel */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Strengths & Risks */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              Strengths
            </h3>
            <ul className="space-y-2">
              {aiInsights.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" size={20} />
              Risks
            </h3>
            <ul className="space-y-2">
              {aiInsights.risks.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Gaps & Recommendations */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              Gaps vs Competitors
            </h3>
            <ul className="space-y-2">
              {aiInsights.gaps.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="text-purple-600" size={20} />
              AI Recommendations
            </h3>
            <ul className="space-y-2">
              {aiInsights.recommendations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="text-purple-500 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
