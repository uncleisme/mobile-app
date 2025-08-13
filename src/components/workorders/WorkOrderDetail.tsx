import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, AlertTriangle, Hash, User2, Building2, Phone, Mail, Layers } from 'lucide-react';
import { Header } from '../layout/Header';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { WorkOrder, Asset } from '../../types';
import { WorkOrderService } from '../../services/WorkOrderService';

interface WorkOrderDetailProps {
  workOrderId: string;
  onBack: () => void;
  onCompleteWorkOrder: (workOrderId: string) => void;
}

export const WorkOrderDetail: React.FC<WorkOrderDetailProps> = ({
  workOrderId,
  onBack,
  onCompleteWorkOrder,
}) => {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const workOrderData = await WorkOrderService.getWorkOrderById(workOrderId);
        setWorkOrder(workOrderData);
        if (workOrderData?.assetId) {
          const assetData = await WorkOrderService.getAssetById(workOrderData.assetId);
          setAsset(assetData);
        } else {
          setAsset(null);
        }
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
        setAsset(null);
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
    type StatusKey = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'review';
    // Normalize and map loosely to supported badges
    const sRaw = (workOrder.status || '').toLowerCase();
    const normalized = sRaw.replace(/\s+/g, '_');
    const statusConfig: Record<StatusKey, { variant: 'warning' | 'info' | 'success' | 'default'; label: string }> = {
      pending: { variant: 'warning', label: 'Pending' },
      in_progress: { variant: 'info', label: 'In Progress' },
      completed: { variant: 'success', label: 'Completed' },
      cancelled: { variant: 'default', label: 'Cancelled' },
      review: { variant: 'info', label: 'Review' },
    };

    let key: StatusKey = 'pending';
    if ((['pending','in_progress','completed','cancelled','review'] as StatusKey[]).includes(normalized as StatusKey)) {
      key = normalized as StatusKey;
    } else if (sRaw.includes('progress')) key = 'in_progress';
    else if (sRaw.includes('complete')) key = 'completed';
    else if (sRaw.includes('cancel')) key = 'cancelled';
    else if (sRaw.includes('review')) key = 'review';

    const config = statusConfig[key];
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
    if ((workOrder.status || '').toLowerCase().includes('complete')) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const when = workOrder.scheduledDate ?? workOrder.due_date;
    if (!when) return false;
    const scheduledDate = new Date(when);
    scheduledDate.setHours(0, 0, 0, 0);
    return scheduledDate < today;
  };

  const canComplete = ['pending','in_progress','review'].includes((workOrder.status || '').toLowerCase().replace(/\s+/g,'_'));

  const getBodyBgClass = () => {
    const s = (workOrder.status || '').toLowerCase().replace(/\s+/g, '_');
    if (isOverdue() && s !== 'completed') return 'bg-rose-50';
    if (s === 'completed') return 'bg-green-50';
    if (s === 'in_progress') return 'bg-blue-50';
    if (s === 'review') return 'bg-violet-50';
    if (s === 'cancelled') return 'bg-gray-100';
    return 'bg-amber-50'; // pending / default
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
        {/* Overview */}
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{workOrder.title || 'Untitled Work Order'}</h2>
              <p className="text-gray-600 mt-1">{workOrder.description || 'No description provided.'}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge()}
              {getPriorityBadge()}
            </div>
          </div>
          {isOverdue() && (
            <div className="mt-3 flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded-lg">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">This work order is overdue</span>
            </div>
          )}
        </Card>

        {/* IDs & Types */}
        <Card>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Hash size={16} /> <span className="font-medium text-gray-900">WO ID:</span> <span className="ml-1">{workOrder.work_order_id || workOrder.id}</span></div>
            <div className="flex items-center gap-2 text-gray-600"><Layers size={16} /> <span className="font-medium text-gray-900">Type:</span> <span className="ml-1">{workOrder.work_type || workOrder.job_type || 'N/A'}</span></div>
            <div className="flex items-center gap-2 text-gray-600"><User2 size={16} /> <span className="font-medium text-gray-900">Requested By:</span> <span className="ml-1">{workOrder.requested_by || 'N/A'}</span></div>
            <div className="flex items-center gap-2 text-gray-600"><User2 size={16} /> <span className="font-medium text-gray-900">Assigned To:</span> <span className="ml-1">{workOrder.assigned_to || workOrder.assignedTo || 'Unassigned'}</span></div>
          </div>
        </Card>

        {/* Schedule */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule</h3>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> <span className="text-gray-600">Due:</span> <span className="font-medium">{formatDate(workOrder.due_date)}</span></div>
            <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> <span className="text-gray-600">Scheduled:</span> <span className="font-medium">{formatDate(workOrder.scheduledDate ?? workOrder.due_date)}</span></div>
            {workOrder.created_date && (
              <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> <span className="text-gray-600">Created:</span> <span className="font-medium">{formatDate(workOrder.created_date)}</span></div>
            )}
            {workOrder.updated_at && (
              <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> <span className="text-gray-600">Updated:</span> <span className="font-medium">{formatDate(workOrder.updated_at)}</span></div>
            )}
            {workOrder.estimatedHours && (
              <div className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /> <span className="text-gray-600">Estimated:</span> <span className="font-medium">{workOrder.estimatedHours}h</span></div>
            )}
            {workOrder.actualHours && (
              <div className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /> <span className="text-gray-600">Actual:</span> <span className="font-medium">{workOrder.actualHours}h</span></div>
            )}
          </div>
        </Card>

        {/* Location */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={16} className="text-gray-400 mt-0.5" />
            <div>
              <div className="text-gray-900 font-medium">{locationName || workOrder.location_id || 'N/A'}</div>
              {asset?.location && <div className="text-gray-600">Asset: {asset.location}</div>}
            </div>
          </div>
        </Card>

        {/* Contact */}
        {(workOrder.contact_person || workOrder.contact_number || workOrder.contact_email) && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {workOrder.contact_person && <div className="flex items-center gap-2"><User2 size={16} className="text-gray-400" /> <span className="text-gray-600">Person:</span> <span className="font-medium">{workOrder.contact_person}</span></div>}
              {workOrder.contact_number && <div className="flex items-center gap-2"><Phone size={16} className="text-gray-400" /> <span className="text-gray-600">Phone:</span> <span className="font-medium">{workOrder.contact_number}</span></div>}
              {workOrder.contact_email && <div className="flex items-center gap-2"><Mail size={16} className="text-gray-400" /> <span className="text-gray-600">Email:</span> <span className="font-medium">{workOrder.contact_email}</span></div>}
            </div>
          </Card>
        )}

        {/* Recurrence */}
        {(workOrder.recurrence_rule || workOrder.recurrence_start_date || workOrder.recurrence_end_date) && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recurrence</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {workOrder.recurrence_rule && <div><span className="text-gray-600">Rule:</span> <span className="font-medium">{workOrder.recurrence_rule}</span></div>}
              {workOrder.recurrence_start_date && <div><span className="text-gray-600">Start:</span> <span className="font-medium">{formatDate(workOrder.recurrence_start_date)}</span></div>}
              {workOrder.recurrence_end_date && <div><span className="text-gray-600">End:</span> <span className="font-medium">{formatDate(workOrder.recurrence_end_date)}</span></div>}
            </div>
          </Card>
        )}

        {/* Metadata */}
        {(workOrder.reference_text || workOrder.unit_number || workOrder.service_provider_id) && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Metadata</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {workOrder.reference_text && <div><span className="text-gray-600">Reference:</span> <span className="font-medium">{workOrder.reference_text}</span></div>}
              {workOrder.unit_number && <div><span className="text-gray-600">Unit:</span> <span className="font-medium">{workOrder.unit_number}</span></div>}
              {workOrder.service_provider_id && <div className="flex items-center gap-2"><Building2 size={16} className="text-gray-400" /> <span className="text-gray-600">Service Provider:</span> <span className="font-medium">{workOrder.service_provider_id}</span></div>}
            </div>
          </Card>
        )}

        {/* Asset Information */}
        {asset && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Asset</h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-600">Name:</span> <span className="font-medium">{asset.name}</span></div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-600">Type:</span> <span className="font-medium">{asset.type}</span></div>
                <div><span className="text-gray-600">Status:</span> <span className="font-medium capitalize">{asset.status.replace('_',' ')}</span></div>
              </div>
              {asset.location && <div><span className="text-gray-600">Location:</span> <span className="font-medium">{asset.location}</span></div>}
              {asset.manufacturer && <div><span className="text-gray-600">Manufacturer:</span> <span className="font-medium">{asset.manufacturer}</span></div>}
              {asset.model && <div><span className="text-gray-600">Model:</span> <span className="font-medium">{asset.model}</span></div>}
              {asset.serialNumber && <div><span className="text-gray-600">Serial:</span> <span className="font-medium">{asset.serialNumber}</span></div>}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onBack}>Back</Button>
          {canComplete ? (
            <Button onClick={() => onCompleteWorkOrder(workOrder.id)} variant="success">Complete</Button>
          ) : (
            <Button variant="primary" disabled>Completed</Button>
          )}
        </div>
      </div>
    </div>
  );
};