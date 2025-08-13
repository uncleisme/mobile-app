import { WorkOrder, Asset, MaintenanceLog } from '../types';
import { supabase } from './supabaseClient';

export class WorkOrderService {
  // All data sourced from Supabase. No local mock state.

  // Minimal column set used by the app UI (list + detail header)
  private static readonly baseSelect = `
    id,
    work_order_id,
    title,
    description,
    due_date,
    location_id,
    work_type,
    status,
    priority,
    requested_by,
    assigned_to,
    asset_id,
    created_at
  `;

  private static mapRowToWorkOrder(row: any): WorkOrder {
    // Normalize to app tokens where possible
    const statusRaw = String(row.status || '').toLowerCase();
    const status =
      (statusRaw.includes('complete') || statusRaw.includes('done') || statusRaw.includes('closed')) ? 'completed' :
      statusRaw.includes('progress') ? 'in_progress' :
      statusRaw.includes('cancel') ? 'cancelled' :
      statusRaw.includes('review') ? 'review' :
      'pending';

    const priorityRaw = String(row.priority || '').toLowerCase();
    const priority =
      priorityRaw.includes('crit') ? 'critical' :
      priorityRaw.includes('high') ? 'high' :
      priorityRaw.includes('low') ? 'low' :
      'medium';

    const due = row.due_date ? new Date(row.due_date) : undefined;
    const createdAt = row.created_at ? new Date(row.created_at) : undefined;

    return {
      id: String(row.id),
      work_order_id: String(row.work_order_id),
      work_type: String(row.work_type || ''),
      asset_id: String(row.asset_id),
      location_id: String(row.location_id),
      status,
      priority,
      title: String(row.title),
      description: String(row.description || ''),
      created_date: createdAt ?? new Date(),
      due_date: due ?? new Date(),
      requested_by: row.requested_by ? String(row.requested_by) : undefined,
      assigned_to: row.assigned_to ? String(row.assigned_to) : undefined,
      // Back-compat fields used by components
      scheduledDate: due,
      createdAt,
      assetId: row.asset_id ? String(row.asset_id) : undefined,
      assignedTo: row.assigned_to ? String(row.assigned_to) : undefined,
    } as WorkOrder;
  }

  /**
   * Fetch a mapping of profile id -> display name from Supabase 'profiles' table.
   * Prefers 'name' if present, otherwise falls back to 'full_name', then 'email'.
   */
  static async getProfileNamesByIds(ids: string[]): Promise<Record<string, string>> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return {};
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', unique);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        const id = String(row.id);
        // Prefer full_name explicitly per requirement, then email
        const name = String(row.full_name || row.email || id);
        map[id] = name;
      });
      unique.forEach(id => { if (!map[id]) map[id] = id; });
      return map;
    } catch (err) {
      console.warn('Failed to fetch profiles, returning ID map:', err);
      return unique.reduce((acc, id) => { acc[id] = id; return acc; }, {} as Record<string, string>);
    }
  }

  // Fetch minimal fields from Supabase matching UI needs, fallback to mocks
  static async getWorkOrdersForTechnician(technicianId: string): Promise<WorkOrder[]> {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(this.baseSelect)
        .eq('assigned_to', technicianId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      return rows.map(this.mapRowToWorkOrder);
    } catch (err) {
      console.warn('Supabase fetch failed for work orders:', err);
      return [];
    }
  }

  static async getWorkOrderById(id: string): Promise<WorkOrder | null> {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(this.baseSelect)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return this.mapRowToWorkOrder(data);
    } catch (err) {
      console.warn('Supabase fetch by id failed:', err);
      return null;
    }
  }

  static async getAssetById(id: string): Promise<Asset | null> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      // Minimal mapping; adjust as your schema requires
      return {
        id: String(data.id),
        name: String(data.name || ''),
        type: String(data.type || ''),
        location: String(data.location || ''),
        serialNumber: data.serial_number ? String(data.serial_number) : undefined,
        manufacturer: data.manufacturer ? String(data.manufacturer) : undefined,
        model: data.model ? String(data.model) : undefined,
        installationDate: data.installation_date ? new Date(data.installation_date) : undefined,
        status: (String(data.status || 'operational') as Asset['status']),
      } as Asset;
    } catch (err) {
      console.warn('Failed to fetch asset:', err);
      return null;
    }
  }

  static async completeWorkOrder(
    workOrderId: string,
    notes: string,
    hoursSpent: number,
    photos: string[] = []
  ): Promise<void> {
    // Update the work order status to 'Review'. Notes/hours/photos not persisted yet.
    void notes; void hoursSpent; void photos;
    const { error } = await supabase
      .from('work_orders')
      .update({ status: 'Review', updated_at: new Date().toISOString() })
      .eq('id', workOrderId);
    if (error) throw error;
  }

  static async getMaintenanceLogsForWorkOrder(workOrderId: string): Promise<MaintenanceLog[]> {
    void workOrderId;
    return [];
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
      // Use due_date from your database schema
      const scheduledDate = new Date(wo.due_date);
      scheduledDate.setHours(0, 0, 0, 0);
      return scheduledDate >= today && scheduledDate < tomorrow;
    });
  }

  static getOverdueWorkOrders(workOrders: WorkOrder[]): WorkOrder[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return workOrders.filter(wo => {
      if (wo.status === 'Completed') return false; // Match your DB status values
      // Use due_date from your database schema
      const scheduledDate = new Date(wo.due_date);
      scheduledDate.setHours(0, 0, 0, 0);
      return scheduledDate < today;
    });
  }

  /**
   * Fetch a mapping of location_id -> location name from Supabase 'locations' table.
   * Falls back to echoing the ID if fetch fails or name is missing.
   */
  static async getLocationNamesByIds(ids: string[]): Promise<Record<string, string>> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return {};
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, block, floor, room')
        .in('id', unique);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        const id = String(row.id);
        const name = String(row.name || row.location_name || '');
        const block = row.block ? `Blk ${String(row.block)}` : '';
        const floor = row.floor ? `Floor ${String(row.floor)}` : '';
        const room = row.room ? `Room ${String(row.room)}` : '';
        // Keep name without label, other parts with labels; join with " | "
        const parts = [name, block, floor, room].filter(Boolean);
        map[id] = parts.length ? parts.join(' | ') : id;
      });
      // Ensure any missing ids are present as their own value
      unique.forEach(id => { if (!map[id]) map[id] = id; });
      return map;
    } catch (err) {
      console.warn('Failed to fetch locations, returning ID map:', err);
      return unique.reduce((acc, id) => { acc[id] = id; return acc; }, {} as Record<string, string>);
    }
  }
}