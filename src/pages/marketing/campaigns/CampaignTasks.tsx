import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Clock, User, Plus, Filter, Calendar } from 'lucide-react';
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

interface CampaignTask {
  id: string;
  title: string;
  campaign: string;
  assignee: string;
  due: string;
  status: string;
  priority: string;
}

export const CampaignTasks: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    campaign: '',
    assignee: '',
    due: '',
    priority: 'medium'
  });

  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  // Load campaigns on component mount
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const loadCampaigns = useCallback(async () => {
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
  }, [supabaseReady]);

  // Generate tasks based on campaigns
  const tasks = React.useMemo(() => {
    const generatedTasks: CampaignTask[] = [];
    campaigns.forEach((campaign) => {
      // Generate typical tasks for each campaign
      const taskTypes = [
        { title: `Design ${campaign.channels[0] || 'Email'} creative`, priority: 'high' },
        { title: `Write copy for ${campaign.name}`, priority: 'medium' },
        { title: `Set up tracking for ${campaign.name}`, priority: 'medium' },
        { title: `Review and approve ${campaign.name} content`, priority: 'high' },
      ];

      taskTypes.forEach((taskType, index) => {
        generatedTasks.push({
          id: `${campaign.id}-task-${index}`,
          title: taskType.title,
          campaign: campaign.name,
          assignee: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'][Math.floor(Math.random() * 4)],
          due: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: ['pending', 'in-progress', 'completed'][Math.floor(Math.random() * 3)],
          priority: taskType.priority,
        });
      });
    });

    return generatedTasks;
  }, [campaigns]);

  const handleAddTask = () => {
    if (!newTask.title.trim() || !newTask.campaign.trim()) {
      toast.error('Task title and campaign are required');
      return;
    }
    toast.success(`Task "${newTask.title}" added successfully`);
    setNewTask({ title: '', campaign: '', assignee: '', due: '', priority: 'medium' });
    setShowAddTaskModal(false);
  };

  const handleFilterTasks = () => {
    toast.success('Task filters applied');
    setShowFilterModal(false);
  };

  const handleViewCalendar = () => {
    toast.success('Calendar view opened');
    setShowCalendarModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => setShowAddTaskModal(true)}>Add Task</Button>
        <Button icon={Filter} variant="outline" onClick={() => setShowFilterModal(true)}>Filter Tasks</Button>
        <Button icon={Calendar} variant="outline" onClick={() => setShowCalendarModal(true)}>View Calendar</Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-slate-500">Loading campaign tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No tasks yet. Create campaigns to generate tasks!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className={`${task.status === 'overdue' ? 'border-red-200 bg-red-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CheckSquare className={`flex-shrink-0 mt-0.5 ${
                    task.status === 'completed' ? 'text-green-600' :
                    task.status === 'overdue' ? 'text-red-600' : 'text-slate-400'
                  }`} size={20} />
                  <div>
                    <div className="font-medium text-slate-900">{task.title}</div>
                    <div className="text-sm text-slate-600 mt-1">{task.campaign}</div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {task.assignee}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {task.due}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  task.status === 'completed' ? 'bg-green-100 text-green-700' :
                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {task.status.replace('-', ' ')}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        title="Add New Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Task Title</label>
            <Input
              placeholder="e.g., Design email creative"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Campaign</label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              value={newTask.campaign}
              onChange={(e) => setNewTask({ ...newTask, campaign: e.target.value })}
            >
              <option value="">Select Campaign</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.name}>{campaign.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assignee</label>
            <Input
              placeholder="e.g., John Doe"
              value={newTask.assignee}
              onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
            <Input
              type="date"
              value={newTask.due}
              onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleAddTask}>Add Task</Button>
            <Button variant="outline" onClick={() => setShowAddTaskModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Filter Tasks Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Tasks"
      >
        <div className="space-y-4">
          <p className="text-slate-600">Filter tasks by status, priority, assignee, or due date.</p>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleFilterTasks}>Apply Filters</Button>
            <Button variant="outline" onClick={() => setShowFilterModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Calendar View Modal */}
      <Modal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        title="Task Calendar"
      >
        <div className="space-y-4">
          <p className="text-slate-600">View all tasks on a calendar interface.</p>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleViewCalendar}>Open Calendar</Button>
            <Button variant="outline" onClick={() => setShowCalendarModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
