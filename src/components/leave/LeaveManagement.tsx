import React, { useState } from 'react';

import { LeaveRequestForm } from './LeaveRequestForm';
import { LeaveRequestsList } from './LeaveRequestsList';
import { LeaveBalance } from './LeaveBalance';
import { LeaveCalendar } from './LeaveCalendar';
import { Plus, Calendar, List, BarChart3 } from 'lucide-react';

export const LeaveManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('balance');
  const [showRequestForm, setShowRequestForm] = useState(false);

  const tabs = [
    { id: 'balance', label: 'Balance', icon: BarChart3 },
    { id: 'requests', label: 'My Requests', icon: List },
    { id: 'calendar', label: 'Team Calendar', icon: Calendar },
  ];

  const renderContent = () => {
    if (showRequestForm) {
      return (
        <LeaveRequestForm
          onBack={() => setShowRequestForm(false)}
          onSubmit={() => {
            setShowRequestForm(false);
            setActiveTab('requests');
          }}
        />
      );
    }

    switch (activeTab) {
      case 'balance':
        return <LeaveBalance />;
      case 'requests':
        return <LeaveRequestsList />;
      case 'calendar':
        return <LeaveCalendar />;
      default:
        return <LeaveBalance />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-2">
      
      {!showRequestForm && (
        <>
          {/* Tab Navigation */}
          <div className="px-4 py-3 max-w-md mx-auto">
            <div className="flex justify-between items-center mb-3">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setShowRequestForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus size={16} />
                <span>Request</span>
              </button>
            </div>
          </div>
        </>
      )}

      {renderContent()}
    </div>
  );
};