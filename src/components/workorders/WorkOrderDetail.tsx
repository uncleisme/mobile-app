import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, AlertTriangle, User2 } from 'lucide-react';
import { Header } from '../layout/Header';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { WorkOrder } from '../../types';
import { WorkOrderService } from '../../services/WorkOrderService';

interface WorkOrderDetailProps {
  workOrderId: string;
  onBack: () => void;
}

export const WorkOrderDetail: React.FC<WorkOrderDetailProps> = ({
  workOrderId,
  onBack,
}) => {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>('');

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
      } catch (error) {
        console.error('Failed to load work order details:', error);
        setWorkOrder(null);
        setLocationName('');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [workOrderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Work Order Details" showNotifications={false} plain />
        <div className="flex items-center justify-center pt-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
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

  const getStatusBadge = () => {
    type StatusKey = 'active' | 'in_progress' | 'done' | 'review';
    // Normalize and map loosely to supported badges
    const sRaw = (workOrder.status || '').toLowerCase();
    const normalized = sRaw.replace(/\s+/g, '_');
    const statusConfig: Record<StatusKey, { variant: 'warning' | 'info' | 'success' | 'default'; label: string }> = {
      active: { variant: 'warning', label: 'Active' },
      in_progress: { variant: 'info', label: 'In Progress' },
      done: { variant: 'success', label: 'Done' },
      review: { variant: 'info', label: 'Review' },
    };

    let key: StatusKey = 'active';
    if ((['active','in_progress','done','review'] as StatusKey[]).includes(normalized as StatusKey)) {
      key = normalized as StatusKey;
    } else if (sRaw.includes('progress')) key = 'in_progress';
    else if (sRaw.includes('complete') || sRaw.includes('done') || sRaw.includes('closed')) key = 'done';
    else if (sRaw.includes('review')) key = 'review';

    const config = statusConfig[key];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getWorkTypeBadge = () => {
    const wt = (workOrder.work_type || workOrder.job_type || '').trim();
    if (!wt) return null;
    return <Badge variant="default">{wt}</Badge>;
  };

  const getPriorityBadge = () => {
    // Normalize priority and provide safe default
    const pRaw = (workOrder.priority || '').toLowerCase();
    const p = pRaw.includes('crit') ? 'critical' : pRaw.includes('high') ? 'high' : pRaw.includes('low') ? 'low' : 'medium';
    const priorityConfig = {
      low: { variant: 'default' as const, label: 'Low Priority' },
      medium: { variant: 'warning' as const, label: 'Medium Priority' },
      high: { variant: 'danger' as const, label: 'High Priority' },
      critical: { variant: 'danger' as const, label: 'Critical Priority' },
    } as const;

    const config = priorityConfig[p as keyof typeof priorityConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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

  // Completion actions removed; no completion gating required

  const getBodyBgClass = () => {
    const s = (workOrder.status || '').toLowerCase().replace(/\s+/g, '_');
    if (isOverdue() && s !== 'done') return 'bg-rose-50';
    if (s === 'done' || s === 'completed' || s === 'closed') return 'bg-green-50';
    if (s === 'in_progress') return 'bg-blue-50';
    if (s === 'review') return 'bg-violet-50';
    return 'bg-amber-50'; // active / default
  };

  return (
    <div className={`min-h-screen ${getBodyBgClass()} pb-20`}>
      <div className="px-4 py-3 safe-area-pt">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Work Order Details</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* 1st card: status pills (work_type, status, priority, overdue) */
        }
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            {getWorkTypeBadge()}
            {getStatusBadge()}
            {getPriorityBadge()}
            {isOverdue() && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                <AlertTriangle size={14} /> Overdue
              </span>
            )}
          </div>
        </Card>

        {/* 2nd card: title and dates */}
        <Card>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-gray-900">
              {(workOrder.work_order_id || workOrder.id) + ' | ' + (workOrder.title || 'Untitled Work Order')}
            </h2>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
              {workOrder.created_date && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{formatDate(workOrder.created_date)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-600">Due:</span>
                <span className="font-medium">{formatDate(workOrder.due_date)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 3rd card: description */}
        <Card>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Description</h3>
            <p className="text-gray-800 whitespace-pre-line">{workOrder.description || 'No description provided.'}</p>
          </div>
        </Card>

        {/* 4th card: people (requested_by, assigned_to) */}
        <Card>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <User2 size={16} className="text-gray-400" />
              <span className="text-gray-600">Requested By:</span>
              <span className="font-medium">{workOrder.requested_by || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <User2 size={16} className="text-gray-400" />
              <span className="text-gray-600">Assigned To:</span>
              <span className="font-medium">{workOrder.assigned_to || workOrder.assignedTo || 'Unassigned'}</span>
            </div>
          </div>
        </Card>

        {/* 5th card: location */}
        <Card>
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={16} className="text-gray-400 mt-0.5" />
            <div>
              <div className="text-gray-900 font-medium">{locationName || workOrder.location_id || 'N/A'}</div>
            </div>
          </div>
        </Card>

        {/* Actions removed per request */}
      </div>
    </div>
  );
};