import React from 'react';
import { FileText, Image, Video, FileType, Sparkles, Upload, Wand2, FolderPlus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const ContentAssets: React.FC = () => {
  const assets = [
    { name: 'Q1 Email Template', type: 'template', icon: FileText, uses: 12 },
    { name: 'Product Banner', type: 'image', icon: Image, uses: 8 },
    { name: 'Demo Video', type: 'video', icon: Video, uses: 15 },
    { name: 'Sales Pitch Deck', type: 'document', icon: FileType, uses: 6 },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Content Assistant</h3>
            <p className="text-sm opacity-90">
              Your email copy could improve engagement by 25% with localized language for rural segments. 
              Click "Improve Copy" to optimize.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {assets.map((asset) => {
          const Icon = asset.icon;
          return (
            <Card key={asset.name} className="hover:shadow-lg transition-all cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-slate-100 rounded-lg mb-3">
                  <Icon className="text-slate-600" size={28} />
                </div>
                <div className="font-medium text-slate-900 mb-1">{asset.name}</div>
                <div className="text-xs text-slate-600 mb-2">{asset.type}</div>
                <div className="text-xs text-green-600">{asset.uses} campaigns</div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button icon={Upload} onClick={() => toast.message('Upload asset', { description: 'Demo: open file picker.' })}>Upload Asset</Button>
        <Button icon={Wand2} variant="outline" onClick={() => toast.success('AI content generated', { description: 'Draft copy + creative created.' })}>Generate with AI</Button>
        <Button icon={FolderPlus} variant="outline" onClick={() => toast.message('Create folder', { description: 'Demo: open folder creation modal.' })}>Create Folder</Button>
      </div>
    </div>
  );
};
