import { useState, useMemo, memo, useEffect } from 'react';
import { CheckCircle, Circle, Clock, X, Plus, Filter, Calendar as CalendarIcon, User, ChevronDown, Pencil, Trash2, AlertCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useTasks } from '../lib/use-data';
import { toast } from 'sonner@2.0.3';

interface Task {
  id: number;
  title: string;
  description: string;
  assignedTo: string | number; // UUID string or legacy number
  assignedBy: string | number; // UUID string or legacy number
  assignedByName: string;
  assignedToName: string;
  assignedToPhone: string;
  status: 'assigned' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  feedback?: string;
  completedAt?: string;
}

interface User {
  id: string | number;
  name: string;
  phone: string;
  role: 'admin' | 'user';
}

interface TaskManagementProps {
  users: User[];
}

export const TaskManagement = memo(function TaskManagement({ users }: TaskManagementProps) {
  const { user: currentUser, isAdmin, selectedUserId } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [feedback, setFeedback] = useState('');
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '' as string | number,
    priority: 'medium' as 'high' | 'medium' | 'low',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    assignedTo: '' as string | number,
    priority: 'medium' as 'high' | 'medium' | 'low',
    dueDate: '',
  });

  useEffect(() => {
    loadTasks();
  }, [selectedUserId]); // Reload when selected user changes

  useEffect(() => {
    console.log('TaskManagement - Users received:', users);
  }, [users]);

  const loadTasks = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Determine which tasks to fetch based on admin status and selected user
      const all = isAdmin && !selectedUserId;
      const userId = selectedUserId || (!all ? currentUser?.id : undefined);
      
      console.log('TaskManagement - Loading tasks:', { 
        currentUserId: currentUser?.id, 
        isAdmin, 
        selectedUserId,
        fetchAll: all,
        filterUserId: userId 
      });
      
      const response = await useTasks.getAll(userId, all);
      console.log('TaskManagement - Tasks loaded:', response.records?.length || 0, 'tasks');
      console.log('TaskManagement - Tasks details:', response.records);
      setTasks(response.records || []);
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
      if (!silent) toast.error('Failed to load tasks');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assignedTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!currentUser?.id) {
      toast.error('User not found');
      return;
    }

    const assignedUser = users.find(u => u.id === newTask.assignedTo);
    if (!assignedUser) {
      toast.error('Assigned user not found');
      return;
    }

    setShowAddModal(false);
    resetForm();
    toast.info('Creating task...');

    try {
      await useTasks.create({
        ...newTask,
        assignedBy: currentUser.id,
        assignedByName: currentUser.name || 'Admin',
        assignedToName: assignedUser.name,
        assignedToPhone: assignedUser.phone,
        dueDate: new Date(newTask.dueDate).toISOString(),
      });

      toast.success('✅ Task created successfully!');
      await loadTasks(true);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast.error(error.message || 'Failed to create task');
      await loadTasks(true);
    }
  };

  const handleUpdateStatus = async (taskId: number, status: 'assigned' | 'in_progress' | 'completed') => {
    // Optimistic update
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId 
        ? { ...task, status, updatedAt: new Date().toISOString() }
        : task
    ));

    toast.info(`Updating task...`);

    try {
      console.log('🔄 Updating task status - TaskID:', taskId, 'New status:', status);
      console.log('🔄 Current user:', currentUser?.id, 'Is admin:', isAdmin);
      
      const response = await useTasks.updateStatus(taskId, status);
      
      console.log('✅ Task status update response:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Update failed');
      }
      
      toast.success(`✅ Task ${status === 'in_progress' ? 'started' : status === 'completed' ? 'completed' : 'updated'} successfully!`);
      
      // Silent refresh in background
      await loadTasks(true);
    } catch (error: any) {
      console.error('❌ Failed to update status:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        taskId,
        status
      });
      toast.error(error.message || 'Failed to update status');
      // Revert optimistic update
      await loadTasks(true);
    }
  };

  const handleAddFeedback = async () => {
    if (!selectedTask) {
      toast.error('No task selected');
      return;
    }

    if (!feedback.trim()) {
      toast.error('Please enter feedback');
      return;
    }

    // Optimistic update
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === selectedTask.id 
        ? { ...task, feedback, updatedAt: new Date().toISOString() }
        : task
    ));

    setShowFeedbackModal(false);
    const tempFeedback = feedback;
    const tempTask = selectedTask;
    setSelectedTask(null);
    setFeedback('');
    
    toast.info('Saving feedback...');

    try {
      console.log('💬 Adding feedback - Task ID:', tempTask.id, 'Feedback:', tempFeedback);
      console.log('💬 Current user:', currentUser?.id, 'Is admin:', isAdmin);
      
      const response = await useTasks.updateStatus(tempTask.id, tempTask.status, tempFeedback);
      
      console.log('✅ Feedback update response:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Update failed');
      }
      
      toast.success('✅ Feedback added successfully!');
      
      // Silent refresh in background
      await loadTasks(true);
    } catch (error: any) {
      console.error('❌ Failed to add feedback:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        taskId: tempTask.id
      });
      toast.error(error.message || 'Failed to add feedback');
      // Revert optimistic update
      await loadTasks(true);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    // Optimistic update
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    toast.info('Deleting task...');

    try {
      await useTasks.delete(taskId);
      toast.success('✅ Task deleted successfully!');
      await loadTasks(true);
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      toast.error(error.message || 'Failed to delete task');
      await loadTasks(true);
    }
  };

  const handleEditTask = async () => {
    if (!selectedTask) return;
    if (!editTask.title || !editTask.assignedTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    const assignedUser = users.find(u => u.id === editTask.assignedTo);
    if (!assignedUser) {
      toast.error('Assigned user not found');
      return;
    }

    setShowEditModal(false);
    setSelectedTask(null);
    toast.info('Updating task...');

    try {
      await useTasks.update(selectedTask.id, {
        title: editTask.title,
        description: editTask.description,
        assignedTo: editTask.assignedTo,
        assignedToName: assignedUser.name,
        assignedToPhone: assignedUser.phone,
        priority: editTask.priority,
        dueDate: new Date(editTask.dueDate).toISOString(),
      });

      toast.success('✅ Task updated successfully!');
      await loadTasks(true);
    } catch (error: any) {
      console.error('Failed to update task:', error);
      toast.error(error.message || 'Failed to update task');
      await loadTasks(true);
    }
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setEditTask({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      priority: task.priority,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setNewTask({
      title: '',
      description: '',
      assignedTo: '' as string | number,
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Clock className="text-gray-500" size={18} />;
      case 'in_progress':
        return <Circle className="text-blue-500" size={18} />;
      case 'completed':
        return <CheckCircle className="text-green-500" size={18} />;
      default:
        return <Clock className="text-gray-500" size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const stats = {
    total: tasks.length,
    assigned: tasks.filter(t => t.status === 'assigned').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => isOverdue(t.dueDate, t.status)).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg flex items-center gap-2">
            <CheckCircle className="text-pink-500" size={20} />
            Task Management
            {loading && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-pink-500"></div>
                Loading...
              </div>
            )}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isAdmin ? 'Assign and track tasks for your team' : 'View and update your assigned tasks'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Assign Task
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="text-2xl mb-1">{stats.total}</div>
          <div className="text-xs text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="text-2xl mb-1">{stats.assigned}</div>
          <div className="text-xs text-gray-600">Assigned</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-2xl text-blue-700 mb-1">{stats.inProgress}</div>
          <div className="text-xs text-blue-600">In Progress</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="text-2xl text-green-700 mb-1">{stats.completed}</div>
          <div className="text-xs text-green-600">Completed</div>
        </div>
        {stats.overdue > 0 && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="text-2xl text-red-700 mb-1">{stats.overdue}</div>
            <div className="text-xs text-red-600">Overdue</div>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'all' 
              ? 'bg-pink-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('assigned')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'assigned' 
              ? 'bg-pink-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Assigned ({stats.assigned})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'in_progress' 
              ? 'bg-pink-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          In Progress ({stats.inProgress})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'completed' 
              ? 'bg-pink-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Completed ({stats.completed})
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <CheckCircle size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 mb-2">No tasks found</p>
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="text-pink-600 hover:text-pink-700 text-sm"
              >
                Create your first task
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-lg border p-4 transition-all ${
                isOverdue(task.dueDate, task.status) 
                  ? 'border-red-300 bg-red-50/30' 
                  : 'border-gray-200 hover:border-pink-200'
              }`}
            >
              {/* Task Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(task.status)}
                    <h4 className="font-medium">{task.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className={`px-2 py-1 rounded border ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                      {task.priority} priority
                    </span>
                    <span className={`flex items-center gap-1 ${
                      isOverdue(task.dueDate, task.status) ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <CalendarIcon size={14} />
                      {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate, task.status) && (
                        <AlertCircle size={14} className="text-red-500" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Show details"
                  >
                    {expandedTask === task.id ? (
                      <ChevronDown size={18} className="text-gray-600" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-600" />
                    )}
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                        title="Edit task"
                      >
                        <Pencil size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 hover:bg-red-50 rounded transition-colors"
                        title="Delete task"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Action Buttons - Always Visible */}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                {task.status !== 'in_progress' && task.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('✅ Begin task clicked - Task ID:', task.id, 'Current status:', task.status);
                      handleUpdateStatus(task.id, 'in_progress');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
                  >
                    <Circle size={16} />
                    BEGIN
                  </button>
                )}
                {task.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('✅ Complete task clicked - Task ID:', task.id, 'Current status:', task.status);
                      handleUpdateStatus(task.id, 'completed');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
                  >
                    <CheckCircle size={16} />
                    COMPLETE
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('✅ Add feedback clicked - Task ID:', task.id);
                    setSelectedTask(task);
                    setFeedback(task.feedback || '');
                    setShowFeedbackModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 active:bg-purple-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
                >
                  <MessageSquare size={16} />
                  {task.feedback ? 'UPDATE' : 'ADD'} FEEDBACK
                </button>
              </div>

              {/* Expanded Details */}
              {expandedTask === task.id && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  {task.description && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Description:</p>
                      <p className="text-sm text-gray-700">{task.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Assigned To:</p>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-gray-700">{task.assignedToName}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Assigned By:</p>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-gray-700">{task.assignedByName}</span>
                      </div>
                    </div>
                  </div>

                  {task.feedback && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <MessageSquare size={14} />
                        Feedback:
                      </p>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-sm text-purple-900">{task.feedback}</p>
                      </div>
                    </div>
                  )}

                  {task.completedAt && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Completed:
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <p className="text-sm text-green-900">{new Date(task.completedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="text-xl mb-1">Assign New Task</h3>
                <p className="text-sm text-white/80">Create and assign a task to a team member</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Describe the task..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Assign To <span className="text-red-500">*</span>
                </label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value || '' })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select team member...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role}) - {user.phone}
                    </option>
                  ))}
                </select>
                {users.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No team members found. Add users to your team first.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.title || !newTask.assignedTo}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Assign Task
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="text-xl mb-1">Task Feedback</h3>
                <p className="text-sm text-white/80">{selectedTask.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedTask(null);
                  setFeedback('');
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-2">Feedback / Comments</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add your feedback or comments about this task..."
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddFeedback}
                  disabled={!feedback.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <MessageSquare size={20} />
                  Save Feedback
                </button>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedTask(null);
                    setFeedback('');
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="text-xl mb-1">Edit Task</h3>
                <p className="text-sm text-white/80">{selectedTask.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTask(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTask.title}
                  onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                  placeholder="Enter task title"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Description</label>
                <textarea
                  value={editTask.description}
                  onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                  placeholder="Describe the task..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Assign To <span className="text-red-500">*</span>
                </label>
                <select
                  value={editTask.assignedTo}
                  onChange={(e) => setEditTask({ ...editTask, assignedTo: e.target.value || '' })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select team member...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role}) - {user.phone}
                    </option>
                  ))}
                </select>
                {users.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No team members found. Add users to your team first.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Priority</label>
                  <select
                    value={editTask.priority}
                    onChange={(e) => setEditTask({ ...editTask, priority: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Due Date</label>
                  <input
                    type="date"
                    value={editTask.dueDate}
                    onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleEditTask}
                  disabled={!editTask.title || !editTask.assignedTo}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Pencil size={20} />
                  Update Task
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTask(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});