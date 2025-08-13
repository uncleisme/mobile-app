import React from 'react';

interface NavBarContainerProps {
  children: React.ReactNode;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  className?: string;
}

const justifyMap: Record<NonNullable<NavBarContainerProps['justify']>, string> = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

export const NavBarContainer: React.FC<NavBarContainerProps> = ({
  children,
  justify = 'between',
  className = '',
}) => {
  const justifyClass = justifyMap[justify] ?? justifyMap.between;
  return (
    <div className={`flex items-center ${justifyClass} max-w-md mx-auto ${className}`}>
      {children}
    </div>
  );
};
