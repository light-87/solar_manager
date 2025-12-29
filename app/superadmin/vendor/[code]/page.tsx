'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface VendorDetails {
  vendor: {
    id: string;
    code: string;
    name: string;
    is_active: boolean;
    created_at: string;
  };
  stats: {
    customer_count: number;
    user_count: number;
  };
  users: Array<{
    id: string;
    username: string;
    role: string;
    created_at: string;
  }>;
  login_history: Array<{
    username: string;
    role: string;
    created_at: string;
    ip_address: string | null;
  }>;
}

export default function VendorDetailsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [data, setData] = useState<VendorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const getToken = () => sessionStorage.getItem('superadmin_token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/superadmin');
      return;
    }
    fetchVendorDetails();
  }, [code]);

  const fetchVendorDetails = async () => {
    try {
      const response = await fetch(`/api/superadmin/vendors/${code}`, {
        headers: { 'x-superadmin-token': getToken() || '' },
      });

      if (response.status === 401) {
        sessionStorage.removeItem('superadmin_token');
        router.push('/superadmin');
        return;
      }

      const result = await response.json();
      if (!response.ok) {
        setError(result.error);
        return;
      }

      setData(result);
    } catch (err) {
      setError('Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!data) return;

    try {
      const response = await fetch(`/api/superadmin/vendors/${code}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-superadmin-token': getToken() || '',
        },
        body: JSON.stringify({ is_active: !data.vendor.is_active }),
      });

      if (response.ok) {
        setData({
          ...data,
          vendor: { ...data.vendor, is_active: !data.vendor.is_active },
        });
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Vendor not found'}</p>
          <Link href="/superadmin/dashboard" className="text-stone-400 hover:text-white">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900">
      {/* Header */}
      <header className="bg-stone-800 border-b border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/superadmin/dashboard"
                className="text-stone-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">{data.vendor.name}</h1>
                <p className="text-xs text-stone-400">Code: {data.vendor.code}</p>
              </div>
            </div>
            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                data.vendor.is_active
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {data.vendor.is_active ? 'Disable Vendor' : 'Enable Vendor'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-stone-800 rounded-xl p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">Status</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              data.vendor.is_active
                ? 'bg-green-900/50 text-green-400'
                : 'bg-red-900/50 text-red-400'
            }`}>
              {data.vendor.is_active ? 'Active' : 'Disabled'}
            </span>
          </div>
          <div className="bg-stone-800 rounded-xl p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">Total Customers</p>
            <p className="text-3xl font-bold text-white">{data.stats.customer_count}</p>
          </div>
          <div className="bg-stone-800 rounded-xl p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">Users</p>
            <p className="text-3xl font-bold text-white">{data.stats.user_count}</p>
          </div>
          <div className="bg-stone-800 rounded-xl p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">Created</p>
            <p className="text-sm font-medium text-white mt-2">{formatDate(data.vendor.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users */}
          <div className="bg-stone-800 rounded-xl border border-stone-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-700">
              <h2 className="text-lg font-semibold text-white">Users</h2>
            </div>
            {data.users.length === 0 ? (
              <p className="text-stone-400 text-center py-8">No users</p>
            ) : (
              <div className="divide-y divide-stone-700">
                {data.users.map((user) => (
                  <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{user.username}</p>
                      <p className="text-xs text-stone-400">Created: {formatDate(user.created_at)}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-amber-900/50 text-amber-400'
                        : 'bg-stone-700 text-stone-300'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Login History */}
          <div className="bg-stone-800 rounded-xl border border-stone-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-700">
              <h2 className="text-lg font-semibold text-white">Login History</h2>
              <p className="text-xs text-stone-400">Last 50 logins</p>
            </div>
            {data.login_history.length === 0 ? (
              <p className="text-stone-400 text-center py-8">No login history</p>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-stone-700">
                {data.login_history.map((login, index) => (
                  <div key={index} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-white">{login.username}</span>
                        <span className="text-stone-400 text-sm ml-2">({login.role})</span>
                      </div>
                      <span className="text-xs text-stone-500">{formatDate(login.created_at)}</span>
                    </div>
                    {login.ip_address && (
                      <p className="text-xs text-stone-500 mt-1">IP: {login.ip_address}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
