import { User, Asset, WorkOrder, MaintenanceLog, LeaveRequest, LeaveBalance } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'john.doe@company.com',
    name: 'John Doe',
    role: 'technician',
    phoneNumber: '+1-555-0123',
    profilePhoto: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    createdAt: new Date('2023-01-15'),
  },
  {
    id: 'user2',
    email: 'jane.smith@company.com',
    name: 'Jane Smith',
    role: 'technician',
    phoneNumber: '+1-555-0124',
    profilePhoto: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    createdAt: new Date('2023-02-20'),
  },
  {
    id: 'user3',
    email: 'mike.wilson@company.com',
    name: 'Mike Wilson',
    role: 'technician',
    phoneNumber: '+1-555-0125',
    profilePhoto: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    createdAt: new Date('2023-03-10'),
  },
];

// Mock Assets
export const mockAssets: Asset[] = [
  {
    id: 'asset1',
    name: 'HVAC Unit A1',
    type: 'HVAC',
    location: 'Building A - Floor 1',
    serialNumber: 'HVAC-001',
    manufacturer: 'Carrier',
    model: 'X1000',
    installationDate: new Date('2022-01-15'),
    status: 'operational',
  },
  {
    id: 'asset2',
    name: 'Elevator B2',
    type: 'Elevator',
    location: 'Building B - Main',
    serialNumber: 'ELEV-002',
    manufacturer: 'Otis',
    model: 'Gen2',
    installationDate: new Date('2021-06-20'),
    status: 'maintenance',
  },
  {
    id: 'asset3',
    name: 'Generator C1',
    type: 'Generator',
    location: 'Building C - Basement',
    serialNumber: 'GEN-003',
    manufacturer: 'Caterpillar',
    model: 'C15',
    installationDate: new Date('2020-03-10'),
    status: 'operational',
  },
  {
    id: 'asset4',
    name: 'Pump Station D1',
    type: 'Pump',
    location: 'Building D - Mechanical Room',
    serialNumber: 'PUMP-004',
    manufacturer: 'Grundfos',
    model: 'CR64',
    installationDate: new Date('2022-08-15'),
    status: 'out_of_service',
  },
];

// Mock Work Orders
export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo1',
    title: 'HVAC Filter Replacement',
    description: 'Replace air filters in HVAC Unit A1. Check for any unusual wear or damage.',
    status: 'pending',
    priority: 'medium',
    assignedTo: 'user1',
    assetId: 'asset1',
    scheduledDate: new Date(),
    estimatedHours: 2,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'wo2',
    title: 'Elevator Safety Inspection',
    description: 'Monthly safety inspection of Elevator B2. Test all safety systems and emergency features.',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'user1',
    assetId: 'asset2',
    scheduledDate: new Date(Date.now() - 86400000), // Yesterday
    estimatedHours: 4,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: 'wo3',
    title: 'Generator Oil Change',
    description: 'Scheduled oil change for Generator C1. Check oil levels and replace filter.',
    status: 'completed',
    priority: 'medium',
    assignedTo: 'user1',
    assetId: 'asset3',
    scheduledDate: new Date(Date.now() - 172800000), // 2 days ago
    completedDate: new Date(Date.now() - 86400000), // Yesterday
    estimatedHours: 3,
    actualHours: 2.5,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: 'wo4',
    title: 'Pump Station Repair',
    description: 'Repair faulty pump motor in Pump Station D1. Replace damaged components.',
    status: 'pending',
    priority: 'critical',
    assignedTo: 'user2',
    assetId: 'asset4',
    scheduledDate: new Date(Date.now() + 86400000), // Tomorrow
    estimatedHours: 6,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: 'wo5',
    title: 'HVAC Duct Cleaning',
    description: 'Clean air ducts and vents for HVAC Unit A1. Remove any debris or blockages.',
    status: 'pending',
    priority: 'low',
    assignedTo: 'user1',
    assetId: 'asset1',
    scheduledDate: new Date(Date.now() + 172800000), // Day after tomorrow
    estimatedHours: 4,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
];

// Mock Maintenance Logs
export const mockMaintenanceLogs: MaintenanceLog[] = [
  {
    id: 'log1',
    workOrderId: 'wo3',
    technicianId: 'user1',
    notes: 'Oil change completed successfully. Filter was dirty and replaced. Generator running smoothly.',
    completedAt: new Date(Date.now() - 86400000),
    photos: ['https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400'],
    hoursSpent: 2.5,
  },
];

// Mock Leave Requests
export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave1',
    userId: 'user1',
    type: 'annual',
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-02-16'),
    reason: 'Family vacation',
    status: 'approved',
    requestedAt: new Date('2024-01-10'),
    approvedBy: 'manager1',
    approvedAt: new Date('2024-01-12'),
  },
  {
    id: 'leave2',
    userId: 'user1',
    type: 'sick',
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-01-20'),
    reason: 'Doctor appointment',
    status: 'pending',
    requestedAt: new Date('2024-01-15'),
  },
  {
    id: 'leave3',
    userId: 'user2',
    type: 'annual',
    startDate: new Date('2024-02-10'),
    endDate: new Date('2024-02-14'),
    reason: 'Winter break',
    status: 'approved',
    requestedAt: new Date('2024-01-05'),
    approvedBy: 'manager1',
    approvedAt: new Date('2024-01-08'),
  },
];

// Mock Leave Balances
export const mockLeaveBalances: LeaveBalance[] = [
  {
    userId: 'user1',
    year: 2024,
    sickDaysTotal: 10,
    sickDaysUsed: 2,
    annualDaysTotal: 20,
    annualDaysUsed: 5,
    personalDaysTotal: 5,
    personalDaysUsed: 1,
  },
  {
    userId: 'user2',
    year: 2024,
    sickDaysTotal: 10,
    sickDaysUsed: 0,
    annualDaysTotal: 20,
    annualDaysUsed: 8,
    personalDaysTotal: 5,
    personalDaysUsed: 0,
  },
  {
    userId: 'user3',
    year: 2024,
    sickDaysTotal: 10,
    sickDaysUsed: 1,
    annualDaysTotal: 20,
    annualDaysUsed: 3,
    personalDaysTotal: 5,
    personalDaysUsed: 2,
  },
];