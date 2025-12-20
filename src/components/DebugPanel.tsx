import { useState } from 'react';
import { Bug } from 'lucide-react';

interface DebugPanelProps {
  data: Record<string, any>;
  label?: string;
}

/**
 * Temporary debug component to help identify data type issues
 * Remove this component after debugging is complete
 */
export function DebugPanel({ data, label = 'Debug Data' }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const checkType = (key: string, value: any) => {
    const type = Array.isArray(value) ? 'array' : typeof value;
    const length = Array.isArray(value) ? value.length : 'N/A';
    const isOk = Array.isArray(value);
    
    return { key, type, length, isOk, value };
  };

  const dataInfo = Object.entries(data).map(([key, value]) => 
    checkType(key, value)
  );

  const hasIssues = dataInfo.some(info => !info.isOk && info.type !== 'function');

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
          hasIssues ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`}
      >
        <Bug size={16} />
        <span>{label}</span>
        {hasIssues && <span className="ml-2 bg-white text-red-500 px-2 rounded">!</span>}
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-md max-h-96 overflow-auto">
          <div className="mb-2 pb-2 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">{label}</h3>
            <p className="text-xs text-gray-500">Development Debug Panel</p>
          </div>
          
          <div className="space-y-2">
            {dataInfo.map((info, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${
                  !info.isOk && info.type !== 'function' 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{info.key}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      info.type === 'array'
                        ? 'bg-green-100 text-green-700'
                        : info.type === 'function'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {info.type}
                  </span>
                </div>
                {info.type === 'array' && (
                  <div className="text-xs text-gray-600">
                    Length: {info.length}
                  </div>
                )}
                {!info.isOk && info.type !== 'function' && (
                  <div className="text-xs text-red-600 mt-1">
                    ⚠️ Expected array, got {info.type}
                  </div>
                )}
                {info.type !== 'function' && info.type !== 'array' && (
                  <div className="text-xs text-gray-500 mt-1 font-mono">
                    {JSON.stringify(info.value)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => console.log(`[${label}]`, data)}
              className="text-xs text-blue-600 hover:underline"
            >
              Log full data to console
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
