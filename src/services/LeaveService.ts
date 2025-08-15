import { LeaveRequest, LeaveBalance, User } from '../types';
import { supabase } from './supabaseClient';

export class LeaveService {
  // No local mock state; all data from Supabase

  // New lightweight summary type for admin dashboard queries over new schema
  static async getOnLeaveToday(): Promise<Array<{ id: string; userId: string; fullName: string; typeKey: string | null; startDate: string; endDate: string }>> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('leaves')
        .select('id,user_id,type_key,start_date,end_date,status, profiles:profiles!leaves_user_id_fkey(id,full_name)')
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('start_date', { ascending: true });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      return rows.map((row: any) => ({
        id: String(row.id),
        userId: String(row.user_id),
        fullName: String(row.profiles?.full_name || ''),
        typeKey: row.type_key ?? null,
        startDate: String(row.start_date),
        endDate: String(row.end_date),
      }));
    } catch (err) {
      console.warn('Failed to fetch on-leave-today:', err);
      return [];
    }
  }

  // Approval flow over new schema
  static async getPendingLeaves(): Promise<Array<{ id: string; userId: string; fullName: string; role?: string | null; typeKey: string | null; startDate: string; endDate: string; reason: string | null }>> {
    try {
      // Step 1: Fetch leave rows only (avoids RLS issues on joins)
      const { data: leaves, error: leavesErr } = await supabase
        .from('leaves')
        .select('id,user_id,type_key,start_date,end_date,status,reason')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (leavesErr) throw leavesErr;
      const rows = Array.isArray(leaves) ? leaves : [];

      // Step 2: Fetch profiles for user_ids (best-effort)
      const ids = Array.from(new Set(rows.map((r: any) => String(r.user_id)).filter(Boolean)));
      let nameMap: Record<string, { full_name?: string }> = {};
      if (ids.length > 0) {
        try {
          const { data: profs, error: profErr } = await supabase
            .from('profiles')
            .select('id,full_name')
            .in('id', ids);
          if (profErr) throw profErr;
          (profs || []).forEach((p: any) => {
            nameMap[String(p.id)] = { full_name: p.full_name };
          });
        } catch (e) {
          // Don't fail the entire response if profiles are blocked by RLS
          console.warn('Pending leaves: profiles lookup failed (proceeding without names)', e);
        }
      }

      return rows.map((row: any) => ({
        id: String(row.id),
        userId: String(row.user_id),
        fullName: String(nameMap[String(row.user_id)]?.full_name || ''),
        role: null,
        typeKey: row.type_key ?? null,
        startDate: String(row.start_date),
        endDate: String(row.end_date),
        reason: row.reason ?? null,
      }));
    } catch (err) {
      console.warn('Failed to fetch pending leaves:', err);
      return [];
    }
  }

  static async approveLeave(id: string, adminId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('leaves')
        .update({ status: 'approved', approved_by: adminId, approved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Approve leave failed:', err);
      return false;
    }
  }

  static async rejectLeave(id: string, adminId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('leaves')
        .update({ status: 'rejected', approved_by: adminId, approved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Reject leave failed:', err);
      return false;
    }
  }

  static async getOnLeaveInRange(start: string, end: string): Promise<Array<{ id: string; userId: string; fullName: string; typeKey: string | null; startDate: string; endDate: string }>> {
    try {
      // Overlap: (start_date <= end) AND (end_date >= start)
      const { data, error } = await supabase
        .from('leaves')
        .select('id,user_id,type_key,start_date,end_date,status, profiles:profiles!leaves_user_id_fkey(id,full_name)')
        .eq('status', 'approved')
        .lte('start_date', end)
        .gte('end_date', start)
        .order('start_date', { ascending: true });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      return rows.map((row: any) => ({
        id: String(row.id),
        userId: String(row.user_id),
        fullName: String(row.profiles?.full_name || ''),
        typeKey: row.type_key ?? null,
        startDate: String(row.start_date),
        endDate: String(row.end_date),
      }));
    } catch (err) {
      console.warn('Failed to fetch on-leave-in-range:', err);
      return [];
    }
  }

  static async getLeaveRequestsForUser(userId: string): Promise<LeaveRequest[]> {
    try {
      const { data, error } = await supabase
        .from('leaves')
        .select('id,user_id,type_key,start_date,end_date,reason,status,approved_by,approved_at,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      return rows.map((row: any) => ({
        id: String(row.id),
        userId: String(row.user_id),
        type: ((): LeaveRequest['type'] => {
          const k = (row.type_key || '').toString().toLowerCase();
          if (k === 'annual') return 'annual';
          if (k === 'sick') return 'sick';
          if (k === 'unpaid') return 'personal';
          if (k === 'compassionate') return 'emergency';
          return 'annual';
        })(),
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        reason: String(row.reason || ''),
        status: (row.status as LeaveRequest['status']) || 'pending',
        requestedAt: new Date(row.created_at || Date.now()),
        approvedBy: row.approved_by ? String(row.approved_by) : undefined,
        approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      } as LeaveRequest));
    } catch (err) {
      console.warn('Failed to fetch leave requests:', err);
      return [];
    }
  }

  static async getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Fallback: compute from approved leaves this year with default entitlements
        const year = new Date().getFullYear();
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;
        const { data: leaves, error: leavesErr } = await supabase
          .from('leaves')
          .select('type_key,start_date,end_date,status')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .lte('start_date', end)
          .gte('end_date', start);
        if (leavesErr) throw leavesErr;
        const used = { annual: 0, sick: 0, unpaid: 0 } as Record<string, number>;
        (leaves || []).forEach((row: any) => {
          const k = (row.type_key || '').toString().toLowerCase();
          const startD = new Date(row.start_date);
          const endD = new Date(row.end_date);
          const days = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          if (k === 'annual') used.annual += days;
          else if (k === 'sick') used.sick += days;
          else if (k === 'unpaid') used.unpaid += days;
        });
        return {
          userId,
          year,
          // Defaults; adjust if your org uses different entitlements
          annualDaysTotal: 20,
          annualDaysUsed: used.annual,
          sickDaysTotal: 10,
          sickDaysUsed: used.sick,
          personalDaysTotal: 5, // maps to unpaid
          personalDaysUsed: used.unpaid,
        } as LeaveBalance;
      }
      return {
        userId: String(data.user_id),
        year: Number(data.year || new Date().getFullYear()),
        sickDaysTotal: Number(data.sick_days_total || 0),
        sickDaysUsed: Number(data.sick_days_used || 0),
        annualDaysTotal: Number(data.annual_days_total || 0),
        annualDaysUsed: Number(data.annual_days_used || 0),
        personalDaysTotal: Number(data.personal_days_total || 0),
        personalDaysUsed: Number(data.personal_days_used || 0),
      } as LeaveBalance;
    } catch (err) {
      console.warn('Failed to fetch leave balance:', err);
      return null;
    }
  }

  static async submitLeaveRequest(request: Omit<LeaveRequest, 'id' | 'requestedAt' | 'status'>): Promise<LeaveRequest> {
    try {
      // Map legacy LeaveRequest.type to leave_types.key for the new `leaves` table
      // Known keys (seeded): annual, sick, unpaid, compassionate
      const mapTypeKey = (t: LeaveRequest['type']): string | null => {
        const key = (t || '').toString().toLowerCase();
        if (key === 'annual') return 'annual';
        if (key === 'sick') return 'sick';
        if (key === 'personal') return 'unpaid';
        if (key === 'emergency') return 'compassionate';
        if (['unpaid','compassionate'].includes(key)) return key;
        return null;
      };

      const payload = {
        user_id: request.userId,
        type_key: mapTypeKey(request.type),
        start_date: new Date(request.startDate).toISOString().slice(0, 10),
        end_date: new Date(request.endDate).toISOString().slice(0, 10),
        reason: request.reason,
        status: 'pending' as const,
      };
      const { data, error } = await supabase
        .from('leaves')
        .insert(payload)
        .select('id,user_id,type_key,start_date,end_date,reason,status,approved_by,approved_at,created_at')
        .single();
      if (error) throw error;
      return {
        id: String(data.id),
        userId: String(data.user_id),
        // Convert back to our legacy type for UI continuity
        type: ((): LeaveRequest['type'] => {
          const k = (data.type_key || '').toString().toLowerCase();
          if (k === 'annual') return 'annual';
          if (k === 'sick') return 'sick';
          if (k === 'unpaid') return 'personal';
          if (k === 'compassionate') return 'emergency';
          // Default to annual if unknown
          return 'annual';
        })(),
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        reason: String(data.reason || ''),
        status: (data.status as LeaveRequest['status']) || 'pending',
        requestedAt: new Date(data.created_at || Date.now()),
        approvedBy: data.approved_by ? String(data.approved_by) : undefined,
        approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
      } as LeaveRequest;
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      throw err instanceof Error ? err : new Error('Failed to submit leave request');
    }
  }

  static async getAllApprovedLeave(): Promise<(LeaveRequest & { user: User })[]> {
    try {
      const { data, error } = await supabase
        .from('leaves')
        .select('id,user_id,type_key,start_date,end_date,reason,status,approved_by,approved_at,created_at, profiles:profiles!leaves_user_id_fkey(id,full_name,type)')
        .eq('status', 'approved');
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      return rows.map((row: any) => ({
        id: String(row.id),
        userId: String(row.user_id),
        type: ((): LeaveRequest['type'] => {
          const k = (row.type_key || '').toString().toLowerCase();
          if (k === 'annual') return 'annual';
          if (k === 'sick') return 'sick';
          if (k === 'unpaid') return 'personal';
          if (k === 'compassionate') return 'emergency';
          return 'annual';
        })(),
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        reason: String(row.reason || ''),
        status: (row.status as LeaveRequest['status']) || 'approved',
        requestedAt: new Date(row.created_at || Date.now()),
        approvedBy: row.approved_by ? String(row.approved_by) : undefined,
        approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
        user: {
          id: String(row.user_id),
          email: '',
          name: String(row.profiles?.full_name || ''),
          role: (row.profiles?.type as User['role']) || 'technician',
          createdAt: new Date(),
          // profilePhoto is optional; keep undefined unless you add it to select above
        },
      }));
    } catch (err) {
      console.warn('Failed to fetch approved leave:', err);
      return [];
    }
  }

  static async getLeaveCalendarData(): Promise<{
    date: Date;
    users: (User & { leaveType: string })[];
  }[]> {
    const approvedLeave = await this.getAllApprovedLeave();
    const calendarData: { [key: string]: (User & { leaveType: string })[] } = {};

    approvedLeave.forEach(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateKey = date.toISOString().split('T')[0];
        
        if (!calendarData[dateKey]) {
          calendarData[dateKey] = [];
        }
        
        calendarData[dateKey].push({
          ...leave.user,
          leaveType: leave.type,
        });
      }
    });

    return Object.entries(calendarData).map(([dateStr, users]) => ({
      date: new Date(dateStr),
      users,
    }));
  }
}