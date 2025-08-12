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
    console.log('AuthService.logout called');
    this.currentUser = null;
    this.saveUserToStorage(null);
    console.log('User cleared from memory and storage');
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
    
    // Update the current user with the provided updates
    const user: User = {
      ...this.currentUser,
      ...updates,
    };
    
    this.currentUser = user;
    this.saveUserToStorage(user);
    return user;
  }

  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}