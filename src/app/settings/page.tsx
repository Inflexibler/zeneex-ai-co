'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button';

interface UserData {
  name: string;
  email: string;
  plan: string;
  credits: number;
}

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user');
      const data = await res.json();
      setUserData(data);
      setFormData({ name: data.name, email: data.email });
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMessage('Profile updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchUserData();
      } else {
        console.error('Failed to update profile');
      }
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: '', newPassword: '' }),
      });

      if (res.ok) {
        setSuccessMessage('Password changed successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        console.error('Failed to change password');
      }
    } catch (err) {
      console.error('Password change failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    try {
      setLoading(true);
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        console.error('Failed to delete account');
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 text-green-300 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Profile</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-slate-300 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <Button
            onClick={handleUpdateProfile}
            disabled={loading}
            variant="primary"
          >
            Update Profile
          </Button>
        </div>

        {/* Account Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Account</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-700 rounded">
              <div>
                <p className="text-white font-semibold">Plan</p>
                <p className="text-slate-300">{userData?.plan || 'Free'}</p>
              </div>
              <Button variant="secondary">Upgrade</Button>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-700 rounded">
              <div>
                <p className="text-white font-semibold">Credits</p>
                <p className="text-slate-300">{userData?.credits || 0} remaining</p>
              </div>
              <Button variant="secondary">Buy Credits</Button>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Security</h2>

          <Button
            onClick={handleChangePassword}
            disabled={loading}
            variant="secondary"
            className="w-full"
          >
            Change Password
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-red-400 mb-4">Danger Zone</h2>

          <Button
            onClick={handleDeleteAccount}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
