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
    <header className="bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 safe-area-pt shadow">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div>
          {title ? (
            <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>
          ) : null}
        </div>

        {showNotifications && (
          <div className="relative">
            <button className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200">
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