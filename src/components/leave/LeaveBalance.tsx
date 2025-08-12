import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Calendar, TrendingUp } from 'lucide-react';
import { LeaveBalance as LeaveBalanceType } from '../../types';
import { LeaveService } from '../../services/LeaveService';
import { useAuth } from '../../contexts/AuthContext';

export const LeaveBalance: React.FC = () => {
  const [balance, setBalance] = useState<LeaveBalanceType | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadLeaveBalance();
  }, [user]);

  const loadLeaveBalance = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await LeaveService.getLeaveBalance(user.id);
      setBalance(data);
    } catch (error) {
      console.error('Failed to load leave balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="px-4 py-6 max-w-md mx-auto">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Balance Data</h3>
          <p className="text-gray-500">Leave balance information is not available.</p>
        </div>
      </div>
    );
  }

  const leaveTypes = [
    {
      type: 'Annual Leave',
      total: balance.annualDaysTotal,
      used: balance.annualDaysUsed,
      remaining: balance.annualDaysTotal - balance.annualDaysUsed,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      type: 'Sick Leave',
      total: balance.sickDaysTotal,
      used: balance.sickDaysUsed,
      remaining: balance.sickDaysTotal - balance.sickDaysUsed,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      type: 'Personal Leave',
      total: balance.personalDaysTotal,
      used: balance.personalDaysUsed,
      remaining: balance.personalDaysTotal - balance.personalDaysUsed,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  const getProgressPercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6">
      {/* Year Header */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{balance.year} Leave Balance</h2>
            <p className="text-gray-600">Your current leave entitlements</p>
          </div>
        </div>
      </Card>

      {/* Leave Types */}
      <div className="space-y-4">
        {leaveTypes.map((leave) => (
          <Card key={leave.type} className={leave.bgColor}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${leave.textColor}`}>{leave.type}</h3>
                <div className="text-right">
                  <p className={`text-lg font-bold ${leave.textColor}`}>
                    {leave.remaining}
                  </p>
                  <p className="text-xs text-gray-600">days remaining</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Used: {leave.used} days</span>
                  <span>Total: {leave.total} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${leave.color} transition-all duration-300`}
                    style={{ width: `${getProgressPercentage(leave.used, leave.total)}%` }}
                  ></div>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp size={14} />
                <span>
                  {getProgressPercentage(leave.used, leave.total).toFixed(0)}% used this year
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {leaveTypes.reduce((sum, leave) => sum + leave.remaining, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Remaining</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {leaveTypes.reduce((sum, leave) => sum + leave.used, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Used</p>
          </div>
        </div>
      </Card>
    </div>
  );
};