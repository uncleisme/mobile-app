import React, { useState, useEffect } from 'react';
import { Header } from '../layout/Header';
import { WorkOrderCard } from './WorkOrderCard';
import { NotificationBanner } from './NotificationBanner';
import { FilterTabs } from './FilterTabs';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { WorkOrder } from '../../types';
import { WorkOrderService } from '../../services/WorkOrderService';
import { useAuth } from '../../hooks/useAuth';

interface DashboardProps {
  onWorkOrderClick: (workOrderId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onWorkOrderClick }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    loadWorkOrders();
  }, [user]);

  useEffect(() => {
    const filtered = WorkOrderService.getWorkOrdersByStatus(workOrders, activeFilter);
    setFilteredWorkOrders(filtered);
  }, [workOrders, activeFilter]);

  const loadWorkOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const orders = await WorkOrderService.getWorkOrdersForTechnician(user.id);
      setWorkOrders(orders);
    } catch (error) {
      console.error('Failed to load work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const todaysWorkOrders = WorkOrderService.getTodaysWorkOrders(workOrders);
  const overdueWorkOrders = WorkOrderService.getOverdueWorkOrders(workOrders);

  const getNotificationCount = () => {
    return todaysWorkOrders.length + overdueWorkOrders.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Dashboard" notificationCount={0} />
        <div className="flex items-center justify-center pt-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Dashboard" notificationCount={getNotificationCount()} />
      
      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Notification Banners */}
        {todaysWorkOrders.length > 0 && (
          <NotificationBanner
            type="info"
            title="Jobs Due Today"
            message={`You have ${todaysWorkOrders.length} work order${todaysWorkOrders.length > 1 ? 's' : ''} scheduled for today`}
          />
        )}
        
        {overdueWorkOrders.length > 0 && (
          <NotificationBanner
            type="warning"
            title="Overdue Jobs"
            message={`You have ${overdueWorkOrders.length} overdue work order${overdueWorkOrders.length > 1 ? 's' : ''}`}
          />
        )}

        {/* Filter Tabs */}
        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          workOrders={workOrders}
        />

        {/* Work Orders List */}
        <div className="space-y-4">
          {filteredWorkOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Work Orders</h3>
              <p className="text-gray-500">
                {activeFilter === 'all' 
                  ? "You don't have any work orders assigned yet."
                  : `No ${activeFilter} work orders found.`
                }
              </p>
            </div>
          ) : (
            filteredWorkOrders.map((workOrder) => (
              <WorkOrderCard
                key={workOrder.id}
                workOrder={workOrder}
                onClick={() => onWorkOrderClick(workOrder.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};