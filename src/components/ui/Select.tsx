import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  options?: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  icon: Icon,
  options = [],
  className = '',
  children,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
            <Icon size={20} />
          </div>
        )}
        <select
          className={`w-full px-4 py-2 rounded-lg border ${
            error ? 'border-red-500' : 'border-slate-300'
          } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all appearance-none bg-white ${
            Icon ? 'pl-10' : ''
          } ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};