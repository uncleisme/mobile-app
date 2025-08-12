import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick,
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const baseClasses = `rounded-xl border ${paddingClasses[padding]} bg-gradient-to-br from-brand-50/50 to-white shadow-sm border-brand-100`;
  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:shadow-md hover:border-brand-200 transition duration-200 active:scale-[0.98]'
    : '';

  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};