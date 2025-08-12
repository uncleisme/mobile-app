import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { Wrench } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('john.doe@company.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Login form submitted with:', { email, password: '***' });

    try {
      const user = await login(email, password);
      console.log('Login successful, user:', user);
      
      // Call success callback immediately after login
      onLoginSuccess?.();
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
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
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              fullWidth
              required
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              fullWidth
              required
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
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
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Demo Accounts:</p>
              <div className="space-y-1">
                <p>• john.doe@company.com</p>
                <p>• jane.smith@company.com</p>
                <p>• mike.wilson@company.com</p>
              </div>
              <p className="mt-2 text-xs text-gray-500">Use any password</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};