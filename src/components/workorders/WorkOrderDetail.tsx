import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, User, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    loadWorkOrderDetails();
  }, [workOrderId]);

  const loadWorkOrderDetails = async () => {
    try {
      setLoading(true);
      const [workOrderData, assetData] = await Promise.all([
        WorkOrderService.getWorkOrderById(workOrderId),
        workOrder ? WorkOrderService.getAssetById(workOrder.assetId) : null,
      ]);

      if (workOrderData) {
        setWorkOrder(workOrderData);
        const assetData = await WorkOrderService.getAssetById(workOrderData.assetId);
        setAsset(assetData);
      }
    } catch (error) {
      console.error('Failed to load work order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Work Order Details" showNotifications={false} />
        <div className="flex items-center justify-center pt-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Work Order Details" showNotifications={false} />
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
      low: { variant: 'default' as const, label: 'Low Priority' },
      medium: { variant: 'warning' as const, label: 'Medium Priority' },
      high: { variant: 'danger' as const, label: 'High Priority' },
      critical: { variant: 'danger' as const, label: 'Critical Priority' },
    };

    const config = priorityConfig[workOrder.priority];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = () => {
    if (workOrder.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(workOrder.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);
    return scheduledDate < today;
  };

  const canComplete = workOrder.status === 'pending' || workOrder.status === 'in_progress';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-3 safe-area-pt">
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
        {/* Status and Priority */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            {getStatusBadge()}
            {getPriorityBadge()}
          </div>
          
          {isOverdue() && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">This work order is overdue</span>
            </div>
          )}
        </Card>

        {/* Work Order Info */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">{workOrder.title}</h2>
          <p className="text-gray-600 mb-4">{workOrder.description}</p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="text-gray-400" size={16} />
              <div>
                <span className="text-gray-600">Scheduled: </span>
                <span className="font-medium">{formatDate(workOrder.scheduledDate)}</span>
              </div>
            </div>
            
            {workOrder.estimatedHours && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="text-gray-400" size={16} />
                <div>
                  <span className="text-gray-600">Estimated Time: </span>
                  <span className="font-medium">{workOrder.estimatedHours} hours</span>
                </div>
              </div>
            )}

            {workOrder.completedDate && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="text-gray-400" size={16} />
                <div>
                  <span className="text-gray-600">Completed: </span>
                  <span className="font-medium">{formatDate(workOrder.completedDate)}</span>
                </div>
              </div>
            )}

            {workOrder.actualHours && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="text-gray-400" size={16} />
                <div>
                  <span className="text-gray-600">Actual Time: </span>
                  <span className="font-medium">{workOrder.actualHours} hours</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Asset Information */}
        {asset && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Asset Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Asset Name</span>
                <p className="font-medium">{asset.name}</p>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-0.5" size={16} />
                <div>
                  <span className="text-sm text-gray-600">Location</span>
                  <p className="font-medium">{asset.location}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Type</span>
                  <p className="font-medium">{asset.type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status</span>
                  <p className="font-medium capitalize">{asset.status.replace('_', ' ')}</p>
                </div>
              </div>
              
              {asset.manufacturer && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Manufacturer</span>
                    <p className="font-medium">{asset.manufacturer}</p>
                  </div>
                  {asset.model && (
                    <div>
                      <span className="text-sm text-gray-600">Model</span>
                      <p className="font-medium">{asset.model}</p>
                    </div>
                  )}
                </div>
              )}
              
              {asset.serialNumber && (
                <div>
                  <span className="text-sm text-gray-600">Serial Number</span>
                  <p className="font-medium">{asset.serialNumber}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Action Button */}
        {canComplete && (
          <Button
            onClick={() => onCompleteWorkOrder(workOrder.id)}
            variant="success"
            size="lg"
            fullWidth
          >
            Complete Work Order
          </Button>
        )}
      </div>
    </div>
  );
};