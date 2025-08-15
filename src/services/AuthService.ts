import { User } from '../types';
import { supabase } from './supabaseClient';

// Using Supabase-managed sessions; no custom token model needed

export class AuthService {
  private static currentUser: User | null = null;

  private static async getProfile(userId: string): Promise<{ avatar_url?: string; full_name?: string; email?: string; type?: string } | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url, full_name, email, type')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('Failed to fetch profile row:', error.message);
      return null;
    }
    return data as any;
  }

  private static mapSupabaseUser(su: import('@supabase/supabase-js').User): User {
    const meta = (su as any).user_metadata || {};
    // Try to derive sensible defaults from metadata
    const name = meta.full_name || meta.name || su.email?.split('@')[0] || 'User';
    const role = (meta.role as User['role']) || 'technician';
    const phoneNumber = meta.phone || meta.phoneNumber || undefined;
    // Profile photo will be populated from profiles.avatar_url when available
    const profilePhoto = meta.profilePhoto || undefined;
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
    let mapped = this.mapSupabaseUser(data.user);
    // Merge profile row values (avatar_url, full_name, phone)
    const profile = await this.getProfile(mapped.id);
    if (profile) {
      mapped = {
        ...mapped,
        name: profile.full_name || mapped.name,
        // email remains from auth.user; profile.email is informational
        role: (profile.type as User['role']) || mapped.role,
        profilePhoto: profile.avatar_url || mapped.profilePhoto,
      };
    }
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
    let mapped = this.mapSupabaseUser(data.user);
    const profile = await this.getProfile(mapped.id);
    if (profile) {
      mapped = {
        ...mapped,
        name: profile.full_name || mapped.name,
        role: (profile.type as User['role']) || mapped.role,
        profilePhoto: profile.avatar_url || mapped.profilePhoto,
      };
    }

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

    // Persist avatar and other profile attributes into public profiles table
    const profileUpdates: Record<string, any> = {};
    if (updates.profilePhoto !== undefined) profileUpdates.avatar_url = updates.profilePhoto;
    if (updates.name !== undefined) profileUpdates.full_name = updates.name;
    if (updates.role !== undefined) profileUpdates.type = updates.role;
    if (Object.keys(profileUpdates).length > 0) {
      const { error: pErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', this.currentUser.id);
      if (pErr) throw pErr;
    }

    // Re-fetch user
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error('Failed to fetch updated user');
    let mapped = this.mapSupabaseUser(data.user);
    const profile = await this.getProfile(mapped.id);
    if (profile) {
      mapped = {
        ...mapped,
        name: profile.full_name || mapped.name,
        // Preserve role from profiles.type if available; otherwise keep existing role
        role: (profile.type as User['role']) || (this.currentUser?.role as User['role']) || mapped.role,
        profilePhoto: profile.avatar_url || mapped.profilePhoto,
      };
    }
    // If no profile row returned, still preserve previously known role
    if (!profile && this.currentUser?.role) {
      mapped = { ...mapped, role: this.currentUser.role };
    }
    this.currentUser = mapped;
    return mapped;
  }

  static async isAuthenticated(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  }
}