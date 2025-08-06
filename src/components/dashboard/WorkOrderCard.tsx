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
      const assetData = await WorkOrderService.getAssetById(workOrder.assetId);
      setAsset(assetData);
    } catch (error) {
      console.error('Failed to load asset:', error);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { variant: 'warning' as const, label: 'Pending' },
      in_progress: { variant: 'info' as const, label: 'In Progress' },
      completed: { variant: 'success' as const, label: 'Completed' },
      cancelled: { variant: 'default' as const, label: 'Cancelled' },
    };

    const config = statusConfig[workOrder.status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = () => {
    const priorityConfig = {
      low: { variant: 'default' as const, label: 'Low' },
      medium: { variant: 'warning' as const, label: 'Medium' },
      high: { variant: 'danger' as const, label: 'High' },
      critical: { variant: 'danger' as const, label: 'Critical' },
    };

    const config = priorityConfig[workOrder.priority];
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const isOverdue = () => {
    if (workOrder.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(workOrder.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);
    return scheduledDate < today;
  };

  const formatDate = (date: Date) => {
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
    <Card onClick={onClick} className={`${isOverdue() ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{workOrder.title}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{workOrder.description}</p>
          </div>
          <div className="flex flex-col items-end gap-1 ml-3">
            {getStatusBadge()}
            {getPriorityBadge()}
          </div>
        </div>

        {/* Asset Info */}
        {asset && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} />
            <span className="truncate">{asset.name} - {asset.location}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>{formatDate(workOrder.scheduledDate)}</span>
            {isOverdue() && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle size={14} />
                <span className="text-xs font-medium">Overdue</span>
              </div>
            )}
          </div>
          
          {workOrder.estimatedHours && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock size={14} />
              <span>{workOrder.estimatedHours}h</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};