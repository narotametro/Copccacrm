import { useState } from 'react';
import { MoreVertical, Save, Download, History, Share2, Printer, FileText } from 'lucide-react';

interface QuickActionsProps {
  onSave: () => void;
  onExport: (format: 'json' | 'csv') => void;
  onViewHistory: () => void;
  isSaving: boolean;
  isExporting: boolean;
  disabled?: boolean;
}

export function ReportQuickActions({
  onSave,
  onExport,
  onViewHistory,
  isSaving,
  isExporting,
  disabled = false,
}: QuickActionsProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled}
        className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm disabled:opacity-50"
        title="Quick Actions"
      >
        <MoreVertical size={20} />
      </button>

      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] z-50">
            <button
              onClick={() => handleAction(onSave)}
              disabled={isSaving}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Report'}</span>
              <span className="ml-auto text-xs text-gray-400">⌘S</span>
            </button>

            <div className="border-t border-gray-200 my-1" />

            <button
              onClick={() => handleAction(() => onExport('json'))}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50"
            >
              <FileText size={16} />
              <span>Export as JSON</span>
            </button>

            <button
              onClick={() => handleAction(() => onExport('csv'))}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50"
            >
              <Download size={16} />
              <span>Export as CSV</span>
              <span className="ml-auto text-xs text-gray-400">⌘E</span>
            </button>

            <div className="border-t border-gray-200 my-1" />

            <button
              onClick={() => handleAction(onViewHistory)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <History size={16} />
              <span>View History</span>
              <span className="ml-auto text-xs text-gray-400">⌘H</span>
            </button>

            <button
              onClick={() => {
                window.print();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <Printer size={16} />
              <span>Print Report</span>
              <span className="ml-auto text-xs text-gray-400">⌘P</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
