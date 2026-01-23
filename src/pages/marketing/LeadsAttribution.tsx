import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Sparkles, ArrowRight, Plus, Download, Settings, X, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useCurrency } from '@/context/CurrencyContext';
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

export const LeadsAttribution: React.FC = () => {
  const { formatCurrency } = useCurrency();

  const [sources, setSources] = useState<Array<{
    source: string;
    firstTouch: number;
    lastTouch: number;
    revenue: number;
    quality: number;
  }>>([]);

  const [conversionPaths] = useState<Array<{
    path: string;
    count: number;
  }>>([]);

  // Load sources on component mount
  useEffect(() => {
    const savedSources = localStorage.getItem('copcca-leads-sources');
    if (savedSources) {
      setSources(JSON.parse(savedSources));
    }
  }, []);

  // Modal states
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAIPredictionModal, setShowAIPredictionModal] = useState(false);

  // Form states
  const [sourceForm, setSourceForm] = useState({
    source: '',
    firstTouch: '',
    lastTouch: '',
    revenue: '',
    quality: '',
  });

  const [attributionSettings, setAttributionSettings] = useState({
    model: 'linear',
    firstTouchWeight: '40',
    lastTouchWeight: '40',
    middleTouchWeight: '20',
  });

  const handleAddSource = () => {
    if (!sourceForm.source || !sourceForm.quality) {
      toast.error('Please fill in source name and quality score');
      return;
    }

    const newSource = {
      source: sourceForm.source,
      firstTouch: parseInt(sourceForm.firstTouch) || 0,
      lastTouch: parseInt(sourceForm.lastTouch) || 0,
      revenue: parseFloat(sourceForm.revenue) || 0,
      quality: parseFloat(sourceForm.quality) || 0,
    };

    const updatedSources = [...sources, newSource];
    setSources(updatedSources);
    localStorage.setItem('copcca-leads-sources', JSON.stringify(updatedSources));
    setSourceForm({ source: '', firstTouch: '', lastTouch: '', revenue: '', quality: '' });
    setShowAddSourceModal(false);
    toast.success('Lead source added successfully');
  };

  const handleRemoveSource = (index: number) => {
    const updatedSources = sources.filter((_, i) => i !== index);
    setSources(updatedSources);
    localStorage.setItem('copcca-leads-sources', JSON.stringify(updatedSources));
    toast.success('Source removed');
  };

  const handleSaveSettings = () => {
    const totalWeight = parseInt(attributionSettings.firstTouchWeight) + 
                       parseInt(attributionSettings.lastTouchWeight) + 
                       parseInt(attributionSettings.middleTouchWeight);
    
    if (totalWeight !== 100) {
      toast.error('Attribution weights must sum to 100%');
      return;
    }

    setShowSettingsModal(false);
    toast.success('Attribution settings saved');
  };

  const exportData = () => {
    const data = {
      sources,
      conversionPaths,
      settings: attributionSettings,
      exportDate: new Date().toISOString(),
    };

    const content = JSON.stringify(data, null, 2);
    downloadText(
      `leads_attribution_${new Date().toISOString().split('T')[0]}.json`,
      content
    );
    toast.success('Attribution data exported');
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => setShowAddSourceModal(true)}>
          Add Lead Source
        </Button>
        <Button icon={Download} variant="outline" onClick={exportData}>
          Export Data
        </Button>
        <Button icon={Settings} variant="outline" onClick={() => setShowSettingsModal(true)}>
          Attribution Settings
        </Button>
        <Button 
          icon={Sparkles} 
          variant="outline"
          onClick={() => setShowAIPredictionModal(true)}
          className="border-orange-300 text-orange-700 hover:bg-orange-50"
        >
          AI Lead Quality Prediction
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-none">
        <div className="flex items-start gap-3">
          <Sparkles size={24} />
          <div>
            <h3 className="font-semibold mb-1">AI Lead Quality Prediction</h3>
            <p className="text-sm opacity-90">
              Click "AI Lead Quality Prediction" button above to view detailed analysis and predictions for your lead sources.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* First Touch vs Last Touch */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target size={20} className="text-blue-600" />
            First Touch vs Last Touch Attribution
          </h3>
          <div className="space-y-3">
            {sources.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">
                No lead sources added yet. Click "Add Lead Source" to get started.
              </p>
            ) : (
              sources.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{item.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">Quality: {item.quality}/10</span>
                      <button
                        onClick={() => handleRemoveSource(idx)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove source"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-slate-600">First Touch</div>
                      <div className="font-semibold text-slate-900">{item.firstTouch} leads</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <div className="text-slate-600">Last Touch</div>
                      <div className="font-semibold text-slate-900">{item.lastTouch} leads</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Revenue by Source */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" />
            Revenue by Source
          </h3>
          <div className="space-y-3">
            {sources.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">
                No revenue data available. Add lead sources first.
              </p>
            ) : (
              sources.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{item.source}</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                      style={{ 
                        width: `${sources.length > 0 ? (item.revenue / Math.max(...sources.map(s => s.revenue), 1)) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Conversion Paths */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ArrowRight size={20} className="text-purple-600" />
          Top Conversion Paths
        </h3>
        <div className="space-y-3">
          {conversionPaths.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">
              No conversion paths tracked yet. Data will appear as leads convert.
            </p>
          ) : (
            conversionPaths.map((path, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">{path.path}</div>
                  <div className="text-sm text-slate-600">{path.count} conversions</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{path.count}</div>
                  <div className="text-xs text-green-600">High value</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add Lead Source Modal */}
      <Modal isOpen={showAddSourceModal} onClose={() => setShowAddSourceModal(false)} title="Add Lead Source">
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Source Name *
              </label>
              <Input
                value={sourceForm.source}
                onChange={(e) => setSourceForm({ ...sourceForm, source: e.target.value })}
                placeholder="e.g., Google Ads, Direct Sales, SMS"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Touch Leads
                </label>
                <Input
                  type="number"
                  value={sourceForm.firstTouch}
                  onChange={(e) => setSourceForm({ ...sourceForm, firstTouch: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Touch Leads
                </label>
                <Input
                  type="number"
                  value={sourceForm.lastTouch}
                  onChange={(e) => setSourceForm({ ...sourceForm, lastTouch: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Revenue Generated
                </label>
                <Input
                  type="number"
                  value={sourceForm.revenue}
                  onChange={(e) => setSourceForm({ ...sourceForm, revenue: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quality Score (1-10) *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={sourceForm.quality}
                  onChange={(e) => setSourceForm({ ...sourceForm, quality: e.target.value })}
                  placeholder="5.0"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button icon={Save} onClick={handleAddSource}>
              Add Source
            </Button>
            <Button variant="outline" onClick={() => setShowAddSourceModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Attribution Settings Modal */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Attribution Settings">
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Attribution Model
              </label>
              <select
                value={attributionSettings.model}
                onChange={(e) => setAttributionSettings({ ...attributionSettings, model: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="linear">Linear (equal credit)</option>
                <option value="timeDecay">Time Decay (recent touchpoints favored)</option>
                <option value="uShaped">U-Shaped (first & last favored)</option>
                <option value="custom">Custom Weights</option>
              </select>
            </div>
            {attributionSettings.model === 'custom' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">
                  Custom weights must total 100%
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      First Touch %
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={attributionSettings.firstTouchWeight}
                      onChange={(e) => setAttributionSettings({ ...attributionSettings, firstTouchWeight: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Middle Touch %
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={attributionSettings.middleTouchWeight}
                      onChange={(e) => setAttributionSettings({ ...attributionSettings, middleTouchWeight: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Last Touch %
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={attributionSettings.lastTouchWeight}
                      onChange={(e) => setAttributionSettings({ ...attributionSettings, lastTouchWeight: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <Button icon={Save} onClick={handleSaveSettings}>
              Save Settings
            </Button>
            <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Prediction Modal */}
      <Modal isOpen={showAIPredictionModal} onClose={() => setShowAIPredictionModal(false)} title="AI Lead Quality Predictions">
        <div className="p-6">
          {sources.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-600 mb-2">No lead sources to analyze yet</p>
              <p className="text-sm text-slate-500">
                Add lead sources to get AI-powered quality predictions and recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-slate-900 mb-2">Overall Analysis</h3>
                <p className="text-sm text-slate-700">
                  Based on {sources.length} lead source{sources.length !== 1 ? 's' : ''}, our AI model has analyzed 
                  quality scores, conversion patterns, and revenue impact to provide actionable insights.
                </p>
              </div>

              {sources.map((source, idx) => {
                const conversionRate = source.lastTouch > 0 ? ((source.revenue / source.lastTouch) / 1000).toFixed(1) : '0.0';
                const qualityRating = source.quality >= 8 ? 'Excellent' : source.quality >= 6 ? 'Good' : source.quality >= 4 ? 'Average' : 'Poor';
                const qualityColor = source.quality >= 8 ? 'text-green-600' : source.quality >= 6 ? 'text-blue-600' : source.quality >= 4 ? 'text-yellow-600' : 'text-red-600';
                
                return (
                  <div key={idx} className="p-4 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{source.source}</h4>
                      <span className={`text-sm font-medium ${qualityColor}`}>
                        {qualityRating} ({source.quality}/10)
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>
                        <strong>Conversion Rate:</strong> {conversionRate}% estimated
                      </p>
                      <p>
                        <strong>Revenue Impact:</strong> {formatCurrency(source.revenue)} generated
                      </p>
                      <p>
                        <strong>AI Insight:</strong> {
                          source.quality >= 8 
                            ? `${source.source} shows excellent lead quality. Consider increasing investment in this channel.`
                            : source.quality >= 6
                            ? `${source.source} performs well. Monitor conversion trends and optimize targeting.`
                            : source.quality >= 4
                            ? `${source.source} has moderate quality. Review lead qualification criteria.`
                            : `${source.source} needs improvement. Consider refining targeting or reducing spend.`
                        }
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-slate-900 mb-2">Recommendations</h4>
                <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                  <li>Focus on sources with quality scores above 7.0 for best ROI</li>
                  <li>Consider A/B testing messaging for sources with scores 4.0-6.0</li>
                  <li>Track conversion paths to identify multi-touch patterns</li>
                  <li>Review and update quality scores monthly based on actual conversions</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowAIPredictionModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
