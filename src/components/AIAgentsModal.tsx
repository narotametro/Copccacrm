import { Bot, MessageSquare, PhoneCall, Phone, X, Plus, Pencil, Trash2, Play, Pause, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface AIAgent {
  id: string;
  name: string;
  status: 'active' | 'paused';
  channel: 'voice' | 'sms' | 'whatsapp';
  targetPerformance: string;
  schedule: string;
  message: string;
  createdAt: string;
}

interface AIAgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers?: any[];
}

export function AIAgentsModal({ isOpen, onClose, customers = [] }: AIAgentsModalProps) {
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([
    {
      id: '1',
      name: 'At-Risk Customer Recovery',
      status: 'active',
      channel: 'whatsapp',
      targetPerformance: 'needsAttention',
      schedule: 'Weekly on Monday',
      message: 'Hi {customer}, we noticed you haven\'t ordered in a while. How can we help improve our service?',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Star Customer Appreciation',
      status: 'active',
      channel: 'voice',
      targetPerformance: 'star',
      schedule: 'Monthly on 1st',
      message: 'Thank you for being a valued customer! We appreciate your continued partnership.',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Active Customer Check-in',
      status: 'paused',
      channel: 'sms',
      targetPerformance: 'active',
      schedule: 'Bi-weekly on Friday',
      message: 'Hi {customer}, just checking in! Is there anything we can help you with?',
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
    targetPerformance: 'needsAttention',
    schedule: 'Weekly',
    message: '',
  });

  const performanceOptions = [
    { value: 'needsAttention', label: 'Needs Attention (At Risk)', color: 'text-red-600' },
    { value: 'average', label: 'Average Performance', color: 'text-gray-600' },
    { value: 'active', label: 'Active Customers', color: 'text-blue-600' },
    { value: 'excellent', label: 'Excellent Performance', color: 'text-green-600' },
    { value: 'star', label: 'Star Customers', color: 'text-yellow-600' },
  ];

  const scheduleOptions = [
    'Daily',
    'Weekly on Monday',
    'Weekly on Friday',
    'Bi-weekly',
    'Monthly on 1st',
    'Monthly on 15th',
    'Quarterly',
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

  const getPerformanceLabel = (value: string) => {
    return performanceOptions.find(opt => opt.value === value)?.label || value;
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
    toast.success('AI Agent created successfully');
    setShowAddAgentModal(false);
    resetForm();
  };

  const handleEditAgent = () => {
    if (!editingAgent) return;

    if (!editingAgent.name || !editingAgent.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAiAgents(aiAgents.map(agent => 
      agent.id === editingAgent.id ? editingAgent : agent
    ));
    toast.success('AI Agent updated successfully');
    setEditingAgent(null);
  };

  const handleDeleteAgent = () => {
    if (!deletingAgent) return;

    setAiAgents(aiAgents.filter(agent => agent.id !== deletingAgent.id));
    toast.success('AI Agent deleted successfully');
    setShowDeleteModal(false);
    setDeletingAgent(null);
  };

  const toggleAgentStatus = (agentId: string) => {
    setAiAgents(aiAgents.map(agent => {
      if (agent.id === agentId) {
        const newStatus = agent.status === 'active' ? 'paused' : 'active';
        toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'paused'}`);
        return { ...agent, status: newStatus };
      }
      return agent;
    }));
  };

  const handleActNow = async (agent: AIAgent) => {
    setExecutingAgent(agent);
    setShowExecutionModal(true);
    setIsExecuting(true);
    setExecutionResults([]);

    // Log for debugging
    console.log('Total customers:', customers.length);
    console.log('Target performance:', agent.targetPerformance);

    // Filter customers based on performance category
    const targetCustomers = customers.filter(customer => {
      const performanceCategory = customer.performanceCategory?.toLowerCase() || '';
      const target = agent.targetPerformance.toLowerCase();
      
      console.log(`Customer ${customer.customer} has category: ${performanceCategory}`);
      
      // Match the agent's target performance with customer's performance category
      if (target === 'needsattention') return performanceCategory === 'needs-attention';
      if (target === 'average') return performanceCategory === 'average';
      if (target === 'active') return performanceCategory === 'good' || performanceCategory === 'active';
      if (target === 'excellent') return performanceCategory === 'excellent';
      if (target === 'star') return performanceCategory === 'star';
      if (target === 'good') return performanceCategory === 'good';
      
      return false;
    });

    console.log('Filtered customers:', targetCustomers.length);

    // Simulate execution with a delay
    const results: any[] = [];
    for (let i = 0; i < targetCustomers.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing
      
      const customer = targetCustomers[i];
      const message = agent.message.replace('{customer}', customer.customer || 'Valued Customer');
      const contact = customer.contacts?.[0];
      
      results.push({
        customer: customer.customer,
        contact: contact?.name || 'Unknown',
        phone: contact?.phone || contact?.whatsapp || 'N/A',
        message,
        status: 'success',
        timestamp: new Date().toISOString(),
      });
      
      setExecutionResults([...results]);
    }

    setIsExecuting(false);
    toast.success(`Successfully contacted ${targetCustomers.length} customers`);
  };

  const resetForm = () => {
    setNewAgent({
      name: '',
      channel: 'whatsapp',
      targetPerformance: 'needsAttention',
      schedule: 'Weekly',
      message: '',
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main AI Agents Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bot size={28} />
                <h3 className="text-2xl">AI Follow-up Agents</h3>
              </div>
              <p className="text-sm text-white/80">
                Automate customer follow-up through voice, SMS, and WhatsApp based on performance
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">
                  {aiAgents.filter(a => a.status === 'active').length} active agents • {aiAgents.length} total
                </p>
              </div>
              <button
                onClick={() => setShowAddAgentModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus size={18} />
                Create AI Agent
              </button>
            </div>

            {/* AI Agents List */}
            <div className="space-y-4">
              {aiAgents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Bot size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No AI agents configured yet</p>
                  <button
                    onClick={() => setShowAddAgentModal(true)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Create Your First Agent
                  </button>
                </div>
              ) : (
                aiAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getChannelIcon(agent.channel)}
                          <h4 className="text-lg">{agent.name}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            agent.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {agent.status === 'active' ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Zap size={14} />
                            Channel: {agent.channel.toUpperCase()}
                          </span>
                          <span>
                            Target: {getPerformanceLabel(agent.targetPerformance)}
                          </span>
                          <span>
                            Schedule: {agent.schedule}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAgentStatus(agent.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            agent.status === 'active'
                              ? 'hover:bg-yellow-50 text-yellow-600'
                              : 'hover:bg-green-50 text-green-600'
                          }`}
                          title={agent.status === 'active' ? 'Pause agent' : 'Activate agent'}
                        >
                          {agent.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button
                          onClick={() => setEditingAgent(agent)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit agent"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingAgent(agent);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete agent"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Message Preview */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
                      <p className="text-sm mb-1">Message Template:</p>
                      <p className="text-sm text-purple-900 italic">{agent.message}</p>
                    </div>

                    {/* Act Now Button */}
                    <button
                      onClick={() => handleActNow(agent)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Zap size={18} />
                      Act Now - Execute Agent
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Zap size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-900 mb-1">How AI Agents Work:</p>
                <p className="text-blue-800">
                  AI agents automatically reach out to customers based on their performance category and your configured schedule. 
                  They use natural language processing to personalize messages and can handle voice calls, SMS, and WhatsApp communication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Agent Modal */}
      {(showAddAgentModal || editingAgent) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="text-xl mb-1">
                  {editingAgent ? 'Edit AI Agent' : 'Create AI Agent'}
                </h3>
                <p className="text-sm text-white/80">
                  Configure automated follow-up based on customer performance
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddAgentModal(false);
                  setEditingAgent(null);
                  if (!editingAgent) resetForm();
                }}
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
                  value={editingAgent ? editingAgent.name : newAgent.name}
                  onChange={(e) => {
                    if (editingAgent) {
                      setEditingAgent({ ...editingAgent, name: e.target.value });
                    } else {
                      setNewAgent({ ...newAgent, name: e.target.value });
                    }
                  }}
                  placeholder="e.g., At-Risk Customer Recovery"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Communication Channel</label>
                  <select
                    value={editingAgent ? editingAgent.channel : newAgent.channel}
                    onChange={(e) => {
                      const value = e.target.value as 'voice' | 'sms' | 'whatsapp';
                      if (editingAgent) {
                        setEditingAgent({ ...editingAgent, channel: value });
                      } else {
                        setNewAgent({ ...newAgent, channel: value });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="voice">Voice Call</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Target Performance</label>
                  <select
                    value={editingAgent ? editingAgent.targetPerformance : newAgent.targetPerformance}
                    onChange={(e) => {
                      if (editingAgent) {
                        setEditingAgent({ ...editingAgent, targetPerformance: e.target.value });
                      } else {
                        setNewAgent({ ...newAgent, targetPerformance: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {performanceOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Schedule</label>
                <select
                  value={editingAgent ? editingAgent.schedule : newAgent.schedule}
                  onChange={(e) => {
                    if (editingAgent) {
                      setEditingAgent({ ...editingAgent, schedule: e.target.value });
                    } else {
                      setNewAgent({ ...newAgent, schedule: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {scheduleOptions.map((schedule) => (
                    <option key={schedule} value={schedule}>
                      {schedule}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Message Template <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editingAgent ? editingAgent.message : newAgent.message}
                  onChange={(e) => {
                    if (editingAgent) {
                      setEditingAgent({ ...editingAgent, message: e.target.value });
                    } else {
                      setNewAgent({ ...newAgent, message: e.target.value });
                    }
                  }}
                  placeholder="Write your follow-up message... Use {customer} for customer name"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{customer}'} to insert customer name automatically
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={editingAgent ? handleEditAgent : handleAddAgent}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </button>
                <button
                  onClick={() => {
                    setShowAddAgentModal(false);
                    setEditingAgent(null);
                    if (!editingAgent) resetForm();
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-t-xl flex items-center gap-3">
              <AlertCircle size={24} />
              <div>
                <h3 className="text-xl mb-1">Delete AI Agent</h3>
                <p className="text-sm text-white/80">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{deletingAgent.name}</strong>? 
                This will stop all automated follow-ups for this agent.
              </p>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleDeleteAgent}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full">
            <div className="bg-gradient-to-r from-green-500 to-pink-500 text-white p-6 rounded-t-xl flex items-center gap-3">
              <Zap size={24} />
              <div>
                <h3 className="text-xl mb-1">Executing AI Agent</h3>
                <p className="text-sm text-white/80">Contacting customers based on performance</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Agent <strong>{executingAgent.name}</strong> is contacting customers based on the performance category <strong>{getPerformanceLabel(executingAgent.targetPerformance)}</strong>.
              </p>

              {isExecuting && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  <span className="ml-3 text-gray-600">Processing customers...</span>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {executionResults.map((result, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm flex-1">
                      <p className="text-gray-900 mb-1"><strong>{result.customer}</strong></p>
                      <p className="text-gray-700">
                        Contact: {result.contact} • Phone: {result.phone}
                      </p>
                      <p className="text-gray-700 italic mt-1">
                        "{result.message}"
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {!isExecuting && executionResults.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-green-600" />
                  <p className="text-green-800">
                    Successfully contacted {executionResults.length} customer{executionResults.length !== 1 ? 's' : ''}!
                  </p>
                </div>
              )}

              {!isExecuting && executionResults.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle size={20} className="text-yellow-600" />
                  <p className="text-yellow-800">
                    No customers found matching the target performance category.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowExecutionModal(false);
                    setExecutingAgent(null);
                    setExecutionResults([]);
                  }}
                  disabled={isExecuting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExecuting ? 'Executing...' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}