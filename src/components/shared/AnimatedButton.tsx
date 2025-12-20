/**
 * Animated Button Component
 * 
 * A button component with smooth animations, multiple variants, and loading states.
 * Built with Motion for React for performant animations.
 * 
 * @module AnimatedButton
 */

import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Props for the AnimatedButton component
 */
interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional Lucide icon component */
  icon?: LucideIcon;
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  /** Size variant of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state - shows spinner and disables interaction */
  loading?: boolean;
  /** Button content */
  children: ReactNode;
}

/**
 * AnimatedButton - A button with smooth hover/tap animations and loading states
 * 
 * @param props - Component props
 * @returns Animated button component
 * 
 * @example
 * ```tsx
 * <AnimatedButton
 *   variant="primary"
 *   size="md"
 *   icon={Save}
 *   loading={isSaving}
 *   onClick={handleSave}
 * >
 *   Save Changes
 * </AnimatedButton>
 * ```
 */
export function AnimatedButton({
  icon: Icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: AnimatedButtonProps) {
  // Base styles applied to all buttons
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant-specific styles
  const variantClasses = {
    primary: 'bg-pink-600 text-white hover:bg-pink-700 focus:ring-pink-500 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };
  
  // Size-specific styles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  // Icon size mapping
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          {/* Loading spinner */}
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={iconSize} aria-hidden="true" />}
          {children}
        </>
      )}
    </motion.button>
  );
}