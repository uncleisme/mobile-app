import { User } from '../types';
import { supabase } from './supabaseClient';

export class AuthService {
  private static readonly USER_STORAGE_KEY = 'cmms_current_user';
  private static currentUser: User | null = null;

  private static saveUserToStorage(user: User | null) {
    if (user) {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_STORAGE_KEY);
    }
  }

  private static loadUserFromStorage(): User | null {
    try {
      const userJson = localStorage.getItem(this.USER_STORAGE_KEY);
      if (!userJson) return null;
      
      const user = JSON.parse(userJson);
      // Convert string dates back to Date objects
      if (user.createdAt) {
        user.createdAt = new Date(user.createdAt);
      }
      return user;
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      return null;
    }
  }

  static async login(email: string, password: string): Promise<User> {
    console.log('AuthService.login called with:', { email, password: '***' });
    
    // Simple mock login for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    this.saveUserToStorage(user);
    console.log('AuthService saved user to storage, returning:', user);
    return user;
  }

  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    } finally {
      this.currentUser = null;
      this.saveUserToStorage(null);
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    // Return cached user if available
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to load user from storage
    const storedUser = this.loadUserFromStorage();
    if (storedUser) {
      this.currentUser = storedUser;
      console.log('Loaded user from storage:', storedUser);
      return storedUser;
    }

    // No user in memory or storage
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