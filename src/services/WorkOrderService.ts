import { WorkOrder, Asset, MaintenanceLog } from '../types';
import { mockWorkOrders, mockAssets, mockMaintenanceLogs } from './mockData';

export class WorkOrderService {
  private static workOrders = [...mockWorkOrders];
  private static maintenanceLogs = [...mockMaintenanceLogs];

  static async getWorkOrdersForTechnician(technicianId: string): Promise<WorkOrder[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.workOrders.filter(wo => wo.assignedTo === technicianId);
  }

  static async getWorkOrderById(id: string): Promise<WorkOrder | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.workOrders.find(wo => wo.id === id) || null;
  }

  static async getAssetById(id: string): Promise<Asset | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAssets.find(asset => asset.id === id) || null;
  }

  static async completeWorkOrder(
    workOrderId: string,
    notes: string,
    hoursSpent: number,
    photos: string[] = []
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const workOrderIndex = this.workOrders.findIndex(wo => wo.id === workOrderId);
    if (workOrderIndex === -1) {
      throw new Error('Work order not found');
    }

    // Update work order status
    this.workOrders[workOrderIndex] = {
      ...this.workOrders[workOrderIndex],
      status: 'completed',
      completedDate: new Date(),
      actualHours: hoursSpent,
      updatedAt: new Date(),
    };

    // Create maintenance log
    const maintenanceLog: MaintenanceLog = {
      id: `log_${Date.now()}`,
      workOrderId,
      technicianId: this.workOrders[workOrderIndex].assignedTo,
      notes,
      completedAt: new Date(),
      photos,
      hoursSpent,
    };

    this.maintenanceLogs.push(maintenanceLog);
  }

  static async getMaintenanceLogsForWorkOrder(workOrderId: string): Promise<MaintenanceLog[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return this.maintenanceLogs.filter(log => log.workOrderId === workOrderId);
  }

  static getWorkOrdersByStatus(workOrders: WorkOrder[], status: string): WorkOrder[] {
    if (status === 'all') return workOrders;
    return workOrders.filter(wo => wo.status === status);
  }

  static getTodaysWorkOrders(workOrders: WorkOrder[]): WorkOrder[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return workOrders.filter(wo => {
      const scheduledDate = new Date(wo.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      return scheduledDate >= today && scheduledDate < tomorrow;
    });
  }

  static getOverdueWorkOrders(workOrders: WorkOrder[]): WorkOrder[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return workOrders.filter(wo => {
      if (wo.status === 'completed') return false;
      const scheduledDate = new Date(wo.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      return scheduledDate < today;
    });
  }
}