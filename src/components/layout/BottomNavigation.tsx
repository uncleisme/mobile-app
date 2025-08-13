import React from 'react';
import { Home, ClipboardList, Calendar, User } from 'lucide-react';
import { NavBarContainer } from './NavBarContainer';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'work-orders', label: 'Orders', icon: ClipboardList },
    { id: 'leave', label: 'Leave', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-transparent px-4 safe-area-pb">
      <div className="h-14">
        <NavBarContainer justify="between" className="h-full gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex-1 h-full flex flex-col items-center justify-center px-3 rounded-lg transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-blue-600 rounded-full" />
                )}
                <Icon size={20} className="mb-1" />
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
              </button>
            );
          })}
        </NavBarContainer>
      </div>
    </div>
  );
};