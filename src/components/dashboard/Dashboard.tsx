import React, { useState, useEffect } from 'react';
import { LeaveService } from '../../services/LeaveService';
import { Header } from '../layout/Header';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { WorkOrder } from '../../types';
import { WorkOrderService } from '../../services/WorkOrderService';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, PlayCircle, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';
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
  const roleStr = ((user as any)?.role || '').toString().toLowerCase();
  const isAdmin = ['admin', 'administrator', 'superadmin', 'owner'].includes(roleStr) || (user as any)?.isAdmin === true;
  // Leave management (admin) - date range placeholders
  const [leaveStart, setLeaveStart] = useState<string>('');
  const [leaveEnd, setLeaveEnd] = useState<string>('');
  const [leaveLoading, setLeaveLoading] = useState<boolean>(false);
  const [leaveList, setLeaveList] = useState<Array<{ id: string; userId: string; fullName: string; typeKey: string | null; startDate: string; endDate: string }>>([]);
  // Leave approvals (admin)
  const [pendingLeaves, setPendingLeaves] = useState<Array<{ id: string; userId: string; fullName: string; typeKey: string | null; startDate: string; endDate: string; reason: string | null }>>([]);
  const [pendingLoading, setPendingLoading] = useState<boolean>(false);
  // Approvals list with technician-preferred filtering, but falls back to all if none match
  const { displayPending } = React.useMemo(() => {
    const tech = pendingLeaves.filter((p: any) => {
      const r = (p.role || '').toString().toLowerCase();
      return r === 'technician' || r.includes('tech');
    });
    return { displayPending: tech.length > 0 ? tech : pendingLeaves };
  }, [pendingLeaves]);

  // Fetch leave data for admin based on date filters
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const load = async () => {
      try {
        setLeaveLoading(true);
        const data = (leaveStart && leaveEnd)
          ? await LeaveService.getOnLeaveInRange(leaveStart, leaveEnd)
          : await LeaveService.getOnLeaveToday();
        if (!active) return;
        setLeaveList(data);
      } catch (e) {
        if (!active) return;
        console.warn('Failed loading leave data', e);
        setLeaveList([]);
      } finally {
        if (active) setLeaveLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [isAdmin, leaveStart, leaveEnd]);

  // Fetch pending leaves for admin
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const loadPending = async () => {
      try {
        setPendingLoading(true);
        const rows = await LeaveService.getPendingLeaves();
        if (!active) return;
        setPendingLeaves(rows);
      } catch (e) {
        if (!active) return;
        console.warn('Failed loading pending leaves', e);
        setPendingLeaves([]);
      } finally {
        if (active) setPendingLoading(false);
      }
    };
    loadPending();
    return () => { active = false; };
  }, [isAdmin]);


  // Manual refresh for approvals list
  const refreshPendingLeaves = async () => {
    if (!isAdmin) return;
    try {
      setPendingLoading(true);
      const rows = await LeaveService.getPendingLeaves();
      setPendingLeaves(rows);
    } catch (e) {
      console.warn('Failed refreshing pending leaves', e);
    } finally {
      setPendingLoading(false);
    }
  };

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
        <span className={`${base} bg-violet-800 text-white`}>
          <Circle className="w-3.5 h-3.5" /> Review
        </span>
      );
    }
    // Done
    if (['completed', 'done', 'closed'].includes(s)) {
      return (
        <span className={`${base} bg-green-800 text-white`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Done
        </span>
      );
    }
    // In Progress
    if (['in progress', 'in_progress', 'started', 'working'].includes(s)) {
      return (
        <span className={`${base} bg-blue-800 text-white`}>
          <PlayCircle className="w-3.5 h-3.5" /> In Progress
        </span>
      );
    }
    // Default Active (includes pending/cancelled/others treated as Active)
    return (
      <span className={`${base} bg-amber-900 text-amber-100`}>
        <Circle className="w-3.5 h-3.5" /> Active
      </span>
    );
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
        // Option A: always load all work orders so technicians can compare peers
        const orders = await WorkOrderService.getAllWorkOrders();
        setWorkOrders(Array.isArray(orders) ? orders : []);
      } catch (error) {
        console.error('Failed to load work orders:', error);
        setWorkOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadWorkOrders();
  }, [user?.id, (user as any)?.role, refreshKey]);

  const reload = async () => {
    if (!user?.id) return;
    try {
      // Option A: always load all work orders so technicians can compare peers
      const orders = await WorkOrderService.getAllWorkOrders();
      setWorkOrders(Array.isArray(orders) ? orders : []);
    } catch (e) {
      console.error('Dashboard reload failed:', e);
    }
  };

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

  // (overall workload bar removed)

  // Admin derived lists
  const approvalsList = isAdmin
    ? workOrders.filter(w => (w.status || '').toLowerCase().includes('review'))
    : [];
  const unassignedList = isAdmin
    ? workOrders.filter(w => !(w.assigned_to || (w as any).assignedTo))
    : [];

  // Aggregate workload by technician (admin view)
  const technicianAgg = React.useMemo(() => {
    type Agg = { active: number; review: number; done: number; total: number };
    const map = new Map<string, Agg>();
    for (const w of workOrders) {
      const assignee = (w.assigned_to || (w as any).assignedTo || 'unassigned') as string;
      const status = (w.status || '').toLowerCase();
      const rec = map.get(assignee) || { active: 0, review: 0, done: 0, total: 0 };
      if (status.includes('complete') || status.includes('done') || status.includes('closed')) {
        rec.done += 1;
      } else if (status.includes('review')) {
        rec.review += 1;
      } else {
        // treat everything else as active/pending
        rec.active += 1;
      }
      rec.total = rec.active + rec.review + rec.done;
      map.set(assignee, rec);
    }
    // Convert to array and sort by total desc, then name asc
    const arr = Array.from(map.entries()).map(([id, agg]) => ({ id, ...agg }));
    arr.sort((a, b) => b.total - a.total || (profileNames[a.id] || a.id).localeCompare(profileNames[b.id] || b.id));
    return arr;
  }, [workOrders, profileNames]);

  const handleApprove = async (id?: string) => {
    if (!id) return;
    try {
      await WorkOrderService.reviewWorkOrder(id, 'approve');
      await reload();
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const handleSendBack = async (id?: string) => {
    if (!id) return;
    try {
      await WorkOrderService.reviewWorkOrder(id, 'reject');
      await reload();
    } catch (e) {
      console.error('Send back failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 pb-20">
      <Header 
        title={isAdmin ? 'Admin Dashboard' : 'Dashboard'} 
        notificationCount={isAdmin ? approvalsList.length : todaysWorkOrders.length}
        greetingName={user?.name?.split(' ')[0] || (isAdmin ? 'Admin' : 'Technician')}
        greetingPhoto={user?.profilePhoto}
        plain
        notificationsContent={
          (isAdmin ? approvalsList : todaysWorkOrders).length > 0 ? (
            <div className="space-y-2">
              {(isAdmin ? approvalsList : todaysWorkOrders).slice(0, 10).map((workOrder) => (
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
        {isAdmin ? (
          <>
            {/* Approvals Queue */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Work Order Approvals</h2>
                <span className="text-sm text-gray-600 dark:text-gray-400">{approvalsList.length}</span>
              </div>
              {approvalsList.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">No items in review</div>
              ) : (
                <div className="space-y-3">
                  {approvalsList.map(wo => (
                    <Card key={wo.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{wo.title || 'Untitled Work Order'}</p>
                            <StatusBadge status={wo.status} size="sm" />
                          </div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                            <span><span className="text-gray-500">Req:</span> {profileNames[wo.requested_by || ''] || wo.requested_by || 'N/A'}</span>
                            <span><span className="text-gray-500">Asg:</span> {profileNames[(wo.assigned_to || (wo as any).assignedTo) as string] || wo.assigned_to || (wo as any).assignedTo || 'Unassigned'}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate">{locationNames[wo.location_id] || wo.location_id || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button onClick={() => handleSendBack(wo.id)} variant="secondary" size="sm">Send Back</Button>
                          <Button onClick={() => handleApprove(wo.id)} size="sm">Approve</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Leave Approvals */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leave Approvals</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{displayPending.length}</span>
                  <Button size="sm" variant="secondary" onClick={refreshPendingLeaves}>
                    Refresh
                  </Button>
                </div>
              </div>
              {pendingLoading ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">Loading…</div>
              ) : displayPending.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">No pending leave requests</div>
              ) : (
                <div className="space-y-3">
                  {displayPending.map((lv: any) => (
                    <Card key={lv.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{lv.fullName || lv.userId}</p>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-amber-600 text-white">Pending</span>
                            {lv.role && (
                              <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">{(lv.role || '').toString()}</span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            {lv.startDate} → {lv.endDate}
                            {lv.typeKey && (
                              <span className="ml-2 inline-block px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase">{lv.typeKey}</span>
                            )}
                          </div>
                          {lv.reason && (
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{lv.reason}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={async () => {
                              if (!user?.id) return;
                              const ok = await LeaveService.approveLeave(lv.id, user.id);
                              if (ok) {
                                setPendingLeaves(prev => prev.filter((p: any) => p.id !== lv.id));
                              }
                            }}
                            size="sm"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={async () => {
                              if (!user?.id) return;
                              const ok = await LeaveService.rejectLeave(lv.id, user.id);
                              if (ok) {
                                setPendingLeaves(prev => prev.filter((p: any) => p.id !== lv.id));
                              }
                            }}
                            variant="secondary"
                            size="sm"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Unassigned */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Unassigned</h2>
                <span className="text-sm text-gray-600 dark:text-gray-400">{unassignedList.length}</span>
              </div>
              {unassignedList.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">No unassigned work orders</div>
              ) : (
                <div className="space-y-3">
                  {unassignedList.map(wo => (
                    <Card key={wo.id} className="p-3 cursor-pointer" onClick={() => wo.id && onWorkOrderClick(wo.id)}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{wo.title || 'Untitled Work Order'}</p>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate">{locationNames[wo.location_id] || wo.location_id || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={wo.status} size="sm" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Admin Metrics */}
            <Card>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-amber-600 text-white text-center">
                  <div className="text-xs font-medium text-white/90">Active</div>
                  <div className="mt-1 text-2xl font-bold">{activePendingCount}</div>
                </div>
                <div className="p-3 rounded-lg bg-violet-700 text-white text-center">
                  <div className="text-xs font-medium text-white/90">Review</div>
                  <div className="mt-1 text-2xl font-bold">{approvalsList.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-green-600 text-white text-center">
                  <div className="text-xs font-medium text-white/90">Done</div>
                  <div className="mt-1 text-2xl font-bold">{doneCount}</div>
                </div>
              </div>
            </Card>

            {/* Technician comparison (stacked bars) - admin view */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Technician Workload</h2>
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-600" /> Active</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-violet-700" /> Review</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-600" /> Done</span>
                </div>
              </div>
              {technicianAgg.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">No technician assignments</div>
              ) : (
                <div className="space-y-3">
                  {technicianAgg.map(t => {
                    const name = t.id === 'unassigned' ? 'Unassigned' : (profileNames[t.id] || t.id);
                    const pctA = t.total ? Math.round((t.active / t.total) * 100) : 0;
                    const pctR = t.total ? Math.round((t.review / t.total) * 100) : 0;
                    const pctD = t.total ? Math.round((t.done / t.total) * 100) : 0;
                    return (
                      <div key={t.id} className="">
                        <div className="flex items-center justify-between mb-1">
                          <div className="truncate text-sm text-gray-900 dark:text-gray-100">{name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{t.total}</div>
                        </div>
                        <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          {t.total === 0 ? (
                            <div className="w-full h-full bg-gray-300 dark:bg-gray-700" />
                          ) : (
                            <div className="flex w-full h-full">
                              {pctA > 0 && <div className="bg-amber-600" style={{ width: `${pctA}%` }} />}
                              {pctR > 0 && <div className="bg-violet-700" style={{ width: `${pctR}%` }} />}
                              {pctD > 0 && <div className="bg-green-600" style={{ width: `${pctD}%` }} />}
                            </div>
                          )}
                        </div>
                        <div className="mt-1 text-[10px] text-gray-600 dark:text-gray-400 flex gap-3">
                          <span>Active {t.active}</span>
                          <span>Review {t.review}</span>
                          <span>Done {t.done}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            
            {/* Leave Management (placeholder) */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leave Management</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {leaveStart && leaveEnd ? 'On leave in selected range' : 'On leave today'}
                </div>
                {leaveLoading ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400">Loading…</div>
                ) : leaveList.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400">No staff on leave</div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {leaveList.map(item => (
                      <li key={item.id} className="py-2 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-sm text-gray-900 dark:text-gray-100 truncate">{item.fullName}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {item.startDate} → {item.endDate}
                          </div>
                        </div>
                        {item.typeKey && (
                          <span className="ml-3 text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase">
                            {item.typeKey}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Activity */}
            <Activity />
          </>
        ) : (<React.Fragment>
        {/* Personal Greeting moved into Header */}

        {/* Next Job - Enhanced with status-based styling */}
        {(() => {
          const s = (nextJob?.status || '').toLowerCase();
          const isDone = ['completed','done','closed'].includes(s) || !nextJob;
          // Use neutral Card surface; avoid colored card backgrounds.
          // was used for colored cards; no longer needed
          // const isActiveDark = false;
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
            <Card className="bg-[url('/light.png')] dark:bg-[url('/night.png')] bg-cover bg-center bg-no-repeat">
              <div className="flex items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Next Job</h2>
                {!isDone && nextJob && (
                  <div className="ml-auto flex items-center gap-2 whitespace-nowrap">
                    <StatusBadge status={nextJob.status as any} size="sm" />
                    {renderComplaintBadge(nextJob)}
                    <PriorityBadge priority={(nextJob as any).priority} size="sm" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {isDone || !nextJob ? (
                  <div className="py-2 text-sm text-gray-600 dark:text-gray-400">No job at the moment</div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
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
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{nextJob.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-400" />
                            <span className="truncate">
                              {locationNames[nextJob.location_id] || nextJob.location_id || 'Location not specified'}
                            </span>
                          </div>
                          {(() => {
                            const rel = timeUntilDue(nextJob.due_date);
                            if (!rel) return null;
                            return (
                              <>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
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
          <div className="grid grid-cols-3 gap-3">
            {/* Active */}
            <div className="p-3 rounded-lg bg-amber-600 text-white text-center">
              <div className="text-xs font-medium text-white/90">Active</div>
              <div className="mt-1 text-2xl font-bold">{activePendingCount}</div>
            </div>
            {/* Review */}
            <div className="p-3 rounded-lg bg-violet-700 text-white text-center">
              <div className="text-xs font-medium text-white/90">Review</div>
              <div className="mt-1 text-2xl font-bold">{reviewCount}</div>
            </div>
            {/* Done */}
            <div className="p-3 rounded-lg bg-green-600 text-white text-center">
              <div className="text-xs font-medium text-white/90">Done</div>
              <div className="mt-1 text-2xl font-bold">{doneCount}</div>
            </div>
          </div>
        </Card>

        

        {/* Activity (latest notifications) */}
        <Activity />
        </React.Fragment>
        )}
      </div>
    </div>
  );
};