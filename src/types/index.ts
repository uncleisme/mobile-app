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
  work_order_id: string;
  work_type: string;
  asset_id: string;
  location_id: string;
  status: string; // Your DB uses text, not enum
  priority: string; // Your DB uses text, not enum  
  title: string;
  description: string;
  created_date: Date;
  due_date: Date;
  requested_by: string;
  assigned_to?: string;
  recurrence_rule?: string;
  recurrence_start_date?: Date;
  recurrence_end_date?: Date;
  next_scheduled_date?: Date;
  job_type?: string;
  service_provider_id?: string;
  contact_person?: string;
  contact_number?: string;
  contact_email?: string;
  reference_text?: string;
  unit_number?: string;
  repair_contact_person?: string;
  repair_contact_number?: string;
  repair_contact_email?: string;
  created_at?: Date;
  updated_at?: Date;
  
  // Legacy fields for backward compatibility (optional)
  scheduledDate?: Date; // Maps to due_date
  completedDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  assignedTo?: string; // Maps to assigned_to
  assetId?: string; // Maps to asset_id
  createdAt?: Date; // Maps to created_at
  updatedAt?: Date; // Maps to updated_at
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