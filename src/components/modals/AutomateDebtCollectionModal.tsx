import { X, Bot, Calendar, MessageSquare, Sparkles, Clock, CheckCircle2, Send, Loader2, Mail, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCurrency } from '../lib/currency-context';
import { formatNumberWithCommas } from '../lib/utils';

interface AutomateDebtCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    id: number;
    customer: string;
    amount: number;
    daysOverdue: number;
    invoiceNumber?: string;
    dueDate?: string;
    automation?: {
      isActive: boolean;
      message: string;
      schedule: ScheduleItem[];
      activatedAt: string;
    };
  };
  onSave: (automationData: any) => void;
}

interface ScheduleItem {
  id: string;
  day: number;
  time: string;
  channel: 'whatsapp' | 'sms' | 'call' | 'email';
  channelLabel: string;
  icon: any;
  color: string;
}

export function AutomateDebtCollectionModal({ isOpen, onClose, record, onSave }: AutomateDebtCollectionModalProps) {
  const { currencySymbol } = useCurrency();
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      console.log('AutomateDebtCollectionModal opened with record:', record);
      
      // If automation already exists, load it for editing
      if (record.automation?.isActive) {
        setMessage(record.automation.message || '');
        setSchedule(record.automation.schedule || []);
        setIsGenerating(false);
      } else {
        // Generate new content for first-time automation
        generateAIContent();
      }
    }
  }, [isOpen, record]);

  const generateAIContent = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate AI message
    const aiMessage = `Dear ${record.customer},

This is a friendly reminder regarding Invoice ${record.invoiceNumber || '#' + record.id}, which is currently ${record.daysOverdue} days overdue.

Outstanding Amount: ${currencySymbol}${formatNumberWithCommas(record.amount)}
Due Date: ${record.dueDate || 'N/A'}

We kindly request your immediate attention to settle this payment. If you have already made the payment, please disregard this message.

For any questions or payment arrangements, please contact us.

Thank you for your cooperation.`;

    setMessage(aiMessage);

    // Generate AI schedule
    const aiSchedule: ScheduleItem[] = [
      {
        id: '1',
        day: 0,
        time: '09:00 AM',
        channel: 'whatsapp',
        channelLabel: 'WhatsApp',
        icon: MessageSquare,
        color: 'green'
      },
      {
        id: '2',
        day: 2,
        time: '10:00 AM',
        channel: 'sms',
        channelLabel: 'SMS',
        icon: MessageSquare,
        color: 'blue'
      },
      {
        id: '3',
        day: 4,
        time: '02:00 PM',
        channel: 'call',
        channelLabel: 'Phone Call',
        icon: Calendar,
        color: 'purple'
      },
      {
        id: '4',
        day: 7,
        time: '11:00 AM',
        channel: 'email',
        channelLabel: 'Email',
        icon: MessageSquare,
        color: 'orange'
      },
    ];

    setSchedule(aiSchedule);
    setIsGenerating(false);
  };

  const handleAutomate = async () => {
    setIsAutomating(true);
    
    try {
      // Create automation data
      const automationData = {
        isActive: true,
        isPaused: false,
        message: message,
        schedule: schedule,
        activatedAt: new Date().toISOString()
      };
      
      // Save automation data
      await onSave(automationData);
      
      // Simulate automation process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Automated Debt Collection Activated!', {
        description: `${schedule.length} follow-ups scheduled for ${record.customer}`
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to activate automation:', error);
      toast.error('Failed to activate automation');
    } finally {
      setIsAutomating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Bot size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Automate Debt Collection</h2>
                <p className="text-purple-100 text-sm">AI-Powered Follow-up Sequence</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Customer Info Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium mb-1">Customer</p>
                <p className="font-semibold text-gray-900">{record.customer}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-600 font-medium mb-1">Outstanding Amount</p>
                <p className="text-xl font-bold text-purple-700">
                  {currencySymbol}{formatNumberWithCommas(record.amount)}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200 flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                <span className="font-medium text-gray-700">Invoice:</span> {record.invoiceNumber || '#' + record.id}
              </span>
              <span className="text-gray-600">
                <span className="font-medium text-gray-700">Overdue:</span> {record.daysOverdue} days
              </span>
            </div>
          </div>

          {/* AI-Generated Message */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-purple-500" />
              <label className="font-semibold text-gray-900">AI-Generated Message</label>
              {isGenerating && (
                <span className="text-xs text-purple-600 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  Generating...
                </span>
              )}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
              placeholder="Edit your message here..."
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Personalize this message before automating the follow-up sequence
            </p>
          </div>

          {/* AI-Suggested Schedule */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-pink-500" />
              <label className="font-semibold text-gray-900">AI-Suggested Follow-up Schedule</label>
            </div>
            
            {isGenerating ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {schedule.map((item, index) => {
                  const Icon = item.icon;
                  const colorClasses = {
                    green: 'bg-green-50 border-green-200 text-green-700',
                    blue: 'bg-blue-50 border-blue-200 text-blue-700',
                    purple: 'bg-purple-50 border-purple-200 text-purple-700',
                    orange: 'bg-orange-50 border-orange-200 text-orange-700',
                  };
                  
                  return (
                    <div 
                      key={item.id}
                      className={`rounded-xl p-4 border-2 ${colorClasses[item.color as keyof typeof colorClasses]} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <Icon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{item.channelLabel}</span>
                            <span className="text-xs px-2 py-0.5 bg-white rounded-full font-medium">
                              Day {item.day}
                            </span>
                          </div>
                          <p className="text-sm opacity-90">
                            {item.day === 0 ? 'Today' : `In ${item.day} days`} at {item.time}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium opacity-75">Step {index + 1}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex gap-3">
                <Clock size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-1">Smart Escalation</p>
                  <p className="text-xs text-yellow-700">
                    The AI will automatically escalate through communication channels based on response rates.
                    If customer doesn't respond, follow-ups will continue as scheduled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium text-gray-700"
              disabled={isAutomating}
            >
              Cancel
            </button>
            <button
              onClick={handleAutomate}
              disabled={isGenerating || isAutomating || !message.trim()}
              className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-opacity font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
            >
              {isAutomating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Activating Automation...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Start Automated Follow-ups
                </>
              )}
            </button>
          </div>
          
          {!isGenerating && schedule.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle2 size={16} className="text-green-600" />
              <span>{schedule.length} follow-ups will be scheduled automatically</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}