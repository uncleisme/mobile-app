import React, { useEffect, useRef, useState } from 'react';
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
  // Optional: content to show in a dropdown when clicking the bell icon
  notificationsContent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showNotifications = true,
  notificationCount = 0,
  greetingName,
  greetingPhoto,
  subContent,
  plain,
  notificationsContent
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

  // Notifications dropdown state + outside click handler
  const [open, setOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!notifRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!notifRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

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
                  className={`w-[3.25rem] h-[3.25rem] rounded-full object-cover ${isPlain ? '' : 'ring-2 ring-white/20'}`}
                />
              ) : (
                <div className={`w-[3.25rem] h-[3.25rem] rounded-full flex items-center justify-center ${isPlain ? 'bg-blue-100' : 'bg-white/20'}`}>
                  <UserIcon className={`w-[1.625rem] h-[1.625rem] ${isPlain ? 'text-blue-600' : 'text-white'}`} />
                </div>
              )}
              <div className="leading-tight">
                <p className={`text-[1.3rem] font-semibold truncate ${primaryText}`}>Good {getTimeOfDay()} {greetingName}</p>
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
          <div className="relative" ref={notifRef}>
            <button
              className={`${notifBtn} rounded-lg transition-colors duration-200 relative`}
              onClick={() => setOpen(o => !o)}
              aria-label="Open notifications"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            {open && (
              <div className={`absolute right-0 mt-2 w-[22rem] max-w-[90vw] z-50 ${isPlain ? 'bg-white' : 'bg-white'} shadow-lg rounded-xl ring-1 ring-black/5 overflow-hidden`}>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">Today's Work Orders</h4>
                    {notificationCount > 0 && (
                      <span className="text-xs text-gray-500">{notificationCount}</span>
                    )}
                  </div>
                  {notificationsContent ? (
                    <div className="space-y-3 max-h-[60vh] overflow-auto">
                      {notificationsContent}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">No work orders scheduled for today</p>
                  )}
                </div>
              </div>
            )}
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