import { useEffect, useMemo, useState } from 'react';
import { WorkOrder } from '../../types';
import { WorkOrderService } from '../../services/WorkOrderService';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../layout/Header';
import { Search, Filter, Clock, MapPin, AlertTriangle, CheckCircle2, PlayCircle, Circle, Eye } from 'lucide-react';

interface WorkOrdersListProps {
  onWorkOrderClick: (workOrderId: string) => void;
  refreshKey?: number;
}

const STATUS_OPTIONS = [
  { id: 'all', label: 'All', icon: Circle },
  { id: 'active', label: 'Active', icon: Circle },
  { id: 'in_progress', label: 'In Progress', icon: PlayCircle },
  { id: 'review', label: 'Review', icon: Eye },
  { id: 'done', label: 'Done', icon: CheckCircle2 },
  { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
] as const;

export const WorkOrdersList: React.FC<WorkOrdersListProps> = ({ onWorkOrderClick, refreshKey }) => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]['id']>('all');
  const [sort, setSort] = useState<'due_asc' | 'due_desc'>('due_asc');
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        setLoading(true);
        const orders = await WorkOrderService.getWorkOrdersForTechnician(user.id);
        setWorkOrders(Array.isArray(orders) ? orders : []);
      } catch (e) {
        console.error('Failed to load work orders:', e);
        setWorkOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, refreshKey]);

  // Fetch location names based on location_id present in the loaded work orders
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const ids = workOrders.map(w => w.location_id).filter(Boolean) as string[];
        if (ids.length === 0) { setLocationNames({}); return; }
        const map = await WorkOrderService.getLocationNamesByIds(ids);
        setLocationNames(map);
      } catch (err) {
        console.warn('Failed to resolve location names:', err);
        setLocationNames({});
      }
    };
    fetchLocations();
  }, [workOrders]);

  const filtered = useMemo(() => {
    let result = [...workOrders];
    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(w =>
        (w.title || '').toLowerCase().includes(q) ||
        (w.description || '').toLowerCase().includes(q) ||
        (w.location_id || '').toLowerCase().includes(q)
      );
    }
    // Status filter (using loose matching to your text statuses)
    if (status !== 'all') {
      result = result.filter(w => {
        const s = (w.status || '').toLowerCase();
        if (status === 'active') return ['active','pending','new','open','assigned'].includes(s);
        if (status === 'in_progress') return ['in progress','in_progress','started','working'].includes(s);
        if (status === 'review') return ['review','in review','in_review','awaiting review','awaiting_review'].includes(s);
        if (status === 'done') return ['done','completed','closed'].includes(s);
        if (status === 'overdue') {
          const due = new Date(w.due_date);
          const today = new Date(); today.setHours(0,0,0,0);
          return due < today && !['done','completed','closed'].includes(s);
        }
        return true;
      });
    }
    // Sort
    result.sort((a,b) => {
      const da = new Date(a.due_date).getTime();
      const db = new Date(b.due_date).getTime();
      return sort === 'due_asc' ? da - db : db - da;
    });
    return result;
  }, [workOrders, query, status, sort]);

  const formatDate = (d?: string | Date) => {
    if (!d) return '';
    try { return new Date(d).toLocaleString(); } catch { return ''; }
  };

  const statusBadge = (wo: WorkOrder) => {
    const s = (wo.status || '').toLowerCase();
    // Explicit statuses take precedence over overdue
    if (['done','completed','closed'].includes(s)) return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Done</span>
    );
    if (['review','in review','in_review','awaiting review','awaiting_review'].includes(s)) return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-violet-100 text-violet-700">Review</span>
    );
    if (['in progress','in_progress','started','working'].includes(s)) return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">In Progress</span>
    );
    // Overdue if no explicit status above
    const due = new Date(wo.due_date);
    const today = new Date(); today.setHours(0,0,0,0);
    if (due < today) return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Overdue</span>
    );
    return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">Active</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with inlined controls; bell removed */}
      <Header 
        title="" 
        showNotifications={false}
        plain
        subContent={(
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-2 flex-1">
              <Search size={18} className="text-gray-500 mr-2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, description or location"
                className="bg-transparent outline-none placeholder-gray-500 text-gray-900 w-full"
              />
            </div>
            <div className="bg-gray-100 rounded-full px-3 py-2 flex items-center">
              <Filter size={18} className="text-gray-500 mr-2" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="bg-transparent outline-none text-gray-900"
              >
                <option value="due_asc">Due Date ↑</option>
                <option value="due_desc">Due Date ↓</option>
              </select>
            </div>
          </div>
        )}
      />

      {/* Status pills */}
      <div className="px-4 pt-4 max-w-md mx-auto">
        <div className="mt-0 flex gap-2 overflow-x-auto no-scrollbar">
          {STATUS_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const active = status === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setStatus(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Icon size={16} /> {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 max-w-md mx-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading work orders…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No work orders found</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(wo => (
              <div
                key={wo.id}
                className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => wo.id && onWorkOrderClick(wo.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{wo.title || 'Untitled Work Order'}</h3>
                    {wo.work_type ? (
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                          {wo.work_type}
                        </span>
                      </div>
                    ) : null}
                    <p className="text-sm text-gray-500 line-clamp-2">{wo.description || 'No description'}</p>
                  </div>
                  {statusBadge(wo)}
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1"><Clock size={16} className="text-gray-400" /> {formatDate(wo.due_date)}</div>
                  <div className="flex items-center gap-1"><MapPin size={16} className="text-gray-400" /> {locationNames[wo.location_id] || wo.location_id || 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
