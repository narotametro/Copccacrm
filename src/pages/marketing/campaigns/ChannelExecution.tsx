import React from 'react';
import { Mail, MessageSquare, Instagram, Radio, Plus, Send, Edit } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const ChannelExecution: React.FC = () => {
  const channels = [
    { name: 'Email', icon: Mail, campaigns: 8, scheduled: 12, sent: 2450 },
    { name: 'SMS', icon: MessageSquare, campaigns: 5, scheduled: 8, sent: 1890 },
    { name: 'Social Media', icon: Instagram, campaigns: 6, scheduled: 15, sent: 145 },
    { name: 'Digital Ads', icon: Radio, campaigns: 4, scheduled: 6, sent: 892 },
  ];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => toast.message('Add channel', { description: 'Demo: open add-channel modal.' })}>Add Channel</Button>
        <Button icon={Send} variant="outline" onClick={() => toast.success('Send scheduled', { description: 'Queued for next best time.' })}>Schedule Send</Button>
        <Button icon={Edit} variant="outline" onClick={() => toast.message('Template editor', { description: 'Demo: open template editor.' })}>Edit Templates</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <Card key={channel.name}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon className="text-blue-600" size={20} />
                </div>
                <h3 className="font-semibold text-slate-900">{channel.name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Active Campaigns</span>
                  <span className="font-semibold">{channel.campaigns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Scheduled</span>
                  <span className="font-semibold">{channel.scheduled}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sent</span>
                  <span className="font-semibold">{channel.sent}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
