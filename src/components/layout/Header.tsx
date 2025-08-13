import React from 'react';
import { Bell, User as UserIcon } from 'lucide-react';
import { NavBarContainer } from './NavBarContainer';

interface HeaderProps {
  title: string;
  showNotifications?: boolean;
  notificationCount?: number;
  // When provided, the header will render avatar + greeting on the left
  greetingName?: string;
  greetingPhoto?: string;
  // Optional extra content (e.g., search/sort) rendered in a second row inside the header
  subContent?: React.ReactNode;
  // Use a transparent/plain header instead of the brand gradient
  plain?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showNotifications = true,
  notificationCount = 0,
  greetingName,
  greetingPhoto,
  subContent,
  plain
}) => {

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const isPlain = !!plain;
  const headerClass = isPlain
    ? 'bg-transparent px-4 py-3 safe-area-pt'
    : 'bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 safe-area-pt shadow';
  const primaryText = isPlain ? 'text-gray-900' : 'text-white';
  const subtleText = isPlain ? 'text-gray-500' : 'text-white/80';
  const notifBtn = isPlain
    ? 'p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100'
    : 'p-2 text-white/90 hover:text-white hover:bg-white/10';

  return (
    <header className={headerClass}>
      <NavBarContainer>
        <div className="min-w-0">
          {greetingName ? (
            <div className="flex items-center gap-3">
              {greetingPhoto ? (
                <img 
                  src={greetingPhoto} 
                  alt={greetingName}
                  className={`w-10 h-10 rounded-full object-cover ${isPlain ? '' : 'ring-2 ring-white/20'}`}
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPlain ? 'bg-blue-100' : 'bg-white/20'}`}>
                  <UserIcon className={`w-5 h-5 ${isPlain ? 'text-blue-600' : 'text-white'}`} />
                </div>
              )}
              <div className="leading-tight">
                <p className={`text-base font-semibold truncate ${primaryText}`}>Good {getTimeOfDay()} {greetingName}</p>
                <p className={`text-xs ${subtleText}`}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          ) : (
            title ? (
              <h1 className={`text-lg font-semibold tracking-tight ${primaryText}`}>{title}</h1>
            ) : null
          )}
        </div>

        {showNotifications && (
          <div className="relative">
            <button className={`${notifBtn} rounded-lg transition-colors duration-200`}>
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          </div>
        )}
      </NavBarContainer>
      {subContent ? (
        <div className="mt-3">
          <NavBarContainer>
            <div className="w-full">{subContent}</div>
          </NavBarContainer>
        </div>
      ) : null}
    </header>
  );
};