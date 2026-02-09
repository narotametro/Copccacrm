import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'large';
  icon?: LucideIcon;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700 shadow-lg shadow-primary-500/30',
    secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
    outline: 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400',
    default: 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700 shadow-lg shadow-primary-500/30',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
    large: 'px-6 py-3 text-lg',
  };

  const actualVariant = variant as keyof typeof variants;
  const actualSize = size as keyof typeof sizes;

  return (
    <button
      type="button"
      className={`${baseStyles} ${variants[actualVariant]} ${sizes[actualSize]} ${className}`}
      tabIndex={-1}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' || size === 'xl' || size === 'large' ? 24 : 20} />}
      {children}
    </button>
  );
};
