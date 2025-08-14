import React, { useState, useEffect } from 'react';
import { Camera, LogOut, User, Phone, Mail, Settings, Moon, Sun } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';

export const ProfileSettings: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
  });

  const [uploading, setUploading] = useState(false);
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = saved ? saved === 'dark' : prefersDark;
      setDark(isDark);
    } catch {}
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    try {
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch {}
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!user?.id) throw new Error('No authenticated user');
      setUploading(true);

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      await updateProfile({ profilePhoto: publicUrl });
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert(err instanceof Error ? err.message : 'Avatar upload failed');
    } finally {
      setUploading(false);
      // clear input value to allow re-selecting same file
      if (event.target) event.target.value = '';
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(formData);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
    });
    setEditing(false);
  };

  if (!user) return null;

  // Status pill derived from profiles.type -> user.role
  const role = (user.role || 'technician').toLowerCase();
  const roleStyles = role === 'admin'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-blue-100 text-blue-700';
  const roleText = role === 'admin' ? 'Admin' : 'Technician';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="px-4 pt-4 pb-6 max-w-md mx-auto space-y-6">
        {/* Settings / Theme */}
        <Card variant="plain" className="bg-transparent shadow-none border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="text-gray-500 dark:text-gray-300" size={18} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h3>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {dark ? (
                <Moon size={18} className="text-gray-500 dark:text-gray-300" />
              ) : (
                <Sun size={18} className="text-gray-500" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
            </div>
            <button
              onClick={toggleDark}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dark ? 'bg-blue-600' : 'bg-gray-300'}`}
              aria-label="Toggle dark mode"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${dark ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </Card>
        {/* Profile Photo */}
        <Card variant="plain" className="text-center bg-transparent bg-none shadow-none border-0">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto mb-4">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
              )}
            </div>
            
            <label className={`absolute bottom-3 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 ${uploading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              <Camera className="w-4 h-4 text-white" />
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</h2>
          <div className="mt-1">
            <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full ${roleStyles}`}>
              {roleText}
            </span>
          </div>
        </Card>

        {/* Profile Information */}
        <Card variant="plain" className="bg-transparent bg-none shadow-none border-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>
            {!editing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {editing ? (
              <>
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                />
                
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+1-555-0123"
                  fullWidth
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="success"
                    onClick={handleSave}
                    loading={loading}
                    fullWidth
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 py-2">
                  <User className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <Mail className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <Phone className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone Number</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{user.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Account Actions */}
        <Card variant="plain" className="bg-transparent shadow-none border-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Account</h3>
          
          <Button
            variant="danger"
            onClick={logout}
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
};