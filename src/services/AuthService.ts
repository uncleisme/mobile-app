import { User } from '../types';
import { mockUsers } from './mockData';

export class AuthService {
  private static currentUser: User | null = null;

  static async login(email: string, password: string): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock authentication - accept any password for demo users
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return user;
  }

  static async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  static getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }

    return null;
  }

  static async updateProfile(updates: Partial<User>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    this.currentUser = { ...this.currentUser, ...updates };
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    
    return this.currentUser;
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}