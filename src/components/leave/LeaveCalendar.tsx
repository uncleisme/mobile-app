import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { User } from '../../types';
import { LeaveService } from '../../services/LeaveService';

interface LeaveCalendarData {
  date: Date;
  users: (User & { leaveType: string })[];
}

export const LeaveCalendar: React.FC = () => {
  const [calendarData, setCalendarData] = useState<LeaveCalendarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const data = await LeaveService.getLeaveCalendarData();
      setCalendarData(data);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getLeaveForDate = (date: Date | null) => {
    if (!date) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    const dayData = calendarData.find(data => 
      data.date.toISOString().split('T')[0] === dateStr
    );
    
    return dayData ? dayData.users : [];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getLeaveTypeBadge = (type: string) => {
    const typeConfig = {
      annual: { variant: 'info' as const, label: 'Annual' },
      sick: { variant: 'warning' as const, label: 'Sick' },
      personal: { variant: 'default' as const, label: 'Personal' },
      emergency: { variant: 'danger' as const, label: 'Emergency' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || { variant: 'default' as const, label: type };
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6">
      {/* Calendar Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const usersOnLeave = getLeaveForDate(date);
            const hasLeave = usersOnLeave.length > 0;
            
            return (
              <div
                key={index}
                className={`aspect-square flex flex-col items-center justify-center text-sm relative ${
                  date
                    ? `cursor-pointer hover:bg-gray-50 rounded-lg transition-colors duration-200 ${
                        isToday(date) ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-900'
                      }`
                    : ''
                }`}
              >
                {date && (
                  <>
                    <span className="text-xs">{date.getDate()}</span>
                    {hasLeave && (
                      <div className="absolute bottom-0.5 w-1 h-1 bg-orange-500 rounded-full"></div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Leave List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Team Leave Schedule</h3>
        </div>

        {calendarData.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">No Leave Scheduled</h4>
              <p className="text-sm text-gray-500">No team members have approved leave requests.</p>
            </div>
          </Card>
        ) : (
          calendarData
            .filter(data => {
              const dataMonth = data.date.getMonth();
              const dataYear = data.date.getFullYear();
              return dataMonth === currentDate.getMonth() && dataYear === currentDate.getFullYear();
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map((data) => (
              <Card key={data.date.toISOString()}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      {data.date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {data.users.length} person{data.users.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {data.users.map((user) => (
                      <div key={`${user.id}-${data.date.toISOString()}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {user.profilePhoto ? (
                            <img
                              src={user.profilePhoto}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-xs font-medium">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.role}</p>
                        </div>
                        {getLeaveTypeBadge(user.leaveType)}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))
        )}
      </div>
    </div>
  );
};