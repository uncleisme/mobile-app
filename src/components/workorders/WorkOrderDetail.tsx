import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, AlertTriangle, User2 } from 'lucide-react';
import { Header } from '../layout/Header';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { WorkOrder } from '../../types';
import { WorkOrderService } from '../../services/WorkOrderService';

interface WorkOrderDetailProps {
  workOrderId: string;
  onBack: () => void;
  onCompleteClick?: (workOrderId: string, title?: string) => void;
}

export const WorkOrderDetail: React.FC<WorkOrderDetailProps> = ({
  workOrderId,
  onBack,
  onCompleteClick,
}) => {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>('');
  const [requestedByName, setRequestedByName] = useState<string>('');
  const [assignedToName, setAssignedToName] = useState<string>('');
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const workOrderData = await WorkOrderService.getWorkOrderById(workOrderId);
        setWorkOrder(workOrderData);
        // Resolve location name if present
        if (workOrderData?.location_id) {
          const map = await WorkOrderService.getLocationNamesByIds([workOrderData.location_id]);
          setLocationName(map[workOrderData.location_id] || workOrderData.location_id);
        } else {
          setLocationName('');
        }
        // Resolve profile names for requested_by and assigned_to if present
        if (workOrderData) {
          const ids: string[] = [];
          if (workOrderData.requested_by) ids.push(workOrderData.requested_by);
          if (workOrderData.assigned_to || workOrderData.assignedTo) ids.push((workOrderData.assigned_to || workOrderData.assignedTo) as string);
          if (ids.length) {
            try {
              const nameMap = await WorkOrderService.getProfileNamesByIds(ids);
              if (workOrderData.requested_by) setRequestedByName(nameMap[workOrderData.requested_by] || '');
              const at = (workOrderData.assigned_to || workOrderData.assignedTo) as string | undefined;
              if (at) setAssignedToName(nameMap[at] || '');
            } catch (e) {
              console.warn('Failed to resolve profile names', e);
              setRequestedByName('');
              setAssignedToName('');
            }
          } else {
            setRequestedByName('');
            setAssignedToName('');
          }
        } else {
          setRequestedByName('');
          setAssignedToName('');
        }
      } catch (error) {
        console.error('Failed to load work order details:', error);
        setWorkOrder(null);
        setLocationName('');
        setRequestedByName('');
        setAssignedToName('');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [workOrderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
        <Header title="Work Order Details" showNotifications={false} plain />
        <div className="flex items-center justify-center pt-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
        <Header title="Work Order Details" showNotifications={false} plain />
        <div className="px-4 py-6 max-w-md mx-auto">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Work Order Not Found</h3>
            <p className="text-gray-500 mb-6">The requested work order could not be found.</p>
            <Button onClick={onBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  // Deprecated: local status badge helper removed in favor of shared <StatusBadge />

  const getWorkTypeBadge = () => {
    const wt = (workOrder.work_type || workOrder.job_type || '').trim();
    if (!wt) return null;
    return (
      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
        {wt}
      </span>
    );
  };

  // Deprecated: local priority badge helper removed in favor of shared <PriorityBadge />

  const formatDate = (date?: string | Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isOverdue = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const when = workOrder.scheduledDate ?? workOrder.due_date;
    if (!when) return false;
    const scheduledDate = new Date(when);
    scheduledDate.setHours(0, 0, 0, 0);
    return scheduledDate < today;
  };

  const canComplete = () => {
    const s = (workOrder?.status || '').toLowerCase();
    return !(s.includes('complete') || s.includes('done') || s.includes('closed') || s.includes('review'));
  };

  const getBodyBgClass = () => {
    const s = (workOrder.status || '').toLowerCase().replace(/\s+/g, '_');
    if (isOverdue() && s !== 'done') return 'bg-rose-50';
    if (s === 'done' || s === 'completed' || s === 'closed') return 'bg-green-50';
    if (s === 'in_progress') return 'bg-blue-50';
    if (s === 'review') return 'bg-violet-50';
    return 'bg-amber-50'; // active / default
  };

  return (
    <div className={`min-h-screen ${getBodyBgClass()} dark:bg-gray-900 dark:text-gray-100 pb-20`}>
      <div className="px-4 py-3 safe-area-pt">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Work Order Details</h1>
          </div>
          {canComplete() && (
            <Button
              onClick={() => onCompleteClick?.(String(workOrder?.id || workOrder?.work_order_id), workOrder?.title)}
            >
              Complete
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Single card with grid-based layout */}
        <Card className="dark:border dark:border-gray-700 dark:rounded-xl dark:p-4">
          <div className="space-y-4">
            {/* Heading */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {(workOrder.work_order_id || workOrder.id) + ' | ' + (workOrder.title || 'Untitled Work Order')}
              </h2>
            </div>

            {/* Status row */}
            <div className="flex flex-wrap items-center gap-2">
              {getWorkTypeBadge()}
              <StatusBadge status={workOrder.status} size="sm" />
              <PriorityBadge priority={(workOrder as any).priority} size="sm" />
              {isOverdue() && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  <AlertTriangle size={14} /> Overdue
                </span>
              )}
            </div>

            {/* Grid sections */}
            <div className="grid grid-cols-1 gap-4 text-sm">
              {/* Dates */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{workOrder.created_date ? formatDate(workOrder.created_date) : '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-600 dark:text-gray-400">Due:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(workOrder.due_date)}</span>
                </div>
              </div>

              {/* People */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User2 size={16} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-gray-600 dark:text-gray-400">Requested By:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{requestedByName || workOrder.requested_by || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User2 size={16} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-gray-600 dark:text-gray-400">Assigned To:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{assignedToName || workOrder.assigned_to || workOrder.assignedTo || 'Unassigned'}</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <div className="text-gray-900 dark:text-gray-100 font-medium">{locationName || workOrder.location_id || 'N/A'}</div>
                </div>
              </div>

              {/* Description with clamp & toggle */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Description</h3>
                <p
                  className={`text-gray-800 dark:text-gray-100 whitespace-pre-line text-justify`}
                  style={
                    showFullDesc
                      ? undefined
                      : {
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }
                  }
                >
                  {workOrder.description || 'No description provided.'}
                </p>
                {!!(workOrder.description && workOrder.description.length > 140) && (
                  <button
                    type="button"
                    onClick={() => setShowFullDesc(v => !v)}
                    className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {showFullDesc ? 'See less' : 'See more'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};