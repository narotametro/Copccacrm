/**
 * Priority Tasks Panel Component
 * AI-recommended actions with priority sorting
 */

import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Task {
  type: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  score: number;
  suggestedAction?: string;
}

interface PriorityTasksPanelProps {
  recommendations: Task[];
}

const priorityStyles = {
  urgent: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-600 text-white',
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-600 text-white',
  },
  medium: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-600 text-white',
  },
  low: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    badge: 'bg-gray-600 text-white',
  },
};

export function PriorityTasksPanel({ recommendations }: PriorityTasksPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-pink-600" />
          <h2 className="text-xl font-semibold text-gray-900">Priority Actions</h2>
          <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">
            AI Recommended
          </span>
        </div>
        <Button variant="ghost" size="sm">View All</Button>
      </div>

      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <p>All caught up! No urgent actions</p>
          </div>
        ) : (
          recommendations.slice(0, 5).map((task, index) => {
            const styles = priorityStyles[task.priority];

            return (
              <div
                key={index}
                className={`${styles.bg} border ${styles.border} rounded-lg p-4 hover:shadow-md transition`}
              >
                <div className="flex items-start gap-3">
                  <Circle className="w-5 h-5 text-gray-400 mt-0.5" />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 ${styles.badge} text-xs font-medium rounded uppercase`}>
                        {task.priority}
                      </span>
                      <span className="px-2 py-0.5 bg-white text-gray-700 text-xs font-medium rounded">
                        Score: {task.score}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {task.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {task.description}
                    </p>

                    {task.suggestedAction && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-xs">
                          {task.suggestedAction}
                        </Button>
                        <button className="text-xs text-gray-500 hover:text-gray-700">
                          Snooze
                        </button>
                      </div>
                    )}
                  </div>

                  <Clock className={`w-4 h-4 ${styles.text}`} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
