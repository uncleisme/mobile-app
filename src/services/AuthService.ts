import { User } from '../types';
import { supabase } from './supabaseClient';

export class AuthService {
  private static currentUser: User | null = null;

  static async login(email: string, password: string): Promise<User> {
    console.log('AuthService.login called with:', { email, password: '***' });
    
    // Simple mock login for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    // Create a mock user
    const user: User = {
      id: 'user_123',
      email: email,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      role: 'technician',
      phoneNumber: '+1234567890',
      profilePhoto: undefined,
      createdAt: new Date(),
    };
    
    console.log('AuthService created mock user:', user);
    this.currentUser = user;
    console.log('AuthService cached user, returning:', user);
    return user;
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
  }

  static async getCurrentUser(): Promise<User | null> {
    // Return cached user if available
    if (this.currentUser) {
      return this.currentUser;
    }

    // For now, return null to avoid Supabase connection issues
    // This will show the login form instead of hanging
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