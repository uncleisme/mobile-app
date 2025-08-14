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
      ? `rounded-xl ${paddingClasses[padding]} bg-transparent shadow-none border-0 dark:rounded-none dark:p-0`
      : `rounded-xl ${paddingClasses[padding]} bg-white shadow-sm dark:bg-transparent dark:shadow-none dark:rounded-none dark:p-0 dark:border-0`;
  const interactiveClasses = onClick
    ? (variant === 'plain'
        ? 'cursor-pointer transition duration-200 active:scale-[0.98]'
        : 'cursor-pointer hover:shadow-md dark:hover:shadow-none transition duration-200 active:scale-[0.98]')
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