import React, { useState } from 'react';
import { Lightbulb, Save, Sparkles, Link as LinkIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const ValueProposition: React.FC = () => {
  const [valueProp, setValueProp] = useState({
    statement: 'Premium industrial supplies at fair prices with unmatched local support',
    pain: 'Businesses struggle with unreliable suppliers, delayed deliveries, and poor after-sales service',
    differentiation: 'Same-day delivery, dedicated account managers, and 24/7 technical support',
    proof: '98% customer retention, 4.8/5 satisfaction score, 500+ testimonials',
    linkedProducts: ['Industrial Pumps', 'Solar Systems', 'Generators'],
  });

  const handleSave = () => {
    // Save to backend
    toast.success('Value proposition saved', {
      description: 'Demo: stored locally (backend hookup pending).',
    });
  };

  return (
    <div className="space-y-6">
      {/* AI Assistant Panel */}
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles size={24} className="flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-2">AI Analysis</h3>
            <p className="text-sm opacity-90 mb-3">
              Your value proposition is clear and differentiated. Consider emphasizing "local support" more 
              in rural campaigns where this is a key pain point.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-white/20 rounded text-xs">✓ Clear</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">✓ Differentiated</span>
              <span className="px-2 py-1 bg-yellow-400/30 rounded text-xs">⚠ Generic in digital</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Value Proposition Form */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="text-purple-600" size={24} />
          <h3 className="text-xl font-semibold text-slate-900">Value Proposition Builder</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Value Proposition Statement
            </label>
            <textarea
              value={valueProp.statement}
              onChange={(e) => setValueProp({ ...valueProp, statement: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="What unique value do you offer?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Customer Pain Solved
            </label>
            <textarea
              value={valueProp.pain}
              onChange={(e) => setValueProp({ ...valueProp, pain: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="What problem do you solve?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Unique Differentiation
            </label>
            <textarea
              value={valueProp.differentiation}
              onChange={(e) => setValueProp({ ...valueProp, differentiation: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="What makes you different?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Proof (Metrics, Testimonials)
            </label>
            <textarea
              value={valueProp.proof}
              onChange={(e) => setValueProp({ ...valueProp, proof: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="What evidence supports your claims?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <LinkIcon size={16} className="inline mr-1" />
              Linked Products
            </label>
            <div className="flex flex-wrap gap-2">
              {valueProp.linkedProducts.map((product, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                >
                  {product}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button icon={Save} onClick={handleSave}>
            Save Value Proposition
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.message('AI improvement suggested', {
                description: 'Emphasize local support + faster delivery for rural segments.',
              })
            }
          >
            <Sparkles size={16} className="mr-2" />
            Improve with AI
          </Button>
        </div>
      </Card>

      {/* Competitor Comparison */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Competitor Messaging Comparison</h3>
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-sm text-slate-700 mb-1">Competitor A</div>
            <div className="text-sm text-slate-600">"Leading supplier of industrial equipment"</div>
            <div className="text-xs text-red-600 mt-1">⚠ Generic, no differentiation</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-sm text-slate-700 mb-1">Competitor B</div>
            <div className="text-sm text-slate-600">"Fast delivery and competitive prices"</div>
            <div className="text-xs text-yellow-600 mt-1">⚠ Similar to your positioning</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="font-medium text-sm text-slate-700 mb-1">Your Company</div>
            <div className="text-sm text-slate-600">{valueProp.statement}</div>
            <div className="text-xs text-green-600 mt-1">✓ Differentiated with local support angle</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
