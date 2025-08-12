import { LeaveRequest, LeaveBalance, User } from '../types';
import { supabase } from './supabaseClient';

export class LeaveService {
  // No local mock state; all data from Supabase

  static async getLeaveRequestsForUser(userId: string): Promise<LeaveRequest[]> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      return rows.map((row: any) => ({
        id: String(row.id),
        userId: String(row.user_id),
        type: row.type as LeaveRequest['type'],
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        reason: String(row.reason || ''),
        status: (row.status as LeaveRequest['status']) || 'pending',
        requestedAt: new Date(row.requested_at || row.created_at || Date.now()),
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
      if (!data) return null;
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
      const payload = {
        user_id: request.userId,
        type: request.type,
        start_date: request.startDate,
        end_date: request.endDate,
        reason: request.reason,
        status: 'pending',
      };
      const { data, error } = await supabase
        .from('leave_requests')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      return {
        id: String(data.id),
        userId: String(data.user_id),
        type: data.type as LeaveRequest['type'],
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        reason: String(data.reason || ''),
        status: (data.status as LeaveRequest['status']) || 'pending',
        requestedAt: new Date(data.requested_at || data.created_at || Date.now()),
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
        .from('leave_requests')
        .select('*')
        .eq('status', 'approved');
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      // Without a join to users, return minimal user info
      return rows.map((row: any) => ({
        id: String(row.id),
        userId: String(row.user_id),
        type: row.type as LeaveRequest['type'],
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        reason: String(row.reason || ''),
        status: (row.status as LeaveRequest['status']) || 'approved',
        requestedAt: new Date(row.requested_at || row.created_at || Date.now()),
        approvedBy: row.approved_by ? String(row.approved_by) : undefined,
        approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
        user: { id: String(row.user_id), email: '', name: '', role: 'technician', createdAt: new Date() },
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