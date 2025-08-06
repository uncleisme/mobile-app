import React from 'react';
import { WorkOrder } from '../../types';

interface FilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  workOrders: WorkOrder[];
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  activeFilter,
  onFilterChange,
  workOrders,
}) => {
  const getStatusCount = (status: string) => {
    if (status === 'all') return workOrders.length;
    return workOrders.filter(wo => wo.status === status).length;
  };

  const tabs = [
    { id: 'all', label: 'All', count: getStatusCount('all') },
    { id: 'pending', label: 'Pending', count: getStatusCount('pending') },
    { id: 'in_progress', label: 'In Progress', count: getStatusCount('in_progress') },
    { id: 'completed', label: 'Completed', count: getStatusCount('completed') },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onFilterChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
            activeFilter === tab.id
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span>{tab.label}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            activeFilter === tab.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};