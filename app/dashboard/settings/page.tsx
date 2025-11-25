'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const [adminPin, setAdminPin] = useState({ current: '', new: '', confirm: '' });
  const [employeePin, setEmployeePin] = useState({ current: '', new: '', confirm: '' });
  const [adminLoading, setAdminLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState('');
  const [employeeSuccess, setEmployeeSuccess] = useState('');
  const [adminError, setAdminError] = useState('');
  const [employeeError, setEmployeeError] = useState('');

  const handleAdminPinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (adminPin.new !== adminPin.confirm) {
      setAdminError('New PINs do not match');
      return;
    }

    if (!/^\d{5}$/.test(adminPin.new)) {
      setAdminError('PIN must be exactly 5 digits');
      return;
    }

    setAdminLoading(true);

    try {
      const response = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'admin',
          currentPin: adminPin.current,
          newPin: adminPin.new,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAdminError(data.error || 'Failed to change PIN');
        setAdminLoading(false);
        return;
      }

      setAdminSuccess('Admin PIN changed successfully');
      setAdminPin({ current: '', new: '', confirm: '' });
      setAdminLoading(false);
    } catch (error) {
      setAdminError('An error occurred. Please try again.');
      setAdminLoading(false);
    }
  };

  const handleEmployeePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeError('');
    setEmployeeSuccess('');

    if (employeePin.new !== employeePin.confirm) {
      setEmployeeError('New PINs do not match');
      return;
    }

    if (!/^\d{5}$/.test(employeePin.new)) {
      setEmployeeError('PIN must be exactly 5 digits');
      return;
    }

    setEmployeeLoading(true);

    try {
      // Use admin's current PIN to change employee PIN
      const response = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'employee',
          currentPin: employeePin.current,
          newPin: employeePin.new,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmployeeError(data.error || 'Failed to change PIN');
        setEmployeeLoading(false);
        return;
      }

      setEmployeeSuccess('Employee PIN changed successfully');
      setEmployeePin({ current: '', new: '', confirm: '' });
      setEmployeeLoading(false);
    } catch (error) {
      setEmployeeError('An error occurred. Please try again.');
      setEmployeeLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="max-w-4xl space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">Settings</h2>
            <p className="text-stone-600 mt-1">
              Manage system settings and user PINs
            </p>
          </div>

          {/* Admin PIN Change */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">
              Change Admin PIN
            </h3>
            <form onSubmit={handleAdminPinChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Current Admin PIN
                </label>
                <input
                  type="password"
                  value={adminPin.current}
                  onChange={(e) =>
                    /^\d{0,5}$/.test(e.target.value) &&
                    setAdminPin({ ...adminPin, current: e.target.value })
                  }
                  className="w-full max-w-xs px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                  placeholder="•••••"
                  maxLength={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  New Admin PIN
                </label>
                <input
                  type="password"
                  value={adminPin.new}
                  onChange={(e) =>
                    /^\d{0,5}$/.test(e.target.value) &&
                    setAdminPin({ ...adminPin, new: e.target.value })
                  }
                  className="w-full max-w-xs px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                  placeholder="•••••"
                  maxLength={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Confirm New Admin PIN
                </label>
                <input
                  type="password"
                  value={adminPin.confirm}
                  onChange={(e) =>
                    /^\d{0,5}$/.test(e.target.value) &&
                    setAdminPin({ ...adminPin, confirm: e.target.value })
                  }
                  className="w-full max-w-xs px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                  placeholder="•••••"
                  maxLength={5}
                  required
                />
              </div>

              {adminError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {adminError}
                </div>
              )}

              {adminSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {adminSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={adminLoading}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white font-medium rounded-lg transition-colors"
              >
                {adminLoading ? 'Changing...' : 'Change Admin PIN'}
              </button>
            </form>
          </div>

          {/* Employee PIN Change */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">
              Change Employee PIN
            </h3>
            <form onSubmit={handleEmployeePinChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Current Employee PIN
                </label>
                <input
                  type="password"
                  value={employeePin.current}
                  onChange={(e) =>
                    /^\d{0,5}$/.test(e.target.value) &&
                    setEmployeePin({ ...employeePin, current: e.target.value })
                  }
                  className="w-full max-w-xs px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                  placeholder="•••••"
                  maxLength={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  New Employee PIN
                </label>
                <input
                  type="password"
                  value={employeePin.new}
                  onChange={(e) =>
                    /^\d{0,5}$/.test(e.target.value) &&
                    setEmployeePin({ ...employeePin, new: e.target.value })
                  }
                  className="w-full max-w-xs px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                  placeholder="•••••"
                  maxLength={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Confirm New Employee PIN
                </label>
                <input
                  type="password"
                  value={employeePin.confirm}
                  onChange={(e) =>
                    /^\d{0,5}$/.test(e.target.value) &&
                    setEmployeePin({ ...employeePin, confirm: e.target.value })
                  }
                  className="w-full max-w-xs px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                  placeholder="•••••"
                  maxLength={5}
                  required
                />
              </div>

              {employeeError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {employeeError}
                </div>
              )}

              {employeeSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {employeeSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={employeeLoading}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white font-medium rounded-lg transition-colors"
              >
                {employeeLoading ? 'Changing...' : 'Change Employee PIN'}
              </button>
            </form>
          </div>

          {/* Information */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h4 className="font-semibold text-amber-900 mb-2">
              Security Best Practices
            </h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Use unique PINs that are not easily guessable</li>
              <li>• Change PINs regularly for security</li>
              <li>• Do not share PINs with unauthorized personnel</li>
              <li>• Store PINs securely and never write them down in plain text</li>
            </ul>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
