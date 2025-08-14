import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Card } from '../ui/Card';
import { supabase } from '../../services/supabaseClient';
import { WorkOrderService } from '../../services/WorkOrderService';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationItem {
  id: string;
  module?: string | null;
  message?: string | null;
  created_at?: string | null;
}

export const Activity: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [woRequesterNames, setWoRequesterNames] = useState<Record<string, string>>({}); // woId -> full_name

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

  const fetchActivity = async () => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    try {
      setError(null);
      // Base query for Work Order module (case-insensitive, allows variants like "Work Order(s)")
      const base = supabase
        .from('notifications')
        .select('id, module, message, created_at')
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

      console.warn('Activity fetched count:', data?.length || 0);
      setItems(Array.isArray(data) ? (data as NotificationItem[]) : []);
    } catch (e: any) {
      console.warn('Activity fetch failed', e);
      setError('Failed to load activity');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivity(); }, [user?.id]);

  // Resolve requesters' full names for any WO IDs found in the items' messages
  useEffect(() => {
    const resolveRequesters = async () => {
      try {
        const woIds = Array.from(
          new Set(
            items
              .map((n) => parseWorkOrderInfo(n.message).woId)
              .filter((v): v is string => Boolean(v))
          )
        );
        if (woIds.length === 0) return;

        // Fetch requested_by for those WOs
        const { data, error } = await supabase
          .from('work_orders')
          .select('work_order_id, requested_by')
          .in('work_order_id', woIds);
        if (error) throw error;

        const requesterIds = Array.from(
          new Set(
            (data || [])
              .map((row: any) => row?.requested_by)
              .filter((v: any) => Boolean(v))
              .map((v: any) => String(v))
          )
        );

        const idToName = await WorkOrderService.getProfileNamesByIds(requesterIds);

        const map: Record<string, string> = {};
        (data || []).forEach((row: any) => {
          const wo = String(row.work_order_id);
          const pid = row?.requested_by ? String(row.requested_by) : '';
          if (wo && pid && idToName[pid]) map[wo] = idToName[pid];
        });

        setWoRequesterNames((prev) => ({ ...prev, ...map }));
      } catch (e) {
        console.warn('Failed to resolve WO requesters for Activity:', e);
      }
    };

    if (items.length > 0) {
      void resolveRequesters();
    }
  }, [items]);

  // Best-effort extraction of WO ID and creator name from message text
  const parseWorkOrderInfo = (msg?: string | null): { woId?: string; creator?: string } => {
    if (!msg) return {};
    const str = String(msg);
    // Try patterns like: WO-123, WO 123, Work Order 123
    const woMatch = str.match(/\b(?:WO[-\s]?|Work\s*Order\s*)([A-Za-z0-9_-]+)/i);
    // Try to capture creator after 'by ' up to punctuation or end
    const byMatch = str.match(/\bby\s+([^.,;\n]+)\b/i);
    return {
      woId: woMatch?.[1]?.trim(),
      creator: byMatch?.[1]?.trim(),
    };
  };

  const renderWOMessage = (n: NotificationItem) => {
    const base = n.message || n.module || 'Notification';
    if (/\bby\s+[^.,;\n]+\b/i.test(base)) return base; // already has a creator
    const { woId } = parseWorkOrderInfo(n.message);
    const fullName = woId ? woRequesterNames[woId] : undefined;
    if (fullName) return `${base} by ${fullName}`;
    return base;
  };

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
            {items.map((n) => (
              <li key={n.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{renderWOMessage(n)}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.module || 'Notification'}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">{timeAgo(n.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="pt-2 text-center text-[11px] text-gray-400">
          Pull down to refresh
        </div>
      </div>
    </Card>
  );
};
