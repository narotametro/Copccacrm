import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCurrency } from '../lib/currency-context';

interface DebtEditModalProps {
  record: any;
  onClose: () => void;
  onSave: (updates: any) => void;
}

export function DebtEditModal({ record, onClose, onSave }: DebtEditModalProps) {
  const { currencySymbol } = useCurrency();
  const [formData, setFormData] = useState({
    customer: record.customer || '',
    amount: record.amount || 0,
    invoiceNumber: record.invoiceNumber || '',
    daysOverdue: record.daysOverdue || 0,
    priority: record.priority || 'medium',
    status: record.status || 'Pending',
    notes: record.notes || '',
    whatsapp: record.whatsapp || '',
    phone: record.phone || '',
    email: record.email || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process phone numbers: remove leading zero if present
    const processedData = { ...formData };
    
    // Process WhatsApp number
    if (processedData.whatsapp) {
      let cleanWhatsApp = processedData.whatsapp.replace(/\s/g, ''); // Remove spaces
      // If it starts with a country code (+), extract the number part and check for leading zero
      if (cleanWhatsApp.startsWith('+')) {
        const parts = cleanWhatsApp.match(/^(\+\d+)(.*)$/);
        if (parts) {
          const countryCode = parts[1];
          let localNumber = parts[2].replace(/\D/g, ''); // Remove non-digits
          if (localNumber.startsWith('0')) {
            localNumber = localNumber.substring(1); // Remove leading zero
          }
          processedData.whatsapp = `${countryCode}${localNumber}`;
        }
      } else {
        // No country code, just clean the number and remove leading zero
        cleanWhatsApp = cleanWhatsApp.replace(/\D/g, '');
        if (cleanWhatsApp.startsWith('0')) {
          cleanWhatsApp = cleanWhatsApp.substring(1);
        }
        processedData.whatsapp = cleanWhatsApp ? `+${cleanWhatsApp}` : '';
      }
    }
    
    // Process phone number
    if (processedData.phone) {
      let cleanPhone = processedData.phone.replace(/\s/g, ''); // Remove spaces
      // If it starts with a country code (+), extract the number part and check for leading zero
      if (cleanPhone.startsWith('+')) {
        const parts = cleanPhone.match(/^(\+\d+)(.*)$/);
        if (parts) {
          const countryCode = parts[1];
          let localNumber = parts[2].replace(/\D/g, ''); // Remove non-digits
          if (localNumber.startsWith('0')) {
            localNumber = localNumber.substring(1); // Remove leading zero
          }
          processedData.phone = `${countryCode}${localNumber}`;
        }
      } else {
        // No country code, just clean the number and remove leading zero
        cleanPhone = cleanPhone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
          cleanPhone = cleanPhone.substring(1);
        }
        processedData.phone = cleanPhone ? `+${cleanPhone}` : '';
      }
    }
    
    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Payment Record</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount ({currencySymbol}) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days Overdue *
              </label>
              <input
                type="number"
                required
                value={formData.daysOverdue}
                onChange={(e) => setFormData({ ...formData, daysOverdue: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Overdue">Overdue</option>
                <option value="Paid">Paid</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                placeholder="+1234567890 (no leading 0)"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+1234567890 (no leading 0)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Add any additional notes..."
            />
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
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
