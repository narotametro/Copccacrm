import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondary?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action, secondary }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg mb-2 text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-md mb-6">
        {description}
      </p>
      {action && (
        <div className="flex gap-3">
          <button
            onClick={action.onClick}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all"
          >
            {action.label}
          </button>
          {secondary && (
            <button
              onClick={secondary.onClick}
              className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              {secondary.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
