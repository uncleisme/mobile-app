import { User } from '../types';
import { supabase } from './supabaseClient';

// Using Supabase-managed sessions; no custom token model needed

export class AuthService {
  private static currentUser: User | null = null;

  private static mapSupabaseUser(su: import('@supabase/supabase-js').User): User {
    const meta = (su as any).user_metadata || {};
    // Try to derive sensible defaults from metadata
    const name = meta.full_name || meta.name || su.email?.split('@')[0] || 'User';
    const role = (meta.role as User['role']) || 'technician';
    const phoneNumber = meta.phone || meta.phoneNumber || undefined;
    const profilePhoto = meta.avatar_url || meta.profilePhoto || undefined;
    return {
      id: su.id,
      email: su.email || '',
      name,
      role,
      phoneNumber,
      profilePhoto,
      createdAt: su.created_at ? new Date(su.created_at) : new Date(),
    };
  }

  static async login(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      throw new Error(error?.message || 'Invalid email or password');
    }
    const mapped = this.mapSupabaseUser(data.user);
    this.currentUser = mapped;
    return mapped;
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
  }

  static async getCurrentUser(): Promise<User | null> {
    // Return cached
    if (this.currentUser) return this.currentUser;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const mapped = this.mapSupabaseUser(data.user);
    this.currentUser = mapped;
    return mapped;
  }

  static async refreshToken(): Promise<boolean> {
    // Supabase auto-refreshes tokens; attempt to read session to verify
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  }

  static async getAuthToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  static async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) throw new Error('No user logged in');
    const metaUpdates: Record<string, any> = {};
    if (updates.name !== undefined) metaUpdates.name = updates.name;
    if (updates.phoneNumber !== undefined) metaUpdates.phoneNumber = updates.phoneNumber;
    if (updates.profilePhoto !== undefined) metaUpdates.profilePhoto = updates.profilePhoto;
    if (updates.role !== undefined) metaUpdates.role = updates.role;
    if (Object.keys(metaUpdates).length > 0) {
      const { error } = await supabase.auth.updateUser({ data: metaUpdates });
      if (error) throw error;
    }
    // Re-fetch user
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error('Failed to fetch updated user');
    const mapped = this.mapSupabaseUser(data.user);
    this.currentUser = mapped;
    return mapped;
  }

  static async isAuthenticated(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  }
}