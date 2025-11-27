'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [workspaceCode, setWorkspaceCode] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [adminPinConfirm, setAdminPinConfirm] = useState('');
  const [employeeUsername, setEmployeeUsername] = useState('');
  const [employeePin, setEmployeePin] = useState('');
  const [employeePinConfirm, setEmployeePinConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate workspace code
    if (!workspaceCode.trim()) {
      setError('Workspace code is required');
      return;
    }

    // Validate admin credentials
    if (!adminUsername.trim()) {
      setError('Admin username is required');
      return;
    }

    if (!/^\d{5}$/.test(adminPin)) {
      setError('Admin PIN must be exactly 5 digits');
      return;
    }

    if (adminPin !== adminPinConfirm) {
      setError('Admin PIN confirmation does not match');
      return;
    }

    // Validate employee credentials
    if (!employeeUsername.trim()) {
      setError('Employee username is required');
      return;
    }

    if (!/^\d{5}$/.test(employeePin)) {
      setError('Employee PIN must be exactly 5 digits');
      return;
    }

    if (employeePin !== employeePinConfirm) {
      setError('Employee PIN confirmation does not match');
      return;
    }

    // Check for duplicate usernames
    if (adminUsername === employeeUsername) {
      setError('Admin and employee usernames must be different');
      return;
    }

    // Check for duplicate PINs
    if (adminPin === employeePin) {
      setError('Admin and employee PINs must be different');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceCode,
          adminUsername,
          adminPin,
          employeeUsername,
          employeePin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Setup failed');
        setLoading(false);
        return;
      }

      // Setup successful, redirect to login
      alert('Setup completed successfully! You can now log in.');
      router.push('/login');
    } catch (err) {
      setError('An error occurred during setup');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-600 mb-2">
            First-Time Setup
          </h1>
          <p className="text-gray-600">
            Create your admin and employee accounts
          </p>
        </div>

        <form onSubmit={handleSetup} className="space-y-6">
          {/* Workspace Code */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Workspace Code
            </label>
            <input
              type="text"
              value={workspaceCode}
              onChange={(e) => setWorkspaceCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter workspace code"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              This should match your NEXT_PUBLIC_WORKSPACE_CODE environment variable
            </p>
          </div>

          {/* Admin Account */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Admin Account
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Admin username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN (5 digits)
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="12345"
                  maxLength={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  value={adminPinConfirm}
                  onChange={(e) => setAdminPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="12345"
                  maxLength={5}
                  required
                />
              </div>
            </div>
          </div>

          {/* Employee Account */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Employee Account
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={employeeUsername}
                  onChange={(e) => setEmployeeUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Employee username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN (5 digits)
                </label>
                <input
                  type="password"
                  value={employeePin}
                  onChange={(e) => setEmployeePin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="54321"
                  maxLength={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  value={employeePinConfirm}
                  onChange={(e) => setEmployeePinConfirm(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="54321"
                  maxLength={5}
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg hover:bg-amber-700 transition duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
              Go to login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
