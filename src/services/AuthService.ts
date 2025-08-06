import { User } from '../types';
import { supabase } from './supabaseClient';

export class AuthService {
  private static currentUser: User | null = null;

  static async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw new Error(error?.message || 'Invalid email or password');
    }
    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name || data.user.email || '',
      role: data.user.user_metadata?.role || 'technician',
      phoneNumber: data.user.user_metadata?.phoneNumber,
      profilePhoto: data.user.user_metadata?.profilePhoto,
      createdAt: new Date(data.user.created_at),
    };
    this.currentUser = user;
    return user;
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
  }

  static async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || data.user.email || '',
        role: data.user.user_metadata?.role || 'technician',
        phoneNumber: data.user.user_metadata?.phoneNumber,
        profilePhoto: data.user.user_metadata?.profilePhoto,
        createdAt: new Date(data.user.created_at),
      };
      this.currentUser = user;
      return user;
    }
    return null;
  }

  static async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }
    const { data, error } = await supabase.auth.updateUser({ data: updates });
    if (error || !data.user) {
      throw new Error(error?.message || 'Failed to update profile');
    }
    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name || data.user.email || '',
      role: data.user.user_metadata?.role || 'technician',
      phoneNumber: data.user.user_metadata?.phoneNumber,
      profilePhoto: data.user.user_metadata?.profilePhoto,
      createdAt: new Date(data.user.created_at),
    };
    this.currentUser = user;
    return user;
  }

  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}