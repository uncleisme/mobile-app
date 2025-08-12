import { useState, useEffect } from 'react';
import { User } from '../types';
import { AuthService } from '../services/AuthService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Simple auth check without complex Supabase calls
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Set user to null if auth fails
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('useAuth.login called with:', { email, password: '***' });
    const user = await AuthService.login(email, password);
    console.log('AuthService returned user:', user);
    
    // Force state update with functional update to ensure re-render
    setUser(() => {
      console.log('Setting user state to:', user);
      return user;
    });
    
    console.log('User state updated in useAuth, new user:', user);
    console.log('isAuthenticated will be:', !!user);
    return user;
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const updatedUser = await AuthService.updateProfile(updates);
    setUser(updatedUser);
    return updatedUser;
  };

  return {
    user,
    loading,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };
};