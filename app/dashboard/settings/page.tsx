'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth-context';
import { getWorkspaceCode, getVendorName } from '@/lib/env';

export default function SettingsPage() {
  const { userId, username } = useAuth();
  const [activeTab, setActiveTab] = useState<'own' | 'employee'>('own');

  // Own credentials state
  const [ownUsername, setOwnUsername] = useState('');
  const [ownCurrentPin, setOwnCurrentPin] = useState('');
  const [ownNewUsername, setOwnNewUsername] = useState('');
  const [ownNewPin, setOwnNewPin] = useState('');
  const [ownConfirmPin, setOwnConfirmPin] = useState('');

  // Employee credentials state
  const [employeeId, setEmployeeId] = useState('');
  const [employeeUsername, setEmployeeUsername] = useState('');
  const [empCurrentPin, setEmpCurrentPin] = useState('');
  const [empNewUsername, setEmpNewUsername] = useState('');
  const [empNewPin, setEmpNewPin] = useState('');
  const [empConfirmPin, setEmpConfirmPin] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const workspaceCode = getWorkspaceCode();
  const vendorName = getVendorName();

  // Load current username and employee info
  useEffect(() => {
    if (username) {
      setOwnUsername(username);
    }

    // Load employee info
    const loadEmployeeInfo = async () => {
      try {
        const response = await fetch(`/api/auth/manage-user?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.employee) {
            setEmployeeId(data.employee.id);
            setEmployeeUsername(data.employee.username);
          }
        }
      } catch (error) {
        console.error('Failed to load employee info:', error);
      }
    };

    loadEmployeeInfo();
  }, [username, userId]);

  // Handle own username change
  const handleOwnUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!ownNewUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (!ownCurrentPin || !/^\d{5}$/.test(ownCurrentPin)) {
      setError('Current PIN must be exactly 5 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-own-username',
          userId,
          currentPin: ownCurrentPin,
          newUsername: ownNewUsername,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to change username');
        setLoading(false);
        return;
      }

      setSuccess('Username changed successfully. Please log in again with your new username.');
      setOwnUsername(ownNewUsername);
      setOwnNewUsername('');
      setOwnCurrentPin('');

      // Logout after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Handle own PIN change
  const handleOwnPinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!ownCurrentPin || !/^\d{5}$/.test(ownCurrentPin)) {
      setError('Current PIN must be exactly 5 digits');
      return;
    }

    if (!/^\d{5}$/.test(ownNewPin)) {
      setError('New PIN must be exactly 5 digits');
      return;
    }

    if (ownNewPin !== ownConfirmPin) {
      setError('New PINs do not match');
      return;
    }

    if (ownNewPin === ownCurrentPin) {
      setError('New PIN must be different from current PIN');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-own-pin',
          userId,
          currentPin: ownCurrentPin,
          newPin: ownNewPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to change PIN');
        setLoading(false);
        return;
      }

      setSuccess('PIN changed successfully');
      setOwnCurrentPin('');
      setOwnNewPin('');
      setOwnConfirmPin('');
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Handle employee username change
  const handleEmployeeUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!empNewUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (!empCurrentPin || !/^\d{5}$/.test(empCurrentPin)) {
      setError('Your admin PIN must be exactly 5 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-employee-username',
          userId,
          currentPin: empCurrentPin,
          newUsername: empNewUsername,
          targetUserId: employeeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to change employee username');
        setLoading(false);
        return;
      }

      setSuccess('Employee username changed successfully');
      setEmployeeUsername(empNewUsername);
      setEmpNewUsername('');
      setEmpCurrentPin('');
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Handle employee PIN change
  const handleEmployeePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!empCurrentPin || !/^\d{5}$/.test(empCurrentPin)) {
      setError('Your admin PIN must be exactly 5 digits');
      return;
    }

    if (!/^\d{5}$/.test(empNewPin)) {
      setError('New employee PIN must be exactly 5 digits');
      return;
    }

    if (empNewPin !== empConfirmPin) {
      setError('New PINs do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-employee-pin',
          userId,
          currentPin: empCurrentPin,
          newPin: empNewPin,
          targetUserId: employeeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to change employee PIN');
        setLoading(false);
        return;
      }

      setSuccess('Employee PIN changed successfully');
      setEmpCurrentPin('');
      setEmpNewPin('');
      setEmpConfirmPin('');
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
            <p className="text-stone-600 mt-1">Manage credentials and workspace configuration</p>
          </div>

          {/* Workspace Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-amber-900 mb-4">Workspace Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-amber-800">Workspace Code:</span>
                <span className="text-sm text-amber-900 font-mono bg-white px-3 py-1 rounded">{workspaceCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-amber-800">Vendor Name:</span>
                <span className="text-sm text-amber-900">{vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-amber-800">Your Username:</span>
                <span className="text-sm text-amber-900 font-mono">{ownUsername}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-stone-200">
            <div className="flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab('own');
                  setError('');
                  setSuccess('');
                }}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'own'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                My Credentials
              </button>
              <button
                onClick={() => {
                  setActiveTab('employee');
                  setError('');
                  setSuccess('');
                }}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'employee'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                Employee Management
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Own Credentials Tab */}
          {activeTab === 'own' && (
            <div className="space-y-6">
              {/* Change Own Username */}
              <div className="bg-white border border-stone-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Change Username</h3>
                <form onSubmit={handleOwnUsernameChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      New Username
                    </label>
                    <input
                      type="text"
                      value={ownNewUsername}
                      onChange={(e) => setOwnNewUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Enter new username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Current PIN (for verification)
                    </label>
                    <input
                      type="password"
                      value={ownCurrentPin}
                      onChange={(e) => setOwnCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="• • • • •"
                      maxLength={5}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Change Username'}
                  </button>
                </form>
              </div>

              {/* Change Own PIN */}
              <div className="bg-white border border-stone-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Change PIN</h3>
                <form onSubmit={handleOwnPinChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Current PIN
                    </label>
                    <input
                      type="password"
                      value={ownCurrentPin}
                      onChange={(e) => setOwnCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="• • • • •"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      New PIN (5 digits)
                    </label>
                    <input
                      type="password"
                      value={ownNewPin}
                      onChange={(e) => setOwnNewPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="• • • • •"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Confirm New PIN
                    </label>
                    <input
                      type="password"
                      value={ownConfirmPin}
                      onChange={(e) => setOwnConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="• • • • •"
                      maxLength={5}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Change PIN'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Employee Management Tab */}
          {activeTab === 'employee' && (
            <div className="space-y-6">
              {/* Current Employee Info */}
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-2">Current Employee</h3>
                <p className="text-sm text-stone-600">Username: <span className="font-mono">{employeeUsername}</span></p>
              </div>

              {/* Change Employee Username */}
              <div className="bg-white border border-stone-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Change Employee Username</h3>
                <form onSubmit={handleEmployeeUsernameChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      New Employee Username
                    </label>
                    <input
                      type="text"
                      value={empNewUsername}
                      onChange={(e) => setEmpNewUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Enter new employee username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Your Admin PIN (for verification)
                    </label>
                    <input
                      type="password"
                      value={empCurrentPin}
                      onChange={(e) => setEmpCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="• • • • •"
                      maxLength={5}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Change Employee Username'}
                  </button>
                </form>
              </div>

              {/* Change Employee PIN */}
              <div className="bg-white border border-stone-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Change Employee PIN</h3>
                <form onSubmit={handleEmployeePinChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      New Employee PIN (5 digits)
                    </label>
                    <input
                      type="password"
                      value={empNewPin}
                      onChange={(e) => setEmpNewPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="• • • • •"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Confirm New Employee PIN
                    </label>
                    <input
                      type="password"
                      value={empConfirmPin}
                      onChange={(e) => setEmpConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="• • • • •"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Your Admin PIN (for verification)
                    </label>
                    <input
                      type="password"
                      value={empCurrentPin}
                      onChange={(e) => setEmpCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="• • • • •"
                      maxLength={5}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Change Employee PIN'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
