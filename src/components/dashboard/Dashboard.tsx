import { useState, useEffect } from 'react';
import { Header } from '../layout/Header';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { WorkOrder } from '../../types';
import { WorkOrderService } from '../../services/WorkOrderService';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, Clock } from 'lucide-react';
import { Activity } from '../activity/Activity';

interface DashboardProps {
  onWorkOrderClick: (workOrderId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onWorkOrderClick }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});

  // Greeting is now rendered in the Header component.

  // Format time for display
  const formatTime = (dateString?: string | Date) => {
    if (!dateString) return '--:--';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '--:--';
    }
  };

  // Load work orders when component mounts or user changes
  useEffect(() => {
    const loadWorkOrders = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const orders = await WorkOrderService.getWorkOrdersForTechnician(user.id);
        setWorkOrders(Array.isArray(orders) ? orders : []);
      } catch (error) {
        console.error('Failed to load work orders:', error);
        setWorkOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadWorkOrders();
  }, [user]);

  // Resolve location names for any loaded work orders
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const ids = workOrders.map(w => w.location_id).filter(Boolean) as string[];
        if (ids.length === 0) { setLocationNames({}); return; }
        const map = await WorkOrderService.getLocationNamesByIds(ids);
        setLocationNames(map);
      } catch (err) {
        console.warn('Dashboard: failed to fetch location names', err);
        setLocationNames({});
      }
    };
    fetchLocations();
  }, [workOrders]);

  // Get today's work orders and next job
  const todaysWorkOrders = WorkOrderService.getTodaysWorkOrders(workOrders);
  const nextJob = todaysWorkOrders[0] || workOrders.find(wo => wo.status !== 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header 
        title="Dashboard" 
        notificationCount={todaysWorkOrders.length}
        greetingName={user?.name?.split(' ')[0] || 'Technician'}
        greetingPhoto={user?.profilePhoto}
        plain
      />
      
      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Personal Greeting moved into Header */}

        {/* Next Job - Simplified single version */}
        {nextJob && (
          <Card className="border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Job</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {formatTime(nextJob.due_date)} – {nextJob.title || 'Untitled Work Order'}
                  </p>
                  {nextJob.work_type ? (
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                        {nextJob.work_type}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-center space-x-1 mt-1">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-600">
                      {locationNames[nextJob.location_id] || nextJob.location_id || 'Location not specified'}
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => nextJob.id && onWorkOrderClick(nextJob.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                START JOB
              </Button>
            </div>
          </Card>
        )}

        {/* Today's Work Orders */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Today's Work Orders</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {todaysWorkOrders.length}
            </span>
          </div>
          
          {todaysWorkOrders.length > 0 ? (
            <div className="space-y-3">
              {todaysWorkOrders.slice(0, 3).map((workOrder) => (
                workOrder?.id && (
                  <div 
                    key={workOrder.id} 
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => onWorkOrderClick(workOrder.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {workOrder.title || 'Untitled Work Order'}
                        </p>
                        {workOrder.work_type ? (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                              {workOrder.work_type}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {locationNames[workOrder.location_id] || workOrder.location_id || 'Location not specified'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 ml-2">
                        <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span>{formatTime(workOrder.due_date)}</span>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-2">No work orders scheduled for today</p>
          )}
        </Card>

        {/* Activity (latest notifications) */}
        <Activity />
      </div>
    </div>
  );
};