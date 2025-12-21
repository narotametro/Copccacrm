import { useEffect, useRef } from 'react';
import { toast } from 'sonner@2.0.3';
import { Bell } from 'lucide-react';

interface DebtRecord {
  id: number;
  customer: string;
  amount: number;
  scheduledFollowUp?: {
    dateTime: string;
    method: string;
    notes?: string;
    reminderEnabled: boolean;
    completed: boolean;
  };
}

const REMINDER_CHECK_INTERVAL = 60000; // Check every minute
const REMINDER_ADVANCE_TIME = 15 * 60000; // 15 minutes before

export function useDebtReminders(records: DebtRecord[]) {
  const notifiedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      const reminderWindow = now + REMINDER_ADVANCE_TIME;

      records.forEach((record) => {
        // Skip if no scheduled follow-up or reminder disabled
        if (!record.scheduledFollowUp?.reminderEnabled || record.scheduledFollowUp?.completed) {
          return;
        }

        // Skip if already notified
        if (notifiedRef.current.has(record.id)) {
          return;
        }

        const followUpTime = new Date(record.scheduledFollowUp.dateTime).getTime();
        
        // Check if follow-up is overdue
        if (followUpTime < now) {
          notifiedRef.current.add(record.id);
          toast.error(
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Overdue Follow-up!</p>
                <p className="text-sm text-gray-600 mt-1">
                  {record.customer} - ${record.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Scheduled: {new Date(record.scheduledFollowUp.dateTime).toLocaleString()}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Method: {record.scheduledFollowUp.method}
                </p>
              </div>
            </div>,
            {
              duration: 10000,
              position: 'top-right',
            }
          );
        }
        // Check if follow-up is coming up soon
        else if (followUpTime <= reminderWindow) {
          notifiedRef.current.add(record.id);
          const minutesUntil = Math.round((followUpTime - now) / 60000);
          
          toast.info(
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Follow-up Reminder</p>
                <p className="text-sm text-gray-600 mt-1">
                  {record.customer} - ${record.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  In {minutesUntil} minute{minutesUntil !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Method: {record.scheduledFollowUp.method}
                </p>
                {record.scheduledFollowUp.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    "{record.scheduledFollowUp.notes}"
                  </p>
                )}
              </div>
            </div>,
            {
              duration: 8000,
              position: 'top-right',
            }
          );
        }
      });
    };

    // Check immediately on mount
    checkReminders();

    // Set up interval to check periodically
    const intervalId = setInterval(checkReminders, REMINDER_CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [records]);

  // Clean up notified IDs when records change
  useEffect(() => {
    const currentIds = new Set(records.map(r => r.id));
    const notifiedIds = Array.from(notifiedRef.current);
    
    // Remove notified IDs that no longer exist in records
    notifiedIds.forEach(id => {
      if (!currentIds.has(id)) {
        notifiedRef.current.delete(id);
      }
    });
  }, [records]);

  return {
    upcomingReminders: records.filter(r => {
      if (!r.scheduledFollowUp?.reminderEnabled || r.scheduledFollowUp?.completed) {
        return false;
      }
      const followUpTime = new Date(r.scheduledFollowUp.dateTime).getTime();
      const now = Date.now();
      const reminderWindow = now + REMINDER_ADVANCE_TIME;
      return followUpTime > now && followUpTime <= reminderWindow;
    }),
    overdueReminders: records.filter(r => {
      if (!r.scheduledFollowUp?.reminderEnabled || r.scheduledFollowUp?.completed) {
        return false;
      }
      const followUpTime = new Date(r.scheduledFollowUp.dateTime).getTime();
      return followUpTime < Date.now();
    }),
  };
}
