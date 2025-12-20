import { Plus } from 'lucide-react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actions?: ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  actions
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl mb-2">{title}</h2>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {actionLabel && onAction && (
          <button 
            onClick={onAction}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2"
            aria-label={actionLabel}
          >
            <Plus size={20} aria-hidden="true" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
