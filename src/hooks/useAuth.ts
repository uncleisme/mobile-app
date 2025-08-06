import { useState, useEffect } from 'react';
import { User } from '../types';
import { AuthService } from '../services/AuthService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await AuthService.login(email, password);
    setUser(user);
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