import { useState, useEffect } from 'react';
import { Header } from '../layout/Header';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { WorkOrder } from '../../types';
import { WorkOrderService } from '../../services/WorkOrderService';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, PlayCircle, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Activity } from '../activity/Activity';

interface DashboardProps {
  onWorkOrderClick: (workOrderId: string) => void;
  refreshKey?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ onWorkOrderClick, refreshKey }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});

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
    // Review
    if (['review','in review','in_review','awaiting review','awaiting_review'].includes(s)) {
      return (
        <span className={`${base} bg-violet-600 text-white`}>
          <Circle className="w-3.5 h-3.5" /> Review
        </span>
      );
    }
    // Done
    if (['completed', 'done', 'closed'].includes(s)) {
      return (
        <span className={`${base} bg-green-600 text-white`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Done
        </span>
      );
    }
    // In Progress
    if (['in progress', 'in_progress', 'started', 'working'].includes(s)) {
      return (
        <span className={`${base} bg-blue-600 text-white`}>
          <PlayCircle className="w-3.5 h-3.5" /> In Progress
        </span>
      );
    }
    // Default Active (includes pending/cancelled/others treated as Active)
    return (
      <span className={`${base} bg-amber-600 text-white`}>
        <Circle className="w-3.5 h-3.5" /> Active
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
  }, [user, refreshKey]);

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

  // Resolve profile full names for requested_by and assigned_to
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const ids = Array.from(new Set(
          workOrders.flatMap(w => [w.requested_by, w.assigned_to, (w as any).assignedTo].filter(Boolean) as string[])
        ));
        if (ids.length === 0) { setProfileNames({}); return; }
        const map = await WorkOrderService.getProfileNamesByIds(ids);
        setProfileNames(map);
      } catch (err) {
        console.warn('Dashboard: failed to fetch profile names', err);
        setProfileNames({});
      }
    };
    fetchProfiles();
  }, [workOrders]);

  // Get today's work orders and next job (prefer non-completed)
  const todaysWorkOrders = WorkOrderService.getTodaysWorkOrders(workOrders);
  // Helper: rank statuses for Next Job priority
  const statusRank = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('progress')) return 0; // in_progress highest
    if (s.includes('review')) return 3;   // review lower priority
    if (s.includes('complete') || s.includes('done') || s.includes('closed')) return 4; // lowest
    // Treat everything else as active/pending
    return 1;
  };
  // Helper: sort candidates by status rank, then createdAt desc ("just created"), then due_date asc
  const sortForNextJob = (list: WorkOrder[]) => {
    return [...list].sort((a, b) => {
      const rA = statusRank(a.status);
      const rB = statusRank(b.status);
      if (rA !== rB) return rA - rB;
      const ca = (a as any).createdAt instanceof Date ? (a as any).createdAt as Date : (a.created_date as any);
      const cb = (b as any).createdAt instanceof Date ? (b as any).createdAt as Date : (b.created_date as any);
      const cATime = ca ? new Date(ca).getTime() : 0;
      const cBTime = cb ? new Date(cb).getTime() : 0;
      if (cATime !== cBTime) return cBTime - cATime; // newer first
      const da = a.due_date ? new Date(a.due_date as any).getTime() : Number.MAX_SAFE_INTEGER;
      const db = b.due_date ? new Date(b.due_date as any).getTime() : Number.MAX_SAFE_INTEGER;
      return da - db; // earlier due first
    });
  };
  const nextJob = (
    sortForNextJob(todaysWorkOrders)[0] ||
    sortForNextJob(workOrders)[0] ||
    undefined
  );
  // Status metrics
  const activePendingCount = workOrders.filter(wo => ['pending','in_progress'].includes((wo.status || '').toLowerCase())).length;
  const reviewCount = workOrders.filter(wo => (wo.status || '').toLowerCase() === 'review').length;
  const doneCount = workOrders.filter(wo => (wo.status || '').toLowerCase() === 'completed').length;

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
        notificationsContent={
          todaysWorkOrders.length > 0 ? (
            <div className="space-y-2">
              {todaysWorkOrders.slice(0, 10).map((workOrder) => (
                workOrder?.id && (
                  <div 
                    key={workOrder.id} 
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => onWorkOrderClick(workOrder.id)}
                  >
                    <div className="flex items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {workOrder.title || 'Untitled Work Order'}
                        </p>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          {renderComplaintBadge(workOrder)}
                          {renderStatusBadge(workOrder.status as any)}
                        </div>
                        {(() => {
                          const wt = (workOrder.work_type || '').toString();
                          if (!wt) return null;
                          if (wt.toLowerCase().includes('complaint')) return null; // avoid duplicate complaint pill
                          return (
                            <div className="mt-1">
                              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                                {wt}
                              </span>
                            </div>
                          );
                        })()}
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {locationNames[workOrder.location_id] || workOrder.location_id || 'Location not specified'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                          <span><span className="text-gray-500">Req:</span> {profileNames[workOrder.requested_by || ''] || workOrder.requested_by || 'N/A'}</span>
                          <span><span className="text-gray-500">Asg:</span> {profileNames[(workOrder.assigned_to || (workOrder as any).assignedTo) as string] || workOrder.assigned_to || (workOrder as any).assignedTo || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : null
        }
      />
      
      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Personal Greeting moved into Header */}

        {/* Next Job - Enhanced with status-based styling */}
        {(() => {
          const s = (nextJob?.status || '').toLowerCase();
          const isDone = ['completed','done','closed'].includes(s) || !nextJob;
          const cardStyle = (() => {
            if (isDone) return 'border-l-4 border-gray-400 bg-gray-100 ring-1 ring-gray-200 rounded-xl';
            if (s.includes('review')) return 'border-l-4 border-violet-600 bg-violet-100 ring-1 ring-violet-200 rounded-xl';
            if (s.includes('progress')) return 'border-l-4 border-blue-600 bg-blue-100 ring-1 ring-blue-200 rounded-xl';
            return 'border-l-4 border-amber-600 bg-amber-100 ring-1 ring-amber-200 rounded-xl'; // Active/default
          })();
          const primaryBtn = (() => {
            if (isDone) return null;
            if (s.includes('review')) {
              return { label: 'Reviewed', disabled: true, className: 'flex-1 bg-violet-200 text-violet-700 cursor-not-allowed' };
            }
            if (s.includes('progress')) {
              return { label: 'Resume Job', disabled: false, className: 'flex-1 bg-blue-600 hover:bg-blue-700 text-white' };
            }
            // Active/default
            return { label: 'Start Job', disabled: false, className: 'flex-1 bg-amber-600 hover:bg-amber-700 text-white' };
          })();
          return (
            <Card variant="plain" className={`${cardStyle}`}>
              <div className="flex items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Next Job</h2>
                {!isDone && nextJob && (
                  <div className="ml-auto flex items-center gap-2 whitespace-nowrap">
                    {renderStatusBadge(nextJob.status as any)}
                    {renderComplaintBadge(nextJob)}
                    {renderPriorityBadge((nextJob as any).priority)}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {isDone || !nextJob ? (
                  <div className="py-2 text-sm text-gray-600">No job at the moment</div>
                ) : (
                  <>
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
                        const showOverdue = !isNaN(due.getTime()) && due < now;
                        if (showOverdue) {
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

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {primaryBtn && (
                        <Button
                          onClick={() => !primaryBtn.disabled && nextJob.id && onWorkOrderClick(nextJob.id)}
                          className={primaryBtn.className}
                          size="lg"
                          disabled={primaryBtn.disabled}
                        >
                          {primaryBtn.label}
                        </Button>
                      )}
                      <Button
                        onClick={() => nextJob.id && onWorkOrderClick(nextJob.id)}
                        variant="secondary"
                        className="flex-1"
                        size="lg"
                      >
                        View Details
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })()}
        
        {/* Metrics: Active+Pending, Review, Done */}
        <Card>
          <div className="grid grid-cols-3 gap-3 place-items-center">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-center w-full">
              <div className="text-xs font-medium">Active + Pending</div>
              <div className="mt-1 text-2xl font-bold">{activePendingCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-violet-50 border border-violet-100 text-violet-800 text-center w-full">
              <div className="text-xs font-medium">Review</div>
              <div className="mt-1 text-2xl font-bold">{reviewCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-green-800 text-center w-full">
              <div className="text-xs font-medium">Done</div>
              <div className="mt-1 text-2xl font-bold">{doneCount}</div>
            </div>
          </div>
        </Card>


        {/* Today's Work Orders moved into Header notifications dropdown */}

        {/* Activity (latest notifications) */}
        <Activity />
      </div>
    </div>
  );
};