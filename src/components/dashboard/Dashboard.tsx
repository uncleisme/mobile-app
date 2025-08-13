import { useState, useEffect } from 'react';
import { Header } from '../layout/Header';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { WorkOrder } from '../../types';
import { WorkOrderService } from '../../services/WorkOrderService';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, Clock, PlayCircle, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
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

  // Relative time until due
  const timeUntilDue = (dateString?: string | Date) => {
    if (!dateString) return '';
    const now = new Date();
    const due = new Date(dateString);
    const diffMs = due.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (isNaN(diffMin)) return '';
    // Hide overdue messaging entirely
    if (diffMin < 0) return '';
    if (diffMin < 60) return `in ${diffMin}m`;
    if (diffMin < 1440) return `in ${Math.round(diffMin / 60)}h`;
    return `in ${Math.round(diffMin / 1440)}d`;
  };

  // Status badge renderer - tolerant to varied status values
  const renderStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    const base = 'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full';
    if (['completed', 'done', 'closed'].includes(s)) {
      return (
        <span className={`${base} bg-green-100 text-green-700`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
        </span>
      );
    }
    if (['in progress', 'in_progress', 'started', 'working'].includes(s)) {
      return (
        <span className={`${base} bg-blue-100 text-blue-700`}>
          <PlayCircle className="w-3.5 h-3.5" /> In Progress
        </span>
      );
    }
    if (['cancelled', 'canceled'].includes(s)) {
      return (
        <span className={`${base} bg-gray-100 text-gray-700`}>
          <Circle className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
    }
    return (
      <span className={`${base} bg-amber-100 text-amber-700`}>
        <Circle className="w-3.5 h-3.5" /> Pending
      </span>
    );
  };

  // Priority badge renderer if available
  const renderPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const p = priority.toLowerCase();
    const base = 'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full';
    if (p === 'critical') return <span className={`${base} bg-red-100 text-red-700`}>Critical</span>;
    if (p === 'high') return <span className={`${base} bg-orange-100 text-orange-700`}>High</span>;
    if (p === 'medium') return <span className={`${base} bg-yellow-100 text-yellow-800`}>Medium</span>;
    return <span className={`${base} bg-gray-100 text-gray-700`}>Low</span>;
  };

  // Complaint badge if work order is a complaint
  const renderComplaintBadge = (wo: WorkOrder) => {
    const base = 'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700';
    // Heuristics: work_type, type, category, or boolean flag
    const wt = ((wo as any).work_type || (wo as any).type || (wo as any).category || '').toString().toLowerCase();
    const isFlag = Boolean((wo as any).is_complaint || (wo as any).complaint);
    if (isFlag || wt === 'complaint' || wt.includes('complaint')) {
      return <span className={base}>Complaint</span>;
    }
    return null;
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

        {/* Next Job - Enhanced */}
        {nextJob && (
          <Card variant="plain" className="border-l-4 border-blue-500 bg-white ring-1 ring-gray-200 rounded-xl">
            <div className="flex items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Next Job</h2>
              <div className="ml-auto flex items-center gap-2 whitespace-nowrap">
                {renderStatusBadge(nextJob.status as any)}
                {renderComplaintBadge(nextJob)}
                {renderPriorityBadge((nextJob as any).priority)}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {formatTime(nextJob.due_date)} – {nextJob.title || 'Untitled Work Order'}
                  </p>
                  {(() => {
                    const wt = ((nextJob as any).work_type || '').toString();
                    if (!wt) return null;
                    const isComplaint = wt.toLowerCase().includes('complaint');
                    if (isComplaint) return null; // do not duplicate complaint tag under title
                    return (
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                          {wt}
                        </span>
                      </div>
                    );
                  })()}
                  {nextJob.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{nextJob.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">
                        {locationNames[nextJob.location_id] || nextJob.location_id || 'Location not specified'}
                      </span>
                    </div>
                    {(() => {
                      const rel = timeUntilDue(nextJob.due_date);
                      if (!rel) return null;
                      return (
                        <>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            <span>{rel}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                {(() => {
                  const due = new Date(nextJob.due_date as any);
                  const now = new Date();
                  const isCompleted = (nextJob.status || '').toLowerCase() === 'completed';
                  if (!isNaN(due.getTime()) && due < now && !isCompleted) {
                    return (
                      <aside className="flex flex-col items-center justify-center ml-2 text-red-600">
                        <AlertCircle className="w-8 h-8" />
                        <span className="text-xs font-semibold mt-1">Overdue</span>
                      </aside>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Overdue alert removed per requirement */}

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() => nextJob.id && onWorkOrderClick(nextJob.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Start Job
                </Button>
                <Button
                  onClick={() => nextJob.id && onWorkOrderClick(nextJob.id)}
                  variant="secondary"
                  className="flex-1"
                  size="lg"
                >
                  View Details
                </Button>
              </div>
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