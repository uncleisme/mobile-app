import React from 'react';
import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  showNotifications?: boolean;
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showNotifications = true,
  notificationCount = 0 
}) => {

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 safe-area-pt">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div>
          {title ? (
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          ) : null}
        </div>
        
        {showNotifications && (
          <div className="relative">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};