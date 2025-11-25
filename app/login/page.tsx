'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handlePinChange = (value: string) => {
    // Only allow digits and max 5 characters
    if (/^\d*$/.test(value) && value.length <= 5) {
      setPin(value);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length !== 5) {
      setError('PIN must be 5 digits');
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
        body: JSON.stringify({ pin, role: selectedRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Login successful
      login(data.user.role, data.user.id);
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
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
          <h1 className="text-3xl font-semibold text-stone-900 mb-2">
            Solar Sales Manager
          </h1>
          <p className="text-stone-600">
            Sign in to manage your solar customers
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-3">
                Select Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    selectedRole === 'admin'
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('employee')}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    selectedRole === 'employee'
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                >
                  Employee
                </button>
              </div>
            </div>

            {/* PIN Input */}
            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                Enter 5-digit PIN
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
              disabled={loading || pin.length !== 5}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Default PINs Info */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900 font-medium mb-1">
              Default PINs (Change after first login):
            </p>
            <p className="text-xs text-amber-800">
              Admin: 12345 | Employee: 54321
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-stone-500 mt-6">
          Secure access to your solar sales management system
        </p>
      </div>
    </div>
  );
}
