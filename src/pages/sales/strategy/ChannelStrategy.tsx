import React, { useState } from 'react';
import { ArrowLeft, Banknote, Target, TrendingUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Channel {
  id: string;
  name: string;
  approach: string;
  target_segments: string[];
  key_activities: string[];
  success_metrics: {
    metric: string;
    target: string;
    current: string;
  }[];
  resources_needed: string[];
  typical_conversion: number;
}

const initialChannels: Channel[] = [
  {
    id: '1',
    name: 'Direct Enterprise Sales',
    approach: 'Field sales team with solution engineers',
    target_segments: ['Enterprise Manufacturing', 'Large Financial Services'],
    key_activities: [
      'Executive relationship building',
      'Custom solution demos',
      'Proof of concept projects',
      'Contract negotiation',
    ],
    success_metrics: [
      { metric: 'Pipeline Value', target: '$5M', current: '$4.2M' },
      { metric: 'Win Rate', target: '40%', current: '38%' },
      { metric: 'Avg Deal Size', target: '$150K', current: '$142K' },
    ],
    resources_needed: ['5 Account Executives', '3 Solution Engineers', 'Executive Sponsor Program'],
    typical_conversion: 38,
  },
  {
    id: '2',
    name: 'Partner Channel',
    approach: 'Resellers and system integrators',
    target_segments: ['Mid-Market Tech', 'Regional Manufacturing'],
    key_activities: [
      'Partner recruitment and training',
      'Co-marketing campaigns',
      'Deal registration program',
      'Partner enablement',
    ],
    success_metrics: [
      { metric: 'Active Partners', target: '25', current: '18' },
      { metric: 'Partner-sourced Revenue', target: '$2M', current: '$1.5M' },
      { metric: 'Partner Win Rate', target: '45%', current: '42%' },
    ],
    resources_needed: ['2 Partner Managers', 'Partner Portal', 'Enablement Materials'],
    typical_conversion: 42,
  },
  {
    id: '3',
    name: 'Product-Led Growth',
    approach: 'Self-service trial to paid conversion',
    target_segments: ['SMB Professional Services', 'Startups'],
    key_activities: [
      'Free trial optimization',
      'In-app guidance and tutorials',
      'Usage-based upsells',
      'Automated email nurturing',
    ],
    success_metrics: [
      { metric: 'Trial Signups', target: '500/mo', current: '420/mo' },
      { metric: 'Trial-to-Paid', target: '15%', current: '12%' },
      { metric: 'Time to First Value', target: '2 days', current: '3 days' },
    ],
    resources_needed: ['Product Manager', 'Growth Engineer', 'Customer Success'],
    typical_conversion: 12,
  },
];

interface ChannelStrategyProps {
  onBack: () => void;
}

export const ChannelStrategy: React.FC<ChannelStrategyProps> = ({ onBack }) => {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [form, setForm] = useState({
    name: '',
    approach: '',
    target_segments: '',
    key_activities: '',
    typical_conversion: '',
    resources_needed: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.approach) return;

    const newChannel: Channel = {
      id: crypto.randomUUID(),
      name: form.name,
      approach: form.approach,
      target_segments: form.target_segments ? form.target_segments.split(',').map((s) => s.trim()).filter(Boolean) : [],
      key_activities: form.key_activities ? form.key_activities.split(',').map((a) => a.trim()).filter(Boolean) : [],
      success_metrics: [],
      resources_needed: form.resources_needed ? form.resources_needed.split(',').map((r) => r.trim()).filter(Boolean) : [],
      typical_conversion: Number(form.typical_conversion) || 0,
    };

    setChannels((prev) => [newChannel, ...prev]);
    setForm({ name: '', approach: '', target_segments: '', key_activities: '', typical_conversion: '', resources_needed: '' });
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
            <span className="text-xs text-slate-600">Active Channels</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{channels.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-green-600" size={20} />
            <span className="text-xs text-slate-600">Segments Covered</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">6</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-purple-600" size={20} />
            <span className="text-xs text-slate-600">Avg Conversion</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {Math.round(channels.reduce((sum, ch) => sum + ch.typical_conversion, 0) / (channels.length || 1))}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="text-orange-600" size={20} />
            <span className="text-xs text-slate-600">Total Metrics</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">9</div>
        </Card>
      </div>

      {/* Channels */}
      <div className="space-y-4">
        {channels.map((channel) => (
          <Card key={channel.id} className="p-5 hover:shadow-lg transition-all">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{channel.name}</h3>
              <p className="text-sm text-slate-600">{channel.approach}</p>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-slate-600">Typical Conversion:</span>
                <span className="font-bold text-green-600">{channel.typical_conversion}%</span>
              </div>
            </div>

            {/* Target Segments */}
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-700 mb-2">Target Segments</div>
              <div className="flex flex-wrap gap-2">
                {channel.target_segments.map((segment, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {segment}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Activities */}
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-700 mb-2">Key Activities</div>
              <div className="grid md:grid-cols-2 gap-2">
                {channel.key_activities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-sm text-slate-700">{activity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Metrics */}
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-700 mb-2">Success Metrics</div>
              <div className="grid md:grid-cols-3 gap-3">
                {channel.success_metrics.map((metric, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded">
                    <div className="text-xs text-slate-600 mb-1">{metric.metric}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-900">{metric.current}</span>
                      <span className="text-xs text-slate-500">/ {metric.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Needed */}
            <div>
              <div className="text-xs font-medium text-slate-700 mb-2">Resources Needed</div>
              <div className="flex flex-wrap gap-2">
                {channel.resources_needed.map((resource, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                    {resource}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Add Channel</h3>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAdd}>
          <Input
            label="Channel Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Approach"
            value={form.approach}
            onChange={(e) => setForm({ ...form, approach: e.target.value })}
            required
          />
          <Input
            label="Target Segments (comma separated)"
            value={form.target_segments}
            onChange={(e) => setForm({ ...form, target_segments: e.target.value })}
          />
          <Input
            label="Key Activities (comma separated)"
            value={form.key_activities}
            onChange={(e) => setForm({ ...form, key_activities: e.target.value })}
          />
          <Input
            label="Typical Conversion (%)"
            type="number"
            value={form.typical_conversion}
            onChange={(e) => setForm({ ...form, typical_conversion: e.target.value })}
          />
          <Input
            label="Resources Needed (comma separated)"
            value={form.resources_needed}
            onChange={(e) => setForm({ ...form, resources_needed: e.target.value })}
          />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Add Channel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
