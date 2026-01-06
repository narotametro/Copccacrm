import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

interface DebtScheduleModalProps {
  record: any;
  onClose: () => void;
  onSchedule: (scheduleData: any) => void;
}

export function DebtScheduleModal({ record, onClose, onSchedule }: DebtScheduleModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    followUpDate: record.scheduledFollowUp?.date || today,
    followUpTime: record.scheduledFollowUp?.time || '09:00',
    method: record.scheduledFollowUp?.method || 'call',
    notes: record.scheduledFollowUp?.notes || '',
    reminderEnabled: record.scheduledFollowUp?.reminderEnabled ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine date and time to create full datetime
    const scheduledDateTime = new Date(`${formData.followUpDate}T${formData.followUpTime}`);
    
    onSchedule({
      scheduledFollowUp: {
        date: formData.followUpDate,
        time: formData.followUpTime,
        dateTime: scheduledDateTime.toISOString(),
        method: formData.method,
        notes: formData.notes,
        reminderEnabled: formData.reminderEnabled,
        scheduledAt: new Date().toISOString(),
        completed: false,
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Schedule Follow-up</h2>
              <p className="text-sm text-blue-100">{record.customer}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Follow-up Date *
              </label>
              <input
                type="date"
                required
                min={today}
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time *
              </label>
              <input
                type="time"
                required
                value={formData.followUpTime}
                onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Follow-up Method *
            </label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="call">Phone Call</option>
              <option value="whatsapp">WhatsApp Message</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="meeting">In-Person Meeting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add notes about this follow-up..."
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.reminderEnabled}
                onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  <span className="font-medium text-gray-900">Enable Reminder Notification</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  You'll receive a notification when it's time for this follow-up
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Calendar size={18} />
              Schedule Follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
