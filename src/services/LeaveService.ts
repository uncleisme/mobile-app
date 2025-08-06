import { LeaveRequest, LeaveBalance, User } from '../types';
import { mockLeaveRequests, mockLeaveBalances, mockUsers } from './mockData';

export class LeaveService {
  private static leaveRequests = [...mockLeaveRequests];
  private static leaveBalances = [...mockLeaveBalances];

  static async getLeaveRequestsForUser(userId: string): Promise<LeaveRequest[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return this.leaveRequests.filter(req => req.userId === userId);
  }

  static async getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return this.leaveBalances.find(balance => balance.userId === userId) || null;
  }

  static async submitLeaveRequest(request: Omit<LeaveRequest, 'id' | 'requestedAt' | 'status'>): Promise<LeaveRequest> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const newRequest: LeaveRequest = {
      ...request,
      id: `leave_${Date.now()}`,
      status: 'pending',
      requestedAt: new Date(),
    };

    this.leaveRequests.push(newRequest);
    return newRequest;
  }

  static async getAllApprovedLeave(): Promise<(LeaveRequest & { user: User })[]> {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const approvedRequests = this.leaveRequests.filter(req => req.status === 'approved');
    
    return approvedRequests.map(request => {
      const user = mockUsers.find(u => u.id === request.userId);
      return {
        ...request,
        user: user!,
      };
    });
  }

  static async getLeaveCalendarData(): Promise<{
    date: Date;
    users: (User & { leaveType: string })[];
  }[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

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