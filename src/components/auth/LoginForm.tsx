import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { Wrench, Eye, EyeOff, AlertCircle, Info } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('john.doe@company.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{email?: string; password?: string}>({});
  
  const { login } = useAuth();

  const validateForm = (): boolean => {
    const errors: {email?: string; password?: string} = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 3) {
      errors.password = 'Password must be at least 3 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    console.log('Login form submitted with:', { email, password: '***' });

    try {
      const user = await login(email, password);
      console.log('Login successful, user:', user);
      
      // Call success callback after successful login
      onLoginSuccess?.();
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setValidationErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">CMMS Technician</h1>
          <p className="text-gray-600">Sign in to manage your work orders</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                fullWidth
                required
              />
              {validationErrors.email && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.email}
                </div>
              )}
            </div>
            
            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  fullWidth
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.password}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Demo Accounts Available</p>
                  <p>Click on any account below to auto-fill the login form</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('john.doe@company.com', 'password')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm">
                  <p className="font-medium text-gray-900">John Doe (Technician)</p>
                  <p className="text-gray-600">john.doe@company.com</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@company.com', 'admin123')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Admin User</p>
                  <p className="text-gray-600">admin@company.com</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleDemoLogin('manager@company.com', 'manager123')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Manager User</p>
                  <p className="text-gray-600">manager@company.com</p>
                </div>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};