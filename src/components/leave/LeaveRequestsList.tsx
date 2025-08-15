import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Calendar, Clock } from 'lucide-react';
import { LeaveRequest } from '../../types';
import { LeaveService } from '../../services/LeaveService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDDMMYY } from '../../utils/date';

export const LeaveRequestsList: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadLeaveRequests();
  }, [user]);

  const loadLeaveRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await LeaveService.getLeaveRequestsForUser(user.id);
      setRequests(data.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
    } catch (error) {
      console.error('Failed to load leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'warning' as const, label: 'Pending' },
      approved: { variant: 'success' as const, label: 'Approved' },
      rejected: { variant: 'danger' as const, label: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getLeaveTypeLabel = (type: string) => {
    const typeLabels = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      personal: 'Personal Leave',
      emergency: 'Emergency Leave',
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const formatDate = (date: Date) => formatDDMMYY(date);

  const calculateDays = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-4">
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Leave Requests</h3>
          <p className="text-gray-500 dark:text-gray-400">You haven't submitted any leave requests yet.</p>
        </div>
      ) : (
        requests.map((request) => (
          <Card key={request.id}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {getLeaveTypeLabel(request.type)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{request.reason}</p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{calculateDays(request.startDate, request.endDate)} day{calculateDays(request.startDate, request.endDate) > 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                <p>Requested on {formatDate(request.requestedAt)}</p>
                {request.approvedAt && (
                  <p>Approved on {formatDate(request.approvedAt)}</p>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};