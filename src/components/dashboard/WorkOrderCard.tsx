import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { WorkOrder, Asset } from '../../types';
import { WorkOrderService } from '../../services/WorkOrderService';

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onClick: () => void;
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({ workOrder, onClick }) => {
  const [asset, setAsset] = useState<Asset | null>(null);

  useEffect(() => {
    loadAsset();
  }, [workOrder.assetId]);

  const loadAsset = async () => {
    try {
      if (!workOrder.assetId) return;
      const assetData = await WorkOrderService.getAssetById(workOrder.assetId as string);
      setAsset(assetData || null);
    } catch (error) {
      console.error('Failed to load asset:', error);
    }
  };

  const getStatusBadge = () => {
    const sRaw = (workOrder.status || '').toLowerCase();
    const s = sRaw.replace(/\s+/g, '_');
    // Map various values to the four allowed statuses
    const key = (() => {
      if (['in_progress','in','inprogress'].some(k => s.includes(k))) return 'in_progress';
      if (s.includes('review')) return 'review';
      if (['done','completed','closed'].some(k => s.includes(k))) return 'done';
      return 'active';
    })();
    const statusConfig: Record<string, { variant: 'warning' | 'info' | 'success' | 'default'; label: string }> = {
      active: { variant: 'warning', label: 'Active' },
      in_progress: { variant: 'info', label: 'In Progress' },
      review: { variant: 'info', label: 'Review' },
      done: { variant: 'success', label: 'Done' },
    };
    const config = statusConfig[key];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = () => {
    const priorityConfig = {
      low: { variant: 'default' as const, label: 'Low' },
      medium: { variant: 'warning' as const, label: 'Medium' },
      high: { variant: 'danger' as const, label: 'High' },
      critical: { variant: 'danger' as const, label: 'Critical' },
    };

    const pRaw = (workOrder.priority || '').toLowerCase();
    const key: keyof typeof priorityConfig = (['low','medium','high','critical'].includes(pRaw)
      ? (pRaw as keyof typeof priorityConfig)
      : 'medium');
    const config = priorityConfig[key];
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
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

  const formatDate = (date?: Date | string) => {
    if (!date) return '';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateObj = new Date(date);
    
    if (dateObj.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <Card onClick={onClick}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{workOrder.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{workOrder.description}</p>
          </div>
          <div className="flex flex-col items-end gap-1 ml-3">
            {getStatusBadge()}
            {getPriorityBadge()}
          </div>
        </div>

        {/* Asset Info */}
        {asset && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin size={16} />
            <span className="truncate">{asset.name} - {asset.location}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar size={16} />
            <span>{formatDate(workOrder.scheduledDate ?? workOrder.due_date)}</span>
            {isOverdue() && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle size={14} />
                <span className="text-xs font-medium">Overdue</span>
              </div>
            )}
          </div>
          
          {workOrder.estimatedHours && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Clock size={14} />
              <span>{workOrder.estimatedHours}h</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};