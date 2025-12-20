import { Bot, MessageSquare, PhoneCall, Phone, X, Plus, Pencil, Trash2, Play, Pause, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';

interface AIAgent {
  id: string;
  name: string;
  status: 'active' | 'paused';
  channel: 'voice' | 'sms' | 'whatsapp';
  targetPriority: string;
  schedule: string;
  message: string;
  createdAt: string;
}

interface DebtAIAgentsModalProps {
  onClose: () => void;
  records?: any[];
}

export function DebtAIAgentsModal({ onClose, records = [] }: DebtAIAgentsModalProps) {
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([
    {
      id: '1',
      name: 'Critical Payment Follow-up',
      status: 'active',
      channel: 'voice',
      targetPriority: 'critical',
      schedule: 'Daily',
      message: 'Hello {customer}, this is a reminder regarding your overdue payment of {amount}. Please contact us to arrange payment.',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'High Priority Reminder',
      status: 'active',
      channel: 'whatsapp',
      targetPriority: 'high',
      schedule: 'Every 3 days',
      message: 'Hi {customer}, we notice your invoice {invoice} is now {days} days overdue. We appreciate your prompt attention to this matter.',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Gentle Payment Reminder',
      status: 'active',
      channel: 'sms',
      targetPriority: 'medium',
      schedule: 'Weekly',
      message: 'Dear {customer}, friendly reminder that payment for invoice {invoice} is due. Contact us if you need assistance.',
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Payment Confirmation',
      status: 'paused',
      channel: 'whatsapp',
      targetPriority: 'low',
      schedule: 'Bi-weekly',
      message: 'Hi {customer}, just checking if you received our invoice. Please let us know if you have any questions.',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<AIAgent | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [executingAgent, setExecutingAgent] = useState<AIAgent | null>(null);
  const [executionResults, setExecutionResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    channel: 'whatsapp' as 'voice' | 'sms' | 'whatsapp',
    targetPriority: 'critical',
    schedule: 'Daily',
    message: '',
  });

  const priorityOptions = [
    { value: 'critical', label: 'Critical (60+ days overdue)', color: 'text-red-600' },
    { value: 'high', label: 'High Priority (30-60 days)', color: 'text-orange-600' },
    { value: 'medium', label: 'Medium Priority (15-30 days)', color: 'text-amber-600' },
    { value: 'low', label: 'Low Priority (< 15 days)', color: 'text-blue-600' },
  ];

  const scheduleOptions = [
    'Daily',
    'Every 3 days',
    'Weekly',
    'Bi-weekly',
    'Monthly',
    'When overdue > 30 days',
    'When overdue > 60 days',
  ];

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'voice':
        return <PhoneCall size={18} className="text-blue-600" />;
      case 'sms':
        return <MessageSquare size={18} className="text-green-600" />;
      case 'whatsapp':
        return <Phone size={18} className="text-emerald-600" />;
      default:
        return <MessageSquare size={18} />;
    }
  };

  const getChannelLabel = (channel: string) => {
    const labels = {
      voice: 'Voice Call',
      sms: 'SMS Text',
      whatsapp: 'WhatsApp'
    };
    return labels[channel as keyof typeof labels] || channel;
  };

  const getPriorityLabel = (priority: string) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option?.label || priority;
  };

  const getPriorityColor = (priority: string) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option?.color || 'text-gray-600';
  };

  const toggleAgentStatus = (agentId: string) => {
    setAiAgents(aiAgents.map(agent =>
      agent.id === agentId
        ? { ...agent, status: agent.status === 'active' ? 'paused' : 'active' }
        : agent
    ));
    toast.success('Agent status updated');
  };

  const handleAddAgent = () => {
    if (!newAgent.name || !newAgent.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    const agent: AIAgent = {
      id: Date.now().toString(),
      ...newAgent,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    setAiAgents([...aiAgents, agent]);
    setShowAddAgentModal(false);
    setNewAgent({
      name: '',
      channel: 'whatsapp',
      targetPriority: 'critical',
      schedule: 'Daily',
      message: '',
    });
    toast.success('AI Agent created successfully');
  };

  const handleUpdateAgent = () => {
    if (!editingAgent) return;

    setAiAgents(aiAgents.map(agent =>
      agent.id === editingAgent.id ? editingAgent : agent
    ));
    setEditingAgent(null);
    toast.success('AI Agent updated successfully');
  };

  const handleDeleteAgent = () => {
    if (!deletingAgent) return;

    setAiAgents(aiAgents.filter(agent => agent.id !== deletingAgent.id));
    setShowDeleteModal(false);
    setDeletingAgent(null);
    toast.success('AI Agent deleted successfully');
  };

  const handleActNow = async (agent: AIAgent) => {
    setExecutingAgent(agent);
    setShowExecutionModal(true);
    setIsExecuting(true);
    setExecutionResults([]);

    // Log for debugging
    console.log('Total records:', records.length);
    console.log('Target priority:', agent.targetPriority);

    // Filter records based on priority
    const targetRecords = records.filter(record => {
      const priority = record.priority?.toLowerCase() || '';
      const target = agent.targetPriority.toLowerCase();
      
      console.log(`Record ${record.customer} has priority: ${priority}`);
      
      return priority === target;
    });

    console.log('Filtered records:', targetRecords.length);

    // Simulate execution with a delay
    const results: any[] = [];
    for (let i = 0; i < targetRecords.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing
      
      const record = targetRecords[i];
      const message = agent.message
        .replace('{customer}', record.customer || 'Valued Customer')
        .replace('{amount}', record.amount ? `$${record.amount.toLocaleString()}` : 'N/A')
        .replace('{invoice}', record.invoiceNumber || 'N/A')
        .replace('{days}', record.daysOverdue ? record.daysOverdue.toString() : 'N/A');
      
      const contact = record.phone || record.contactPerson;
      
      results.push({
        customer: record.customer,
        contact: contact,
        channel: agent.channel,
        message: message,
        status: 'success',
        timestamp: new Date().toISOString(),
      });

      setExecutionResults([...results]);
    }

    setIsExecuting(false);
    
    if (targetRecords.length === 0) {
      toast.info('No customers found matching the target priority category.');
    } else {
      toast.success(`Successfully contacted ${targetRecords.length} customer${targetRecords.length > 1 ? 's' : ''}`);
    }
  };

  if (!onClose) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="text-xl mb-1">AI Debt Collection Agents</h3>
              <p className="text-sm text-white/80">Automate payment follow-up across voice, SMS, and WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="text-blue-600" size={20} />
                <p className="text-sm text-gray-600">Total Agents</p>
              </div>
              <p className="text-2xl text-blue-600">{aiAgents.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-green-600" size={20} />
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <p className="text-2xl text-green-600">{aiAgents.filter(a => a.status === 'active').length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Pause className="text-gray-600" size={20} />
                <p className="text-sm text-gray-600">Paused</p>
              </div>
              <p className="text-2xl text-gray-600">{aiAgents.filter(a => a.status === 'paused').length}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="text-purple-600" size={20} />
                <p className="text-sm text-gray-600">Pending Debts</p>
              </div>
              <p className="text-2xl text-purple-600">{records.length}</p>
            </div>
          </div>

          {/* Add Agent Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddAgentModal(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Create New AI Agent
            </button>
          </div>

          {/* AI Agents List */}
          <div className="space-y-4">
            {aiAgents.map((agent) => (
              <div
                key={agent.id}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg">{agent.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        agent.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {agent.status === 'active' ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        {getChannelIcon(agent.channel)}
                        {getChannelLabel(agent.channel)}
                      </span>
                      <span className={`flex items-center gap-1 ${getPriorityColor(agent.targetPriority)}`}>
                        <AlertCircle size={14} />
                        {getPriorityLabel(agent.targetPriority)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap size={14} />
                        {agent.schedule}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAgentStatus(agent.id)}
                      title={agent.status === 'active' ? 'Pause agent' : 'Activate agent'}
                      className={`p-2 rounded-lg transition-colors ${
                        agent.status === 'active'
                          ? 'hover:bg-gray-100 text-gray-600'
                          : 'hover:bg-green-50 text-green-600'
                      }`}
                    >
                      {agent.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                      onClick={() => setEditingAgent(agent)}
                      title="Edit agent"
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingAgent(agent);
                        setShowDeleteModal(true);
                      }}
                      title="Delete agent"
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="">Message Template:</span>
                    <span className="block mt-1 text-gray-600">{agent.message}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Created {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => handleActNow(agent)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
                  >
                    <Zap size={16} />
                    Act Now - Execute Agent
                  </button>
                </div>
              </div>
            ))}

            {aiAgents.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Bot size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">No AI agents created yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Create your first agent to automate debt collection
                </p>
                <button
                  onClick={() => setShowAddAgentModal(true)}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Create Agent
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl mb-1">Create New AI Agent</h3>
                <p className="text-sm text-white/80">Configure automated debt collection</p>
              </div>
              <button
                onClick={() => setShowAddAgentModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-2">
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="e.g., Critical Payment Follow-up"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">
                    Communication Channel
                  </label>
                  <select
                    value={newAgent.channel}
                    onChange={(e) => setNewAgent({ ...newAgent, channel: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="voice">Voice Call</option>
                    <option value="sms">SMS Text</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Target Priority
                  </label>
                  <select
                    value={newAgent.targetPriority}
                    onChange={(e) => setNewAgent({ ...newAgent, targetPriority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Schedule
                </label>
                <select
                  value={newAgent.schedule}
                  onChange={(e) => setNewAgent({ ...newAgent, schedule: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {scheduleOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Message Template <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newAgent.message}
                  onChange={(e) => setNewAgent({ ...newAgent, message: e.target.value })}
                  placeholder="Use {customer}, {amount}, {invoice}, {days} as placeholders"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Available placeholders: {'{customer}'}, {'{amount}'}, {'{invoice}'}, {'{days}'}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleAddAgent}
                  disabled={!newAgent.name || !newAgent.message}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Create Agent
                </button>
                <button
                  onClick={() => setShowAddAgentModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {editingAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl mb-1">Edit AI Agent</h3>
                <p className="text-sm text-white/80">Update agent configuration</p>
              </div>
              <button
                onClick={() => setEditingAgent(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-2">
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingAgent.name}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">
                    Communication Channel
                  </label>
                  <select
                    value={editingAgent.channel}
                    onChange={(e) => setEditingAgent({ ...editingAgent, channel: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="voice">Voice Call</option>
                    <option value="sms">SMS Text</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Target Priority
                  </label>
                  <select
                    value={editingAgent.targetPriority}
                    onChange={(e) => setEditingAgent({ ...editingAgent, targetPriority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Schedule
                </label>
                <select
                  value={editingAgent.schedule}
                  onChange={(e) => setEditingAgent({ ...editingAgent, schedule: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {scheduleOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Message Template <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editingAgent.message}
                  onChange={(e) => setEditingAgent({ ...editingAgent, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Available placeholders: {'{customer}'}, {'{amount}'}, {'{invoice}'}, {'{days}'}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleUpdateAgent}
                  disabled={!editingAgent.name || !editingAgent.message}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Pencil size={20} />
                  Update Agent
                </button>
                <button
                  onClick={() => setEditingAgent(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-6 rounded-t-xl">
              <h3 className="text-xl mb-1">Delete AI Agent</h3>
              <p className="text-sm text-white/80">This action cannot be undone</p>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <div>
                  <p className="mb-2">
                    Are you sure you want to delete the agent "{deletingAgent.name}"?
                  </p>
                  <p className="text-sm text-gray-600">
                    This will stop all automated collection activities for this agent.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteAgent}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Delete Agent
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingAgent(null);
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

      {/* Execution Modal */}
      {showExecutionModal && executingAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl mb-1">Agent Execution: {executingAgent.name}</h3>
                <p className="text-sm text-white/80">
                  {isExecuting ? 'Contacting customers...' : 'Execution complete'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowExecutionModal(false);
                  setExecutingAgent(null);
                  setExecutionResults([]);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                disabled={isExecuting}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {isExecuting && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Processing customers...</p>
                </div>
              )}

              {!isExecuting && executionResults.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No customers found matching the target priority category.</p>
                  <p className="text-sm text-gray-500">
                    Try adjusting your agent's target priority or add more debt records.
                  </p>
                </div>
              )}

              {executionResults.length > 0 && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-green-600" size={20} />
                      <p className="text-green-700">
                        Successfully contacted {executionResults.length} customer{executionResults.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {executionResults.map((result, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="">{result.customer}</p>
                          <p className="text-sm text-gray-600">{result.contact}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(result.channel)}
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            result.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                        {result.message}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}