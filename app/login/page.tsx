'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getVendorName } from '@/lib/env';

export default function LoginPage() {
  const [workspaceCode, setWorkspaceCode] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const { login } = useAuth();
  const router = useRouter();
  const vendorName = getVendorName();

  // Check if first-time setup is needed
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/auth/setup-status');
        const data = await response.json();

        if (data.setupNeeded) {
          // Redirect to setup page
          router.push('/setup');
        } else {
          setCheckingSetup(false);
        }
      } catch (error) {
        console.error('Failed to check setup status:', error);
        setCheckingSetup(false);
      }
    };

    checkSetupStatus();
  }, [router]);

  const handlePinChange = (value: string) => {
    // Only allow digits and max 5 characters
    if (/^\d*$/.test(value) && value.length <= 5) {
      setPin(value);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!workspaceCode.trim()) {
      setError('Workspace code is required');
      return;
    }

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (pin.length !== 5) {
      setError('PIN must be exactly 5 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceCode, username, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Login successful
      login(data.user.role, data.user.id, data.user.username);

      // Show super admin indicator if applicable
      if (data.isSuperAdmin) {
        console.log('🔒 Super admin access logged');
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Show loading state while checking setup status
  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-2xl mb-4 animate-pulse">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-2xl mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">
            {vendorName}
          </h1>
          <p className="text-stone-600">
            Sign in to access your workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Workspace Code */}
            <div>
              <label
                htmlFor="workspaceCode"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                Workspace Code
              </label>
              <input
                id="workspaceCode"
                type="text"
                value={workspaceCode}
                onChange={(e) => {
                  setWorkspaceCode(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                placeholder="Enter workspace code"
                autoComplete="off"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>

            {/* PIN Input */}
            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                PIN (5 digits)
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none text-lg tracking-widest text-center"
                placeholder="• • • • •"
                maxLength={5}
                autoComplete="off"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !workspaceCode || !username || pin.length !== 5}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900 font-medium mb-1">
              Security Notice:
            </p>
            <p className="text-xs text-amber-800">
              Enter your workspace code, username, and 5-digit PIN to access the system.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-stone-500 mt-6">
          Secure multi-deployment solar sales management
        </p>
      </div>
    </div>
  );
}
