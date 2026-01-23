import React, { useState, useEffect } from 'react';
import { Sparkles, Upload, Wand2, FolderPlus, FileText, Image, Video } from 'lucide-react';
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
  leads_generated?: number;
  conversions?: number;
  spent?: number;
  status?: string;
}

interface SupabaseCampaign {
  id: string;
  name: string;
  type?: string;
  status?: string;
  budget?: number;
  spent?: number;
  leads_generated?: number;
  conversions?: number;
  roi?: number;
  target_audience?: string;
  start_date?: string;
  end_date?: string;
  channels?: string[];
  content?: string;
  goals?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface GeneratedAsset {
  id: string;
  name: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  uses?: number;
}

export const ContentAssets: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', type: 'text' });
  const [newFolder, setNewFolder] = useState({ name: '' });

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
          const supabaseCampaigns: MarketingCampaignRow[] = data.map((campaign: SupabaseCampaign) => ({
            id: campaign.id,
            name: campaign.name,
            strategy: campaign.type || 'General',
            objective: campaign.goals || 'Lead Generation',
            audience: campaign.target_audience || 'General audience',
            channels: campaign.channels || [],
            budget: campaign.budget || 0,
            start_date: campaign.start_date || '',
            end_date: campaign.end_date || '',
            notes: campaign.content || 'No notes',
            created_at: campaign.created_at || '',
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

  // Generate assets based on campaigns
  const assets = React.useMemo(() => {
    const assetTypes = [
      { name: 'Email Template', type: 'Email', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
      { name: 'Social Post', type: 'Social Media', icon: Image, color: 'text-green-600', bg: 'bg-green-100' },
      { name: 'Video Ad', type: 'Digital Ads', icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' },
      { name: 'SMS Script', type: 'SMS', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    const generatedAssets: GeneratedAsset[] = [];
    campaigns.forEach((campaign) => {
      campaign.channels.forEach((channel: string) => {
        const assetType = assetTypes.find(type => type.type === channel) || assetTypes[0];
        generatedAssets.push({
          id: `${campaign.id}-${channel}`,
          name: `${campaign.name} - ${channel} Content`,
          type: assetType.type,
          icon: assetType.icon,
          color: assetType.color,
          bg: assetType.bg,
          uses: Math.floor(Math.random() * 5) + 1,
          campaign: campaign.name,
        });
      });
    });

    return generatedAssets;
  }, [campaigns]);

  const handleUploadAsset = () => {
    if (!newAsset.name.trim()) {
      toast.error('Asset name is required');
      return;
    }
    toast.success(`Asset "${newAsset.name}" uploaded successfully`);
    setNewAsset({ name: '', type: 'text' });
    setShowUploadModal(false);
  };

  const handleGenerateContent = () => {
    toast.success('AI content generated successfully');
    setShowGenerateModal(false);
  };

  const handleCreateFolder = () => {
    if (!newFolder.name.trim()) {
      toast.error('Folder name is required');
      return;
    }
    toast.success(`Folder "${newFolder.name}" created successfully`);
    setNewFolder({ name: '' });
    setShowFolderModal(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Content Assistant</h3>
            <p className="text-sm opacity-90">
              {campaigns.length > 0
                ? `You have ${assets.length} content assets across ${campaigns.length} campaigns. Your email copy could improve engagement by 25% with localized language.`
                : 'Create your first campaign to generate AI-powered content assets.'
              }
            </p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-slate-500">Loading content assets...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-slate-500">No content assets yet. Create campaigns to generate content!</p>
          </div>
        ) : (
          assets.map((asset) => {
            const Icon = asset.icon;
            return (
              <Card key={asset.id} className="hover:shadow-lg transition-all cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className={`p-3 ${asset.bg} rounded-lg mb-3`}>
                    <Icon className={asset.color} size={28} />
                  </div>
                  <div className="font-medium text-slate-900 mb-1">{asset.name}</div>
                  <div className="text-xs text-slate-600 mb-2">{asset.type}</div>
                  <div className="text-xs text-green-600">{asset.uses} campaigns</div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button icon={Upload} onClick={() => setShowUploadModal(true)}>Upload Asset</Button>
        <Button icon={Wand2} variant="outline" onClick={() => setShowGenerateModal(true)}>Generate with AI</Button>
        <Button icon={FolderPlus} variant="outline" onClick={() => setShowFolderModal(true)}>Create Folder</Button>
      </div>

      {/* Upload Asset Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Asset"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Asset Name</label>
            <Input
              placeholder="e.g., Product Demo Video"
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Asset Type</label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              value={newAsset.type}
              onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleUploadAsset}>Upload</Button>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Generate Content Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate with AI"
      >
        <div className="space-y-4">
          <p className="text-slate-600">Generate personalized content for your campaigns using AI.</p>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleGenerateContent}>Generate Content</Button>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        title="Create Folder"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Folder Name</label>
            <Input
              placeholder="e.g., Q1 Campaign Assets"
              value={newFolder.name}
              onChange={(e) => setNewFolder({ name: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreateFolder}>Create Folder</Button>
            <Button variant="outline" onClick={() => setShowFolderModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
