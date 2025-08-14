import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'plain';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'md',
  variant = 'default',
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const baseClasses =
    variant === 'plain'
      ? `rounded-xl ${paddingClasses[padding]} bg-transparent shadow-none border-0`
      : `rounded-xl border ${paddingClasses[padding]} bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700`;
  const interactiveClasses = onClick
    ? (variant === 'plain'
        ? 'cursor-pointer transition duration-200 active:scale-[0.98]'
        : 'cursor-pointer hover:shadow-md hover:border-gray-300 transition duration-200 active:scale-[0.98]')
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