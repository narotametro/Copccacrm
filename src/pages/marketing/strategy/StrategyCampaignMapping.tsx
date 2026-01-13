import React from 'react';
import { Link as LinkIcon, AlertTriangle, Target, Plus, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const StrategyCampaignMapping: React.FC = () => {
  const mappings = [
    { strategy: 'Enterprise Growth', campaigns: ['Enterprise Q1 Push', 'LinkedIn Ads - Enterprise'], kpis: '145 leads, 4.2% conv', status: 'active' },
    { strategy: 'SME Acquisition', campaigns: ['SME Digital Campaign', 'WhatsApp Outreach', 'Email Series'], kpis: '312 leads, 3.5% conv', status: 'active' },
    { strategy: 'Channel Partner Program', campaigns: ['Partner Recruitment Drive'], kpis: '87 leads, 5.1% conv', status: 'active' },
    { strategy: 'Digital Presence', campaigns: ['Social Media Boost', 'Google Ads Test'], kpis: '65 leads, 2.1% conv', status: 'review' },
    { strategy: 'Brand Awareness', campaigns: [], kpis: 'No campaigns yet', status: 'unmapped' },
  ];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => toast.message('Create campaign', { description: 'Demo: launch campaign builder with strategy prefilled.' })}>Create Campaign from Strategy</Button>
        <Button icon={RefreshCw} variant="outline" onClick={() => toast.success('Auto-link complete', { description: 'Demo: linked orphan campaigns to best-fit strategies.' })}>Auto-Link Campaigns</Button>
      </div>

      <Card className="bg-gradient-to-r from-red-500 to-orange-600 text-white border-none">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} />
          <div>
            <h3 className="font-semibold mb-1">Strategy Alignment Rule</h3>
            <p className="text-sm opacity-90">
              Every campaign MUST link to a strategy. 1 strategy flagged without campaigns. 
              2 orphan campaigns detected without clear strategy link.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Strategy → Campaign Mapping</h3>
        <div className="space-y-4">
          {mappings.map((item, idx) => (
            <div key={idx} className={`p-4 rounded-lg border-2 ${
              item.status === 'unmapped' ? 'border-red-200 bg-red-50' : 'border-slate-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <Target size={16} className="text-purple-600" />
                    {item.strategy}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">{item.kpis}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  item.status === 'active' ? 'bg-green-100 text-green-700' :
                  item.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {item.status}
                </span>
              </div>
              
              {item.campaigns.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.campaigns.map((campaign, i) => (
                    <div key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full text-sm">
                      <LinkIcon size={12} className="text-blue-600" />
                      <span className="text-blue-700">{campaign}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle size={16} />
                  <span>No campaigns linked - Action required</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
