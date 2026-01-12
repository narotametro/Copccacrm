import React, { useState } from 'react';
import { BarChart3, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export const KPITracking: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  const kpis = [
    { name: 'Monthly Revenue', value: '$125K', target: '$150K', progress: 83, trend: '+12%' },
    { name: 'New Customers', value: '45', target: '50', progress: 90, trend: '+8%' },
    { name: 'Conversion Rate', value: '28%', target: '30%', progress: 93, trend: '+5%' },
    { name: 'Customer Satisfaction', value: '4.5', target: '4.8', progress: 94, trend: '+2%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">KPI Tracking</h1>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>Add KPI</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} hover>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900">{kpi.name}</h3>
                <p className="text-3xl font-bold text-primary-600 mt-2">{kpi.value}</p>
                <p className="text-sm text-slate-600 mt-1">Target: {kpi.target}</p>
              </div>
              <div className="text-green-600 font-medium">{kpi.trend}</div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Progress</span>
                <span className="font-medium text-slate-900">{kpi.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${kpi.progress}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <Card>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Performance Trends</h2>
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
          <div className="text-center text-slate-500">
            <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
            <p>Chart visualization would be implemented with a charting library</p>
          </div>
        </div>
      </Card>

      {/* Add KPI Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New KPI"
        size="md"
      >
        <form 
          className="space-y-4" 
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await toast.promise(
                new Promise(resolve => setTimeout(resolve, 1000)),
                {
                  loading: 'Creating KPI...',
                  success: 'KPI added successfully!',
                  error: 'Failed to add KPI',
                }
              );
              setShowAddModal(false);
            } catch (error) {
              console.error('Failed to add KPI:', error);
            }
          }}
        >
          <p className="text-sm text-slate-600">Track key performance metrics for your business</p>
          
          <div className="space-y-4">
            <Input label="KPI Name" placeholder="e.g., Monthly Revenue" required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Current Value" placeholder="125000" type="number" required />
              <Input label="Target Value" placeholder="150000" type="number" required />
            </div>
            <Input label="Unit" placeholder="e.g., $, %, units" required />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add KPI</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
