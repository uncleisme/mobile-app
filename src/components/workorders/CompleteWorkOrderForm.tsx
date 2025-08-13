import React, { useState } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import { Button } from '../ui/Button';
// Removed Textarea and Input imports as we are not collecting notes or hours
import { Card } from '../ui/Card';
import { WorkOrderService } from '../../services/WorkOrderService';

interface CompleteWorkOrderFormProps {
  workOrderId: string;
  workOrderTitle: string;
  onBack: () => void;
  onComplete: () => void;
}

export const CompleteWorkOrderForm: React.FC<CompleteWorkOrderFormProps> = ({
  workOrderId,
  workOrderTitle,
  onBack,
  onComplete,
}) => {
  // Removed notes and hours state per requirements
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Create local object URLs for preview only. Replace with real storage upload later.
      const objectUrls = Array.from(files).map((file) => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...objectUrls]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Photos are required
    if (photos.length === 0) {
      setError('At least one photo is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await WorkOrderService.completeWorkOrder(workOrderId, '', 0, photos);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete work order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="px-4 py-3 safe-area-pt">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Complete Work Order</h1>
            <p className="text-sm text-gray-500 truncate">{workOrderTitle}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos (Required)</h3>
            
            <div className="space-y-4">
              {/* Upload Button */}
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200">
                <Camera size={20} className="text-gray-400" />
                <span className="text-gray-600">Take Photo or Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  required
                />
              </label>

              {/* Photo Preview */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Work completion photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors duration-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="success"
            size="lg"
            fullWidth
            loading={loading}
          >
            Complete Work Order
          </Button>
        </form>
      </div>
    </div>
  );
};