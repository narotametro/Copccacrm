import React from 'react';
import { Shield, Plus, RefreshCw, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

const downloadText = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const CompetitivePositioning: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => toast.message('Add competitor', { description: 'Demo: open competitor form.' })}>Add Competitor</Button>
        <Button icon={RefreshCw} variant="outline" onClick={() => toast.success('Competitive analysis updated')}>Update Analysis</Button>
        <Button
          icon={Download}
          variant="outline"
          onClick={() => {
            downloadText(
              `competitive_positioning_${new Date().toISOString().split('T')[0]}.txt`,
              'Competitive Positioning Export\n\nIncludes: positioning map, SWOT, key recommendations.\n'
            );
            toast.success('Competitive report exported');
          }}
        >
          Export Report
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Shield size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Competitive Analysis</h3>
            <p className="text-sm opacity-90">
              Competitor A dominates digital ads with 3x spend. You outperform in direct sales & trust (4.8 vs 3.9 rating). 
              Consider hybrid strategy: maintain direct sales strength while improving digital presence.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Positioning Map</h3>
          <div className="relative h-80 bg-slate-50 rounded-lg p-4">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-slate-600">High Value</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-600">Low Value</div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 -rotate-90">Low Price</div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 -rotate-90">High Price</div>
            
            {/* Plot points */}
            <div className="absolute top-1/3 left-1/2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
              You
            </div>
            <div className="absolute top-1/4 right-1/3 w-12 h-12 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
              Comp A
            </div>
            <div className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
              Comp B
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">SWOT Comparison</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-700 mb-1">Strengths</div>
              <div className="text-xs text-slate-600">Direct sales, local support, trust</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-sm font-medium text-red-700 mb-1">Weaknesses</div>
              <div className="text-xs text-slate-600">Digital presence, rural reach</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-700 mb-1">Opportunities</div>
              <div className="text-xs text-slate-600">SMS marketing, reseller network</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-sm font-medium text-yellow-700 mb-1">Threats</div>
              <div className="text-xs text-slate-600">Competitor A digital dominance</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
