import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { LeaveService } from '../../services/LeaveService';
import { useAuth } from '../../contexts/AuthContext';

interface LeaveRequestFormProps {
  onBack: () => void;
  onSubmit: () => void;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  onBack,
  onSubmit,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'emergency', label: 'Emergency Leave' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate < startDate) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await LeaveService.submitLeaveRequest({
        userId: user.id,
        type: formData.type as 'sick' | 'annual' | 'personal' | 'emergency',
        startDate,
        endDate,
        reason: formData.reason.trim(),
      });
      
      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Request Leave</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="space-y-4">
            <Select
              label="Leave Type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              options={leaveTypes}
              fullWidth
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                fullWidth
                required
              />
              
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                fullWidth
                required
              />
            </div>

            {formData.startDate && formData.endDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <span className="font-medium">Duration:</span> {calculateDays()} day{calculateDays() > 1 ? 's' : ''}
                </p>
              </div>
            )}

            <Textarea
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Please provide a reason for your leave request..."
              rows={3}
              fullWidth
              required
            />
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            fullWidth
          >
            Submit Request
          </Button>
        </div>
      </form>
    </div>
  );
};