import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div
      className={`glass dark:bg-slate-800 dark:border-slate-700 rounded-xl p-6 ${
        hover ? 'hover:shadow-xl transition-shadow duration-300' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
