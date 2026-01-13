import React, { useEffect, useState } from 'react';
import {
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  User,
  Users,
  Package,
  Target,
  Calendar,
  Flag,
  Eye,
  Edit,
  Trash2,
  Link2,
  Brain,
  TrendingUp,
  Filter,
  Banknote,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/types/database';
import { useAuthStore } from '@/store/authStore';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Assignment
  assigned_to: string;
  assigned_by: string;
  
  // Linking
  linked_to: {
    type: 'customer' | 'deal' | 'competitor' | 'product' | null;
    id: string | null;
    name: string | null;
  };
  
  // Dates
  created_at: string;
  due_date: string;
  completed_at: string | null;
  
  // AI Features
  ai_priority_score: number; // 0-100
  ai_suggested_priority: 'low' | 'medium' | 'high' | 'urgent';
  is_overdue: boolean;
  days_overdue: number;
  
  // Task Context
  estimated_hours: number;
  actual_hours: number;
  tags: string[];
  
  // Feedback System
  feedback?: Array<{
    id: string;
    date: string;
    user: string;
    comment: string;
  }>;
}
  type AfterSalesTaskRow = Database['public']['Tables']['after_sales_tasks']['Row'];
  type AfterSalesFeedbackRow = Database['public']['Tables']['after_sales_feedback']['Row'];

const demoTasks: Task[] = [];

export const AfterSales: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ comment: '', user: 'You', date: new Date().toISOString() });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assigned_to: '',
    due_date: '',
  });
  const [linkedModal, setLinkedModal] = useState<{ type: string | null; id: string | null; name: string | null } | null>(null);
  const [addForm, setAddForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
    estimated_hours: '',
    tags: '',
    linked_type: '',
    linked_name: '',
  });
  const [loading, setLoading] = useState(true);
  const [, setSyncing] = useState(false);

  const columns = [
    { id: 'todo', title: '📋 To Do', color: 'slate' },
    { id: 'in-progress', title: '⚡ In Progress', color: 'blue' },
    { id: 'review', title: '👀 Review', color: 'purple' },
    { id: 'done', title: '✅ Done', color: 'green' },
  ];

  const getTasksByStatus = (status: string) => {
    let filtered = tasks.filter((task) => task.status === status);
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }
    return filtered;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-slate-100 text-slate-700 border-slate-300',
      medium: 'bg-blue-100 text-blue-700 border-blue-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      urgent: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[priority as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent') return <Zap className="text-red-600" size={14} />;
    if (priority === 'high') return <AlertTriangle className="text-orange-600" size={14} />;
    if (priority === 'medium') return <Flag className="text-blue-600" size={14} />;
    return <Flag className="text-slate-600" size={14} />;
  };

  const getLinkedIcon = (type: string | null) => {
    if (type === 'customer') return <Users className="text-blue-600" size={14} />;
    if (type === 'deal') return <Banknote className="text-green-600" size={14} />;
    if (type === 'competitor') return <Target className="text-red-600" size={14} />;
    if (type === 'product') return <Package className="text-purple-600" size={14} />;
    return null;
  };

  const mapRowToTask = (row: AfterSalesTaskRow & { after_sales_feedback?: AfterSalesFeedbackRow[] }): Task => {
    const dueDate = row.due_date ? new Date(row.due_date) : null;
    const now = new Date();
    const isOverdueComputed = row.is_overdue ?? (dueDate ? dueDate.getTime() < now.getTime() && row.status !== 'done' : false);
    const daysOverdueComputed = row.days_overdue ?? (isOverdueComputed && dueDate
      ? Math.max(0, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0);

    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      status: row.status,
      priority: row.priority,
      assigned_to: row.assigned_to || 'Unassigned',
      assigned_by: row.assigned_by || 'Manager',
      linked_to: {
        type: row.linked_type,
        id: row.linked_id,
        name: row.linked_name,
      },
      created_at: row.created_at,
      due_date: row.due_date || new Date().toISOString(),
      completed_at: row.completed_at,
      ai_priority_score: row.ai_priority_score ?? 50,
      ai_suggested_priority: (row.ai_suggested_priority as Task['priority']) || 'medium',
      is_overdue: isOverdueComputed,
      days_overdue: daysOverdueComputed,
      estimated_hours: Number(row.estimated_hours || 0),
      actual_hours: Number(row.actual_hours || 0),
      tags: row.tags || [],
      feedback: (row.after_sales_feedback || []).map((f) => ({
        id: f.id,
        date: f.created_at,
        user: f.user_name,
        comment: f.comment,
      })),
    };
  };

  const toDbPayload = (task: Task): Partial<AfterSalesTaskRow> => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to,
    assigned_by: task.assigned_by,
    linked_type: task.linked_to.type,
    linked_id: task.linked_to.id,
    linked_name: task.linked_to.name,
    due_date: task.due_date,
    completed_at: task.completed_at,
    ai_priority_score: task.ai_priority_score,
    ai_suggested_priority: task.ai_suggested_priority,
    is_overdue: task.is_overdue,
    days_overdue: task.days_overdue,
    estimated_hours: task.estimated_hours,
    actual_hours: task.actual_hours,
    tags: task.tags,
  });

  useEffect(() => {
    const fetchTasks = async () => {
      if (!supabaseReady || !user) {
        setTasks(demoTasks);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('after_sales_tasks')
        .select('*, after_sales_feedback(*)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to load tasks, falling back to demo data:', error.message);
        setTasks(demoTasks);
        setLoading(false);
        return;
      }

      const mapped = (data || []).map(mapRowToTask);
      setTasks(mapped.length ? mapped : demoTasks);
      setLoading(false);
    };

    fetchTasks();
  }, [supabaseReady, user]);

  const upsertTask = async (task: Task): Promise<Task> => {
    if (!supabaseReady || !user) return task;
    setSyncing(true);
    const { data, error } = await supabase
      .from('after_sales_tasks')
      .upsert({ ...toDbPayload(task), created_by: user.id }, { onConflict: 'id' })
      .select('*, after_sales_feedback(*)')
      .single();
    setSyncing(false);

    if (error || !data) {
      console.error('Failed to save task:', error);
      toast.error('Could not sync task to database');
      return task;
    }

    return mapRowToTask(data);
  };

  const deleteTaskInDb = async (taskId: string) => {
    if (!supabaseReady || !user) return;
    setSyncing(true);
    const { error } = await supabase.from('after_sales_tasks').delete().eq('id', taskId).eq('created_by', user.id);
    setSyncing(false);
    if (error) {
      console.error('Failed to delete task:', error);
      toast.error('Could not delete task from database');
    }
  };

  const addFeedbackToDb = async (taskId: string, feedback: { user: string; comment: string }): Promise<AfterSalesFeedbackRow | null> => {
    if (!supabaseReady || !user) return null;
    setSyncing(true);
    const { data, error } = await supabase
      .from('after_sales_feedback')
      .insert({
        task_id: taskId,
        user_name: feedback.user,
        comment: feedback.comment,
        created_by: user.id,
      })
      .select('*')
      .single();
    setSyncing(false);

    if (error) {
      console.error('Failed to add feedback:', error);
      toast.error('Could not save feedback to database');
      return null;
    }

    return data;
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => t.is_overdue).length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const avgCompletionTime = 5.3; // Demo value

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Loading after-sales tasks...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">✅ After Sales & Tasks Management</h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base">Comprehensive after-sales service & task tracking</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)} className="text-sm md:text-base">Add Task</Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card className="border-l-4 border-slate-500">
          <CheckCircle className="text-slate-600 mb-1 md:mb-2" size={20} />
          <p className="text-xs md:text-sm text-slate-600">Total Tasks</p>
          <p className="text-xl md:text-2xl font-bold text-slate-900">{totalTasks}</p>
        </Card>
        <Card className="border-l-4 border-green-500">
          <TrendingUp className="text-green-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
        </Card>
        <Card className="border-l-4 border-red-500">
          <AlertTriangle className="text-red-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <Zap className="text-orange-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Urgent</p>
          <p className="text-2xl font-bold text-orange-600">{urgentTasks}</p>
        </Card>
        <Card className="border-l-4 border-primary-500">
          <Clock className="text-primary-600 mb-2" size={24} />
          <p className="text-sm text-slate-600">Avg Completion</p>
          <p className="text-2xl font-bold text-primary-600">{avgCompletionTime}d</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
        <Filter className="text-slate-600 flex-shrink-0" size={18} />
        <span className="text-xs md:text-sm font-medium text-slate-700">Filter by Priority:</span>
        {['all', 'urgent', 'high', 'medium', 'low'].map((priority) => (
          <button
            key={priority}
            onClick={() => setFilterPriority(priority)}
            className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              filterPriority === priority
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-700 border-slate-300 hover:border-primary-400'
            }`}
          >
            {priority === 'all' ? 'ALL' : priority.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="inline-flex lg:grid lg:grid-cols-4 gap-3 md:gap-4 min-w-full lg:min-w-0">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div key={column.id} className="w-72 lg:w-auto flex-shrink-0 lg:flex-shrink min-h-[500px]">
              <Card className="h-full">
                <div className="mb-4 pb-3 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{column.title}</h3>
                    <span className={`px-2 py-1 bg-${column.color}-100 text-${column.color}-700 text-xs rounded font-bold`}>
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-2.5 md:p-3 bg-white border-2 rounded-lg hover:shadow-md transition-all cursor-pointer ${
                        task.is_overdue 
                          ? 'border-red-300 bg-red-50' 
                          : task.ai_priority_score > 90
                          ? 'border-orange-300 bg-orange-50'
                          : 'border-slate-200'
                      }`}
                      onClick={() => setSelectedTask(task)}
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-1.5 md:mb-2">
                        <h4 className="font-semibold text-slate-900 text-xs md:text-sm leading-tight flex-1">
                          {task.title}
                        </h4>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                          {getPriorityIcon(task.priority)}
                          {task.priority === 'urgent' && '🔥'}
                        </span>
                      </div>

                      {/* Task Description */}
                      <p className="text-xs text-slate-600 mb-2 line-clamp-2">{task.description}</p>

                      {/* Linked Entity */}
                      {task.linked_to.type && (
                        <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded flex items-center gap-2">
                          {getLinkedIcon(task.linked_to.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-600 capitalize">{task.linked_to.type}</p>
                            <p className="text-xs font-medium text-slate-900 truncate">{task.linked_to.name}</p>
                          </div>
                        </div>
                      )}

                      {/* AI Priority & Overdue Warning */}
                      {task.is_overdue && (
                        <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded">
                          <div className="flex items-center gap-1 mb-1">
                            <AlertTriangle className="text-red-600 flex-shrink-0" size={14} />
                            <p className="text-xs font-bold text-red-700">OVERDUE: {task.days_overdue} days</p>
                          </div>
                          <p className="text-xs text-red-600">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                        </div>
                      )}

                      {!task.is_overdue && task.ai_priority_score > 85 && (
                        <div className="mb-2 p-2 bg-primary-50 border border-primary-200 rounded flex items-center gap-1">
                          <Brain className="text-primary-600 flex-shrink-0" size={12} />
                          <p className="text-xs text-primary-700">AI Priority: {task.ai_priority_score}/100</p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <User size={12} />
                          <span className="truncate">{task.assigned_to}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Calendar size={12} />
                          <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          );
        })}
        </div>
      </div>

      {/* Detailed Task Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedTask.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getPriorityColor(selectedTask.priority)}`}>
                    {getPriorityIcon(selectedTask.priority)}
                    {selectedTask.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-600">{selectedTask.description}</p>
              </div>
            </div>

            {/* AI Priority & Overdue Alert */}
            {selectedTask.is_overdue && (
              <Card className="border-2 border-red-300 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={28} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-red-900 text-lg">⚠️ OVERDUE TASK</h3>
                      <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
                        {selectedTask.days_overdue} days overdue
                      </span>
                    </div>
                    <p className="text-sm text-red-800">
                      This task was due on {new Date(selectedTask.due_date).toLocaleDateString()}. 
                      Please prioritize completion immediately.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {!selectedTask.is_overdue && selectedTask.ai_priority_score > 85 && (
              <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-purple-50">
                <div className="flex items-start gap-3">
                  <Brain className="text-primary-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-bold text-primary-900 mb-1">🧠 AI High Priority Alert</h3>
                    <p className="text-sm text-primary-800 mb-2">
                      AI Priority Score: <span className="font-bold">{selectedTask.ai_priority_score}/100</span>
                    </p>
                    <p className="text-sm text-primary-700">
                      This task has been flagged as high impact. AI suggests: <span className="font-bold capitalize">{selectedTask.ai_suggested_priority}</span> priority.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Task Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <h3 className="font-bold text-slate-900 mb-3">📋 Task Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className="font-bold text-slate-900 capitalize">{selectedTask.status.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Priority:</span>
                    <span className={`font-bold capitalize ${
                      selectedTask.priority === 'urgent' ? 'text-red-600' :
                      selectedTask.priority === 'high' ? 'text-orange-600' :
                      selectedTask.priority === 'medium' ? 'text-blue-600' :
                      'text-slate-600'
                    }`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Assigned To:</span>
                    <span className="font-bold text-slate-900">{selectedTask.assigned_to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Assigned By:</span>
                    <span className="font-medium text-slate-700">{selectedTask.assigned_by}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-bold text-slate-900 mb-3">📅 Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created:</span>
                    <span className="font-medium text-slate-900">
                      {new Date(selectedTask.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Due Date:</span>
                    <span className={`font-bold ${selectedTask.is_overdue ? 'text-red-600' : 'text-slate-900'}`}>
                      {new Date(selectedTask.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedTask.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Completed:</span>
                      <span className="font-medium text-green-600">
                        {new Date(selectedTask.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Est. Hours:</span>
                    <span className="font-medium text-slate-900">{selectedTask.estimated_hours}h</span>
                  </div>
                  {selectedTask.actual_hours > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Actual Hours:</span>
                      <span className="font-medium text-blue-600">{selectedTask.actual_hours}h</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Linked Entity */}
            {selectedTask.linked_to.type && (
              <Card className="border-l-4 border-primary-500">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Link2 className="text-primary-600" size={20} />
                  Linked To
                </h3>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {getLinkedIcon(selectedTask.linked_to.type)}
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 capitalize">{selectedTask.linked_to.type}</p>
                    <p className="font-bold text-slate-900">{selectedTask.linked_to.name}</p>
                  </div>
                  <Button 
                    size="sm" 
                    icon={Eye} 
                    onClick={() => {
                      setLinkedModal(selectedTask.linked_to);
                    }}
                  >
                    View
                  </Button>
                </div>
              </Card>
            )}

            {/* Tags */}
            {selectedTask.tags.length > 0 && (
              <Card>
                <h3 className="font-bold text-slate-900 mb-3">🏷️ Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Task Feedback */}
            <Card className="border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  💬 Task Feedback
                </h3>
                <Button 
                  size="sm" 
                  icon={Plus} 
                  onClick={() => {
                    if (!selectedTask) return;
                    setFeedbackForm({ comment: '', user: 'You', date: new Date().toISOString() });
                    setShowFeedbackModal(true);
                  }}
                >
                  Add Feedback
                </Button>
              </div>
              
              {selectedTask.feedback && selectedTask.feedback.length > 0 ? (
                <div className="space-y-3">
                  {selectedTask.feedback.map((feedback) => (
                    <div key={feedback.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="text-primary-600" size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{feedback.user}</p>
                            <p className="text-xs text-slate-600">{new Date(feedback.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 ml-10">{feedback.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm">No feedback yet. Click "Add Feedback" to share updates.</p>
                </div>
              )}
            </Card>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                icon={Edit} 
                onClick={() => {
                  if (!selectedTask) return;
                  setEditForm({
                    title: selectedTask.title,
                    description: selectedTask.description,
                    priority: selectedTask.priority,
                    status: selectedTask.status,
                    assigned_to: selectedTask.assigned_to,
                    due_date: selectedTask.due_date,
                  });
                  setShowEditModal(true);
                }}
              >
                Edit Task
              </Button>
              {selectedTask.status !== 'done' && (
                <Button 
                  icon={CheckCircle} 
                  onClick={async () => {
                    try {
                      await toast.promise(
                        new Promise(resolve => setTimeout(resolve, 1000)),
                        {
                          loading: 'Updating task status...',
                          success: 'Task marked as complete!',
                          error: 'Failed to update task',
                        }
                      );
                      const updated = { ...selectedTask, status: 'done', completed_at: new Date().toISOString() };
                      const saved = await upsertTask({ ...updated, status: updated.status as 'todo' | 'in-progress' | 'review' | 'done' });
                      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? saved : t)));
                      setSelectedTask(null);
                    } catch (error) {
                      console.error('Failed to complete task:', error);
                    }
                  }}
                >
                  Mark Complete
                </Button>
              )}
              <Button 
                variant="secondary" 
                icon={Trash2} 
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to delete this task?')) return;
                  
                  try {
                    await toast.promise(
                      new Promise(resolve => setTimeout(resolve, 500)),
                      {
                        loading: 'Deleting task...',
                        success: 'Task deleted successfully',
                        error: 'Failed to delete task',
                      }
                    );
                    await deleteTaskInDb(selectedTask.id);
                    setTasks(tasks.filter(t => t.id !== selectedTask.id));
                    setSelectedTask(null);
                  } catch (error) {
                    console.error('Failed to delete task:', error);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Task"
        size="lg"
      >
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          if (!addForm.title.trim()) {
            toast.error('Title is required');
            return;
          }

          const nowIso = new Date().toISOString();
          const newTask: Task = {
            id: crypto.randomUUID(),
            title: addForm.title.trim(),
            description: addForm.description.trim() || 'No description',
            status: 'todo',
            priority: addForm.priority as Task['priority'],
            assigned_to: addForm.assigned_to.trim() || 'Unassigned',
            assigned_by: 'You',
            linked_to: {
              type: (addForm.linked_type || null) as Task['linked_to']['type'],
              id: null,
              name: addForm.linked_name.trim() || null,
            },
            created_at: nowIso,
            due_date: addForm.due_date || nowIso,
            completed_at: null,
            ai_priority_score: 75,
            ai_suggested_priority: addForm.priority as Task['priority'],
            is_overdue: false,
            days_overdue: 0,
            estimated_hours: Number(addForm.estimated_hours || 0),
            actual_hours: 0,
            tags: addForm.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
            feedback: [],
          };

          try {
            const saved = await upsertTask(newTask);
            setTasks((prev) => [saved, ...prev]);
            setShowAddModal(false);
            setAddForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '', estimated_hours: '', tags: '', linked_type: '', linked_name: '' });
            toast.success('Task created');
          } catch (error) {
            console.error('Failed to create task:', error);
            toast.error('Failed to create task');
          }
        }}>
          <p className="text-sm text-slate-600">AI will automatically prioritize and suggest optimizations</p>
          
          <div className="space-y-4">
            <Input 
              label="Task Title" 
              placeholder="Follow up on deal..." 
              required 
              value={addForm.title}
              onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Describe the task..."
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={addForm.priority}
                  onChange={(e) => setAddForm({ ...addForm, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <Input 
                label="Due Date" 
                type="date" 
                required 
                value={addForm.due_date}
                onChange={(e) => setAddForm({ ...addForm, due_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Assign To" 
                placeholder="John Smith" 
                required 
                value={addForm.assigned_to}
                onChange={(e) => setAddForm({ ...addForm, assigned_to: e.target.value })}
              />
              <Input 
                label="Estimated Hours" 
                type="number" 
                placeholder="2" 
                value={addForm.estimated_hours}
                onChange={(e) => setAddForm({ ...addForm, estimated_hours: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Link to (optional)</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                value={addForm.linked_type}
                onChange={(e) => setAddForm({ ...addForm, linked_type: e.target.value })}
              >
                <option value="">None</option>
                <option value="customer">Customer</option>
                <option value="deal">Deal</option>
                <option value="competitor">Competitor</option>
                <option value="product">Product</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Linked Name</label>
              <Input 
                placeholder="Acme Corp"
                value={addForm.linked_name}
                onChange={(e) => setAddForm({ ...addForm, linked_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <Input 
                placeholder="sales, high-value, enterprise (comma separated)"
                value={addForm.tags}
                onChange={(e) => setAddForm({ ...addForm, tags: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task & Get AI Priority</Button>
          </div>
        </form>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Add Feedback"
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedTask) return;
            const trimmedComment = feedbackForm.comment.trim();
            if (!trimmedComment) {
              toast.error('Please enter feedback');
              return;
            }

            const baseFeedback = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              user: feedbackForm.user || 'You',
              comment: trimmedComment,
            };

            let feedbackToUse = baseFeedback;
            if (supabaseReady) {
              const dbFeedback = await addFeedbackToDb(selectedTask.id, { user: baseFeedback.user, comment: baseFeedback.comment });
              if (dbFeedback) {
                feedbackToUse = {
                  id: dbFeedback.id,
                  date: dbFeedback.created_at,
                  user: dbFeedback.user_name,
                  comment: dbFeedback.comment,
                };
              }
            }

            const updatedTask = {
              ...selectedTask,
              feedback: [...(selectedTask.feedback || []), feedbackToUse],
            };
            setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? updatedTask : t)));
            setSelectedTask(updatedTask);
            setShowFeedbackModal(false);
            toast.success('Feedback added');
          }}
        >
          <Input
            label="Your Name"
            value={feedbackForm.user}
            onChange={(e) => setFeedbackForm({ ...feedbackForm, user: e.target.value })}
            placeholder="You"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Comment</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              value={feedbackForm.comment}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
              placeholder="Share an update..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowFeedbackModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Feedback</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task"
        size="lg"
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedTask) return;
            const updatedTask = {
              ...selectedTask,
              ...editForm,
            };
            const saved = await upsertTask({ 
              ...updatedTask, 
              status: updatedTask.status as 'todo' | 'in-progress' | 'review' | 'done',
              priority: updatedTask.priority as 'low' | 'medium' | 'high' | 'urgent'
            });
            setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? saved : t)));
            setSelectedTask(saved);
            setShowEditModal(false);
            toast.success('Task updated');
          }}
        >
          <Input
            label="Title"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Task['status'] })}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Task['priority'] })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Assigned To"
              value={editForm.assigned_to}
              onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={editForm.due_date}
              onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Linked Item Modal */}
      <Modal
        isOpen={!!linkedModal}
        onClose={() => setLinkedModal(null)}
        title="Linked Item"
      >
        {linkedModal ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-semibold capitalize">Type:</span>
              <span className="capitalize">{linkedModal.type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-semibold">Name:</span>
              <span>{linkedModal.name}</span>
            </div>
            {linkedModal.id && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="font-semibold">ID:</span>
                <span>{linkedModal.id}</span>
              </div>
            )}
            <p className="text-sm text-slate-600">Navigate to the relevant record to view full details.</p>
            <div className="flex justify-end">
              <Button onClick={() => setLinkedModal(null)}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
