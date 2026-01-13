import React, { useState } from 'react';
import { ArrowLeft, Banknote, CheckCircle, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ValueProp {
  id: string;
  segment: string;
  customer_need: string;
  our_solution: string;
  unique_advantage: string;
  evidence: string[];
  roi_claim: string;
}

const initialProps: ValueProp[] = [
  {
    id: '1',
    segment: 'Enterprise Manufacturing',
    customer_need: 'Integrate multiple legacy systems while maintaining compliance',
    our_solution: 'Pre-built connectors for 50+ manufacturing systems with compliance templates',
    unique_advantage: 'Only platform with ISO/IEC 27001 + FDA 21 CFR Part 11 certification',
    evidence: [
      '3 Fortune 500 manufacturers migrated in 6 months',
      '99.9% uptime SLA with zero compliance violations',
      'Average 40% reduction in integration costs',
    ],
    roi_claim: '18-month ROI through reduced integration costs and faster time-to-market',
  },
  {
    id: '2',
    segment: 'Mid-Market Tech',
    customer_need: 'Scale rapidly without sacrificing team collaboration and data security',
    our_solution: 'Cloud-native platform with real-time collaboration and enterprise-grade security',
    unique_advantage: 'Scales from 10 to 10,000 users without performance degradation',
    evidence: [
      '15 tech companies scaled 5x+ on our platform',
      'SOC 2 Type II certified with zero breaches',
      'Average 60% faster feature deployment',
    ],
    roi_claim: '12-month ROI through improved team productivity and reduced security incidents',
  },
  {
    id: '3',
    segment: 'SMB Professional Services',
    customer_need: 'Simple, affordable tools that work without dedicated IT staff',
    our_solution: 'No-code platform with guided setup and 24/7 human support',
    unique_advantage: 'Only solution with 30-day money-back guarantee and free migration',
    evidence: [
      '500+ SMBs onboarded in under 1 week',
      '4.8/5 customer satisfaction score',
      'Average 25% cost savings vs competitors',
    ],
    roi_claim: '6-month ROI through reduced operational costs and improved efficiency',
  },
];

interface ValuePropositionAlignmentProps {
  onBack: () => void;
}

export const ValuePropositionAlignment: React.FC<ValuePropositionAlignmentProps> = ({ onBack }) => {
  const [valueProps, setValueProps] = useState<ValueProp[]>(initialProps);
  const [form, setForm] = useState({
    segment: '',
    customer_need: '',
    our_solution: '',
    unique_advantage: '',
    evidence: '',
    roi_claim: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.segment || !form.customer_need || !form.our_solution) return;

    const newValue: ValueProp = {
      id: crypto.randomUUID(),
      segment: form.segment,
      customer_need: form.customer_need,
      our_solution: form.our_solution,
      unique_advantage: form.unique_advantage || 'Not specified',
      evidence: form.evidence ? form.evidence.split(',').map((e) => e.trim()).filter(Boolean) : [],
      roi_claim: form.roi_claim || 'Not specified',
    };

    setValueProps((prev) => [newValue, ...prev]);
    setForm({ segment: '', customer_need: '', our_solution: '', unique_advantage: '', evidence: '', roi_claim: '' });
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="outline" icon={ArrowLeft} onClick={onBack}>
        Back to Strategy
      </Button>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-blue-600" size={20} />
            <span className="text-xs text-slate-600">Segments Covered</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{valueProps.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-xs text-slate-600">Unique Advantages</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{valueProps.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="text-purple-600" size={20} />
            <span className="text-xs text-slate-600">Evidence Points</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">9</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-orange-600" size={20} />
            <span className="text-xs text-slate-600">ROI Claims</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{valueProps.length}</div>
        </Card>
      </div>

      {/* Value Propositions */}
      <div className="space-y-4">
        {valueProps.map((prop) => (
          <Card key={prop.id} className="p-5 hover:shadow-lg transition-all">
            <div className="mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {prop.segment}
              </span>
            </div>

            <div className="space-y-4">
              {/* Customer Need */}
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="text-xs font-medium text-red-900 mb-1">Customer Need</div>
                <p className="text-sm text-red-700">{prop.customer_need}</p>
              </div>

              {/* Our Solution */}
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <div className="text-xs font-medium text-blue-900 mb-1">Our Solution</div>
                <p className="text-sm text-blue-700">{prop.our_solution}</p>
              </div>

              {/* Unique Advantage */}
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <div className="text-xs font-medium text-green-900 mb-1">Unique Advantage</div>
                <p className="text-sm text-green-700">{prop.unique_advantage}</p>
              </div>

              {/* Evidence */}
              <div>
                <div className="text-xs font-medium text-slate-700 mb-2">Supporting Evidence</div>
                <div className="space-y-2">
                  {prop.evidence.map((evidence, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                      <span className="text-sm text-slate-700">{evidence}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROI Claim */}
              <div className="p-4 bg-purple-50 rounded">
                <div className="text-xs font-medium text-purple-900 mb-1">ROI Claim</div>
                <p className="text-sm text-purple-700 font-medium">{prop.roi_claim}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Add Value Proposition</h3>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAdd}>
          <Input
            label="Segment"
            value={form.segment}
            onChange={(e) => setForm({ ...form, segment: e.target.value })}
            required
          />
          <Input
            label="Customer Need"
            value={form.customer_need}
            onChange={(e) => setForm({ ...form, customer_need: e.target.value })}
            required
          />
          <Input
            label="Our Solution"
            value={form.our_solution}
            onChange={(e) => setForm({ ...form, our_solution: e.target.value })}
            required
          />
          <Input
            label="Unique Advantage"
            value={form.unique_advantage}
            onChange={(e) => setForm({ ...form, unique_advantage: e.target.value })}
          />
          <Input
            label="Evidence (comma separated)"
            value={form.evidence}
            onChange={(e) => setForm({ ...form, evidence: e.target.value })}
          />
          <Input
            label="ROI Claim"
            value={form.roi_claim}
            onChange={(e) => setForm({ ...form, roi_claim: e.target.value })}
          />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Add Value Prop</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
