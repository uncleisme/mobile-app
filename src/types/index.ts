// Core data types for the CMMS app
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'technician' | 'admin' | 'manager';
  phoneNumber?: string;
  profilePhoto?: string;
  createdAt: Date;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  installationDate?: Date;
  status: 'operational' | 'maintenance' | 'out_of_service';
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string; // user ID
  assetId: string;
  scheduledDate: Date;
  completedDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceLog {
  id: string;
  workOrderId: string;
  technicianId: string;
  notes: string;
  completedAt: Date;
  photos?: string[];
  hoursSpent?: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: 'sick' | 'annual' | 'personal' | 'emergency';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface LeaveBalance {
  userId: string;
  year: number;
  sickDaysTotal: number;
  sickDaysUsed: number;
  annualDaysTotal: number;
  annualDaysUsed: number;
  personalDaysTotal: number;
  personalDaysUsed: number;
}