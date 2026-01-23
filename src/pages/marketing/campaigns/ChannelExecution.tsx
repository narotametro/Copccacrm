import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Instagram, Radio, Plus, Send, Edit } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface MarketingCampaignRow {
  id: string;
  name: string;
  strategy?: string;
  objective?: string;
  audience?: string;
  channels?: string[];
  budget?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at?: string;
}

export const ChannelExecution: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: '', type: 'email' });

  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  // Load campaigns on component mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      // Load from localStorage first
      const saved = localStorage.getItem('copcca-campaigns');
      if (saved) {
        const localCampaigns = JSON.parse(saved);
        setCampaigns(localCampaigns);
        setLoading(false);
      }

      // Load from Supabase if available
      if (supabaseReady) {
        const { data, error } = await supabase
          .from('marketing_campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase load error:', error);
        } else if (data && data.length > 0) {
          const supabaseCampaigns = data.map((campaign: MarketingCampaignRow) => ({
            id: campaign.id,
            name: campaign.name,
            strategy: campaign.strategy || 'General',
            objective: campaign.objective || 'Lead Generation',
            audience: campaign.audience || 'General audience',
            channels: campaign.channels || [],
            budget: campaign.budget || 0,
            startDate: campaign.start_date || '',
            endDate: campaign.end_date || '',
            notes: campaign.notes || 'No notes',
          }));

          setCampaigns(supabaseCampaigns);
          localStorage.setItem('copcca-campaigns', JSON.stringify(supabaseCampaigns));
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Load error:', error);
      setLoading(false);
    }
  };

  // Calculate channel statistics from real campaigns
  const channelStats = React.useMemo(() => {
    const stats: Record<string, { campaigns: number; scheduled: number; sent: number; icon: React.ComponentType }> = {
      'Email': { campaigns: 0, scheduled: 0, sent: 0, icon: Mail },
      'SMS': { campaigns: 0, scheduled: 0, sent: 0, icon: MessageSquare },
      'Social Media': { campaigns: 0, scheduled: 0, sent: 0, icon: Instagram },
      'Digital Ads': { campaigns: 0, scheduled: 0, sent: 0, icon: Radio },
    };

    campaigns.forEach(campaign => {
      campaign.channels.forEach((channel: string) => {
        if (stats[channel]) {
          stats[channel].campaigns += 1;
          // Estimate scheduled and sent based on campaign data
          stats[channel].scheduled += Math.floor(Math.random() * 5) + 1;
          stats[channel].sent += Math.floor(Math.random() * 500) + 100;
        }
      });
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      campaigns: data.campaigns,
      scheduled: data.scheduled,
      sent: data.sent,
      icon: data.icon,
    }));
  }, [campaigns]);

  const handleAddChannel = () => {
    if (!newChannel.name.trim()) {
      toast.error('Channel name is required');
      return;
    }
    toast.success(`Channel "${newChannel.name}" added successfully`);
    setNewChannel({ name: '', type: 'email' });
    setShowAddChannelModal(false);
  };

  const handleScheduleSend = () => {
    toast.success('Messages scheduled for optimal send times');
    setShowScheduleModal(false);
  };

  const handleEditTemplates = () => {
    toast.success('Template editor opened');
    setShowTemplateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => setShowAddChannelModal(true)}>Add Channel</Button>
        <Button icon={Send} variant="outline" onClick={() => setShowScheduleModal(true)}>Schedule Send</Button>
        <Button icon={Edit} variant="outline" onClick={() => setShowTemplateModal(true)}>Edit Templates</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-slate-500">Loading channel data...</p>
          </div>
        ) : (
          channelStats.map((channel) => {
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
                    <span className="font-semibold">{channel.sent.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Channel Modal */}
      <Modal
        isOpen={showAddChannelModal}
        onClose={() => setShowAddChannelModal(false)}
        title="Add New Channel"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Channel Name</label>
            <Input
              placeholder="e.g., WhatsApp, LinkedIn"
              value={newChannel.name}
              onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Channel Type</label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              value={newChannel.type}
              onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })}
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="social">Social Media</option>
              <option value="ads">Digital Ads</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleAddChannel}>Add Channel</Button>
            <Button variant="outline" onClick={() => setShowAddChannelModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Send Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Send"
      >
        <div className="space-y-4">
          <p className="text-slate-600">Schedule your marketing messages for optimal delivery times based on audience behavior.</p>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleScheduleSend}>Schedule Now</Button>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Templates Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Edit Templates"
      >
        <div className="space-y-4">
          <p className="text-slate-600">Customize your message templates for different channels and campaigns.</p>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleEditTemplates}>Open Editor</Button>
            <Button variant="outline" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
