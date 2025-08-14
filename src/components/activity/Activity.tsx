import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Card } from '../ui/Card';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationItem {
  id: string;
  module?: string | null;
  message?: string | null;
  created_at?: string | null;
  action?: string | null;
  entity_id?: string | null;
}

export const Activity: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pulling = useRef(false);
  const startY = useRef(0);
  const pullDistance = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const timeAgo = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = Math.max(0, now.getTime() - then.getTime());
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  };

  const getActionColors = (action?: string) => {
    const a = (action || '').toLowerCase();
    if (a === 'created' || a === 'create') return { bg: 'bg-emerald-100', fg: 'text-emerald-600' };
    if (a === 'updated' || a === 'update') return { bg: 'bg-blue-100', fg: 'text-blue-600' };
    if (a === 'deleted' || a === 'delete') return { bg: 'bg-red-100', fg: 'text-red-600' };
    if (a === 'review') return { bg: 'bg-violet-100', fg: 'text-violet-600' };
    if (a === 'completed' || a === 'done') return { bg: 'bg-green-100', fg: 'text-green-600' };
    return { bg: 'bg-gray-100', fg: 'text-gray-500' };
  };

  const fetchActivity = async () => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    try {
      setError(null);
      // Base query for Work Order module (case-insensitive, allows variants like "Work Order(s)")
      const base = supabase
        .from('notifications')
        .select('id, module, action, entity_id, message, created_at')
        .ilike('module', 'work order%')
        .order('created_at', { ascending: false })
        .limit(3);

      // 1) Try strict user_id filter first
      let { data, error } = await base.eq('user_id', user.id);
      if (error) throw error;

      // 2) If no results, try recipients array contains (works for uuid[] or jsonb arrays)
      if (!data || data.length === 0) {
        const res2 = await base.contains('recipients' as any, [user.id] as any);
        if (res2.error) throw res2.error;
        data = res2.data as any[];
      }

      // 3) Still nothing? Fallback to latest Work Order notifications (no user filter)
      if (!data || data.length === 0) {
        const res3 = await base;
        if (res3.error) throw res3.error;
        data = res3.data as any[];
      }

      // 4) Testing fallback: latest notifications regardless of module/user
      if (!data || data.length === 0) {
        const res4 = await supabase
          .from('notifications')
          .select('id, module, message, created_at')
          .order('created_at', { ascending: false })
          .limit(3);
        if (res4.error) throw res4.error;
        data = res4.data as any[];
      }

      // Attempt to map any Work Order entity_id (UUID) to its human-readable work_order_id
      let items: NotificationItem[] = Array.isArray(data) ? (data as NotificationItem[]) : [];
      try {
        const rawIds = items.map(i => (i.entity_id || '').trim()).filter(Boolean);
        const ids = Array.from(new Set(rawIds));
        if (ids.length) {
          // 1) Map by primary key id
          const { data: byId, error: errById } = await supabase
            .from('work_orders')
            .select('id, work_order_id')
            .in('id', ids);
          const map = new Map<string, string>();
          if (!errById && byId) {
            (byId as any[]).forEach(r => map.set(String(r.id), String(r.work_order_id || r.id)));
          }

          // 2) For any that didn't match, attempt to map where entity_id actually stores work_order_id
          const remaining = ids.filter(id => !map.has(id));
          if (remaining.length) {
            const { data: byCode, error: errByCode } = await supabase
              .from('work_orders')
              .select('id, work_order_id')
              .in('work_order_id', remaining as any);
            if (!errByCode && byCode) {
              (byCode as any[]).forEach(r => map.set(String(r.work_order_id), String(r.work_order_id)));
            }
          }

          // Replace message if it contains raw entity_id or construct nicer fallback
          items = items.map(n => {
            const eid = (n.entity_id || '').trim();
            const humanId = map.get(eid);
            if (eid && humanId) {
              let msg = n.message || '';
              if (msg && msg.includes(eid)) {
                msg = msg.split(eid).join(humanId);
              }
              const looksUuid = /[0-9a-fA-F-]{32,}/.test(msg);
              if (!msg || looksUuid) {
                const act = (n.action || '').toLowerCase();
                if (act === 'review') msg = `Work order "${humanId}" submitted for review`;
                else if (act === 'completed' || act === 'done') msg = `Work order "${humanId}" marked as done`;
                else if (act === 'created') msg = `Work order "${humanId}" has been created`;
                else if (act === 'updated') msg = `Work order "${humanId}" has been updated`;
                else if (act === 'deleted') msg = `Work order "${humanId}" has been deleted`;
                else msg = `Work order "${humanId}" notification`;
              }
              return { ...n, message: msg };
            }
            return n;
          });
        }
      } catch (e) {
        console.warn('Failed to resolve work_order_id for notifications', e);
      }

      console.warn('Activity fetched count:', items?.length || 0);
      setItems(items);
    } catch (e: any) {
      console.warn('Activity fetch failed', e);
      setError('Failed to load activity');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivity(); }, [user?.id]);

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const atTop = (document.scrollingElement?.scrollTop || window.scrollY || 0) <= 0;
    pulling.current = atTop;
    if (pulling.current) {
      startY.current = e.touches[0].clientY;
      pullDistance.current = 0;
    }
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    pullDistance.current = Math.max(0, delta);
    if (containerRef.current) {
      containerRef.current.style.transform = `translateY(${Math.min(pullDistance.current, 60)}px)`;
    }
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = async () => {
    if (!pulling.current) return;
    const threshold = 50;
    const shouldRefresh = pullDistance.current > threshold;
    pulling.current = false;
    pullDistance.current = 0;
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateY(0)';
    }
    if (shouldRefresh) {
      await fetchActivity();
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Activity</h3>
      </div>

      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="-mx-1 px-1"
      >
        {loading ? (
          <div className="py-6 text-sm text-gray-500">Loading...</div>
        ) : error ? (
          <div className="py-4 text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-4 text-sm text-gray-500">No recent activity</div>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => {
              const colors = getActionColors(n.action || undefined);
              return (
              <li key={n.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-9 h-9 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <Bell className={`w-4 h-4 ${colors.fg}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{n.message || n.module || 'Notification'}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.module || 'Notification'}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">{timeAgo(n.created_at)}</span>
                </div>
              </li>
            );})}
          </ul>
        )}
        <div className="pt-2 text-center text-[11px] text-gray-400">
          Pull down to refresh
        </div>
      </div>
    </Card>
  );
};
