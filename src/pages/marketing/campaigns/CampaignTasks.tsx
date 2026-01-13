import React from 'react';
import { CheckSquare, Clock, User, Plus, Filter, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const CampaignTasks: React.FC = () => {
  const tasks: Array<{ title: string; campaign: string; assignee: string; due: string; status: string; priority: string }> = [];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button icon={Plus} onClick={() => toast.message('Add task', { description: 'Demo: open add-task modal.' })}>Add Task</Button>
        <Button icon={Filter} variant="outline" onClick={() => toast.message('Task filters', { description: 'Demo: open filters.' })}>Filter Tasks</Button>
        <Button icon={Calendar} variant="outline" onClick={() => toast.message('Calendar view', { description: 'Demo: show tasks on calendar.' })}>View Calendar</Button>
      </div>

      <div className="space-y-4">
      {tasks.map((task, idx) => (
        <Card key={idx} className={`${task.status === 'overdue' ? 'border-red-200 bg-red-50' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CheckSquare className={`flex-shrink-0 mt-0.5 ${
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
              task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
              task.status === 'overdue' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {task.status}
            </span>
          </div>
        </Card>
      ))}
      </div>
    </div>
  );
};
