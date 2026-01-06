import { Calendar, Clock, X, MessageSquare, PhoneCall, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface FollowUp {
  id: string;
  date: string;
  time: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting';
  notes: string;
  status: 'scheduled' | 'completed' | 'missed';
  createdAt: string;
}

interface ScheduleFollowUpModalProps {
  onClose: () => void;
  record: any;
}

export function ScheduleFollowUpModal({ 
  onClose, 
  record
}: ScheduleFollowUpModalProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>(record.followUps || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({
    date: '',
    time: '',
    type: 'call' as 'call' | 'email' | 'whatsapp' | 'meeting',
    notes: '',
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall size={18} className="text-blue-600" />;
      case 'email':
        return <MessageSquare size={18} className="text-purple-600" />;
      case 'whatsapp':
        return <MessageSquare size={18} className="text-green-600" />;
      case 'meeting':
        return <MessageSquare size={18} className="text-orange-600" />;
      default:
        return <Calendar size={18} />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      call: 'Phone Call',
      email: 'Email',
      whatsapp: 'WhatsApp',
      meeting: 'In-Person Meeting'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      missed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Missed' },
    };
    return configs[status as keyof typeof configs] || configs.scheduled;
  };

  const handleAddFollowUp = () => {
    if (!newFollowUp.date || !newFollowUp.time) {
      toast.error('Please fill in date and time');
      return;
    }

    const followUp: FollowUp = {
      id: Date.now().toString(),
      ...newFollowUp,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    const updatedFollowUps = [...followUps, followUp];
    setFollowUps(updatedFollowUps);
    setShowAddForm(false);
    setNewFollowUp({
      date: '',
      time: '',
      type: 'call',
      notes: '',
    });
    toast.success('Follow-up scheduled successfully');
  };

  const handleUpdateStatus = (followUpId: string, newStatus: 'completed' | 'missed') => {
    const updatedFollowUps = followUps.map(f =>
      f.id === followUpId ? { ...f, status: newStatus } : f
    );
    setFollowUps(updatedFollowUps);
    toast.success(`Follow-up marked as ${newStatus}`);
  };

  const handleDeleteFollowUp = (followUpId: string) => {
    const updatedFollowUps = followUps.filter(f => f.id !== followUpId);
    setFollowUps(updatedFollowUps);
    toast.success('Follow-up deleted');
  };

  const handleSave = () => {
    record.followUps = followUps;
    toast.success('Follow-ups saved successfully');
    onClose();
  };

  const sortedFollowUps = [...followUps].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`).getTime();
    const dateB = new Date(`${b.date}T${b.time}`).getTime();
    return dateA - dateB;
  });

  const upcomingFollowUps = sortedFollowUps.filter(f => 
    f.status === 'scheduled' && new Date(`${f.date}T${f.time}`) > new Date()
  );
  const pastFollowUps = sortedFollowUps.filter(f => 
    f.status !== 'scheduled' || new Date(`${f.date}T${f.time}`) <= new Date()
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-xl mb-1">Schedule Follow-up</h3>
              <p className="text-sm text-white/80">{record.customer}</p>
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
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="text-blue-600" size={20} />
                <p className="text-sm text-gray-600">Upcoming</p>
              </div>
              <p className="text-2xl text-blue-600">{upcomingFollowUps.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="text-green-600" size={20} />
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <p className="text-2xl text-green-600">
                {followUps.filter(f => f.status === 'completed').length}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="text-red-600" size={20} />
                <p className="text-sm text-gray-600">Missed</p>
              </div>
              <p className="text-2xl text-red-600">
                {followUps.filter(f => f.status === 'missed').length}
              </p>
            </div>
          </div>

          {/* Add Follow-up Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Calendar size={20} />
              Schedule New Follow-up
            </button>
          )}

          {/* Add Follow-up Form */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg">New Follow-up</h4>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewFollowUp({ date: '', time: '', type: 'call', notes: '' });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newFollowUp.date}
                      onChange={(e) => setNewFollowUp({ ...newFollowUp, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={newFollowUp.time}
                      onChange={(e) => setNewFollowUp({ ...newFollowUp, time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Follow-up Type
                  </label>
                  <select
                    value={newFollowUp.type}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, type: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="call">Phone Call</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="meeting">In-Person Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newFollowUp.notes}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
                    placeholder="Add any notes or reminders..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleAddFollowUp}
                  disabled={!newFollowUp.date || !newFollowUp.time}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Follow-up
                </button>
              </div>
            </div>
          )}

          {/* Upcoming Follow-ups */}
          {upcomingFollowUps.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3">Upcoming Follow-ups</h4>
              <div className="space-y-3">
                {upcomingFollowUps.map((followUp) => {
                  const statusConfig = getStatusConfig(followUp.status);
                  return (
                    <div
                      key={followUp.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(followUp.type)}
                          <div>
                            <p className="">{getTypeLabel(followUp.type)}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(followUp.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })} at {followUp.time}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {followUp.notes && (
                        <p className="text-sm text-gray-600 mb-3 p-3 bg-gray-50 rounded-lg">
                          {followUp.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(followUp.id, 'completed')}
                          className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(followUp.id, 'missed')}
                          className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Mark Missed
                        </button>
                        <button
                          onClick={() => handleDeleteFollowUp(followUp.id)}
                          className="ml-auto px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Follow-ups */}
          {pastFollowUps.length > 0 && (
            <div>
              <h4 className="mb-3">Past Follow-ups</h4>
              <div className="space-y-3">
                {pastFollowUps.map((followUp) => {
                  const statusConfig = getStatusConfig(followUp.status);
                  return (
                    <div
                      key={followUp.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(followUp.type)}
                          <div>
                            <p className="text-sm">{getTypeLabel(followUp.type)}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(followUp.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })} at {followUp.time}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {followUp.notes && (
                        <p className="text-xs text-gray-600 mt-2 p-2 bg-white rounded">
                          {followUp.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {followUps.length === 0 && !showAddForm && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No follow-ups scheduled yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Schedule your first follow-up to stay on top of collections
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Save Follow-ups
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}