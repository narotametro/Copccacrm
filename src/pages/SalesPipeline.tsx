/**
 * Sales Pipeline Page - Visual Kanban Board
 * Drag-and-drop deal management with AI insights
 */

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { salesAPI, type Deal, type DealStage } from '@/services/salesAPI';
import { PipelineColumn } from '@/components/pipeline/PipelineColumn';
import { DealCard } from '@/components/pipeline/DealCard';
import { Plus, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STAGES: { id: DealStage; name: string; color: string }[] = [
  { id: 'lead', name: 'Lead', color: 'purple' },
  { id: 'qualified', name: 'Qualified', color: 'blue' },
  { id: 'proposal', name: 'Proposal', color: 'yellow' },
  { id: 'negotiation', name: 'Negotiation', color: 'orange' },
  { id: 'won', name: 'Won', color: 'green' },
];

export function SalesPipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPipeline, setSelectedPipeline] = useState('sales');

  useEffect(() => {
    loadDeals();
  }, [selectedPipeline]);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const data = await salesAPI.getAll(selectedPipeline);
      setDeals(data);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const dealId = active.id as string;
    const newStage = over.id as DealStage;

    try {
      await salesAPI.moveToStage(dealId, newStage);
      
      // Update local state
      setDeals((prevDeals) =>
        prevDeals.map((deal) =>
          deal.id === dealId ? { ...deal, stage: newStage } : deal
        )
      );
    } catch (error) {
      console.error('Failed to move deal:', error);
    }
  };

  const getDealsByStage = (stage: DealStage) => {
    return deals.filter((deal) => deal.stage === stage);
  };

  const getStageValue = (stage: DealStage) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + deal.value, 0);
  };

  return (
    <div className="p-6 space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600 mt-1">Manage your deals visually</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-pink-600 hover:bg-pink-700">
            <Plus className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Selector */}
      <div className="flex gap-2">
        {['Sales', 'Renewals', 'Debt Recovery'].map((pipeline) => (
          <button
            key={pipeline}
            onClick={() => setSelectedPipeline(pipeline.toLowerCase())}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedPipeline === pipeline.toLowerCase()
                ? 'bg-pink-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {pipeline}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ height: 'calc(100vh - 280px)' }}>
          {STAGES.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            const stageValue = getStageValue(stage.id);

            return (
              <PipelineColumn
                key={stage.id}
                id={stage.id}
                title={stage.name}
                count={stageDeals.length}
                value={stageValue}
                color={stage.color}
              >
                {stageDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </PipelineColumn>
            );
          })}
        </div>
      </DndContext>

      {/* Pipeline Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Pipeline Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Deals</p>
            <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">
              ${(deals.reduce((sum, deal) => sum + deal.value, 0) / 1000).toFixed(1)}K
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Deal Size</p>
            <p className="text-2xl font-bold text-gray-900">
              ${deals.length > 0 ? (deals.reduce((sum, deal) => sum + deal.value, 0) / deals.length / 1000).toFixed(1) : 0}K
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Win Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {deals.length > 0 ? ((getDealsByStage('won').length / deals.length) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
