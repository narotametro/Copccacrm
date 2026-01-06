import { memo } from 'react';
import { Calendar, MessageSquare, Trash2, Edit2, Phone, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { formatNumberWithCommas } from '../lib/utils';
import { useCurrency } from '../lib/currency-context';
import { openWhatsApp, createDebtReminderMessage } from '../lib/whatsapp-utils';

interface DebtCollectionRowProps {
  record: any;
  onEdit: (record: any) => void;
  onDelete: (id: number) => void;
  onSchedule: (record: any) => void;
}

export const DebtCollectionRow = memo(function DebtCollectionRow({
  record,
  onEdit,
  onDelete,
  onSchedule
}: DebtCollectionRowProps) {
  const { currencySymbol } = useCurrency();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-50';
      case 'Partial': return 'text-blue-600 bg-blue-50';
      case 'Pending': return 'text-yellow-600 bg-yellow-50';
      case 'Overdue': return 'text-red-600 bg-red-50';
      case 'Resolved': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleWhatsAppClick = () => {
    if (record.whatsapp) {
      const message = createDebtReminderMessage(
        record.customer,
        record.amount,
        currencySymbol,
        record.daysOverdue,
        record.invoiceNumber
      );
      openWhatsApp(record.whatsapp, message);
    }
  };

  const isScheduled = record.scheduledFollowUp && !record.scheduledFollowUp.completed;
  const isOverdue = isScheduled && new Date(record.scheduledFollowUp.dateTime) < new Date();

  return (
    <tr className={`hover:bg-gray-50 border-b border-gray-100 ${isScheduled && !isOverdue ? 'bg-blue-50/30' : ''} ${isOverdue ? 'bg-red-50/30' : ''}`}>
      <td className="px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-900">{record.customer}</div>
            {isScheduled && !isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700" title={`Scheduled: ${new Date(record.scheduledFollowUp.dateTime).toLocaleString()}`}>
                <Clock size={12} />
                Scheduled
              </span>
            )}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse" title="Follow-up overdue!">
                <Clock size={12} />
                Overdue
              </span>
            )}
            {record.scheduledFollowUp?.completed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle2 size={12} />
                Completed
              </span>
            )}
          </div>
          {record.invoiceNumber && (
            <div className="text-sm text-gray-500">#{record.invoiceNumber}</div>
          )}
          {isScheduled && !record.scheduledFollowUp.completed && (
            <div className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-blue-600'}`}>
              {isOverdue ? 'Overdue: ' : 'Next: '}
              {new Date(record.scheduledFollowUp.dateTime).toLocaleString()} 
              {' • '}
              {record.scheduledFollowUp.method}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right font-semibold text-gray-900">
        {currencySymbol}{formatNumberWithCommas(record.amount)}
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-700">{record.daysOverdue} days</span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(record.priority)}`}>
          {record.priority}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
          {record.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(record)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onSchedule(record)}
            className={`p-1.5 rounded-lg transition-colors ${
              isScheduled && !isOverdue
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                : isOverdue
                ? 'bg-red-50 text-red-600 hover:bg-red-100 animate-pulse'
                : 'hover:bg-blue-50 text-blue-600 hover:text-blue-700'
            }`}
            title={isScheduled ? 'Reschedule Follow-up' : 'Schedule Follow-up'}
          >
            <Calendar size={16} />
          </button>
          {record.whatsapp && (
            <button
              onClick={handleWhatsAppClick}
              className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 hover:text-green-700 transition-colors"
              title="Send WhatsApp"
            >
              <MessageSquare size={16} />
            </button>
          )}
          {record.phone && (
            <a
              href={`tel:${record.phone}`}
              className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-600 hover:text-purple-700 transition-colors"
              title="Call"
            >
              <Phone size={16} />
            </a>
          )}
          {record.email && (
            <a
              href={`mailto:${record.email}`}
              className="p-1.5 hover:bg-orange-50 rounded-lg text-orange-600 hover:text-orange-700 transition-colors"
              title="Email"
            >
              <Mail size={16} />
            </a>
          )}
          <button
            onClick={() => onDelete(record.id)}
            className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
});
