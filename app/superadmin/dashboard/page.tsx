'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Vendor {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  customer_count: number;
  last_login: string | null;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    company_code: '',
    admin_username: '',
    admin_pin: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getToken = () => sessionStorage.getItem('superadmin_token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/superadmin');
      return;
    }
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/superadmin/vendors', {
        headers: { 'x-superadmin-token': getToken() || '' },
      });

      if (response.status === 401) {
        sessionStorage.removeItem('superadmin_token');
        router.push('/superadmin');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.error);
        return;
      }

      setVendors(data.vendors);
    } catch (err) {
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (code: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/superadmin/vendors/${code}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-superadmin-token': getToken() || '',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        setVendors(vendors.map(v =>
          v.code === code ? { ...v, is_active: !currentStatus } : v
        ));
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/superadmin/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-superadmin-token': getToken() || '',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error);
        return;
      }

      // Reset form and refresh list
      setFormData({ company_name: '', company_code: '', admin_username: '', admin_pin: '' });
      setShowAddForm(false);
      fetchVendors();
    } catch (err) {
      setFormError('Failed to add vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('superadmin_token');
    router.push('/superadmin');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
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

  return (
    <div className="min-h-screen bg-stone-900">
      {/* Header */}
      <header className="bg-stone-800 border-b border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Super Admin</h1>
                <p className="text-xs text-stone-400">Vendor Management</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-stone-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-stone-800 rounded-xl p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">Total Vendors</p>
            <p className="text-3xl font-bold text-white">{vendors.length}</p>
          </div>
          <div className="bg-stone-800 rounded-xl p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">Active Vendors</p>
            <p className="text-3xl font-bold text-green-400">
              {vendors.filter(v => v.is_active).length}
            </p>
          </div>
          <div className="bg-stone-800 rounded-xl p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">Total Customers</p>
            <p className="text-3xl font-bold text-white">
              {vendors.reduce((sum, v) => sum + v.customer_count, 0)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Vendors</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Vendor
          </button>
        </div>

        {/* Add Vendor Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 rounded-xl p-6 w-full max-w-md border border-stone-700">
              <h3 className="text-lg font-semibold text-white mb-4">Add New Vendor</h3>
              <form onSubmit={handleAddVendor} className="space-y-4">
                <div>
                  <label className="block text-sm text-stone-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="e.g., Solar Solutions Pvt Ltd"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-300 mb-1">Company Code</label>
                  <input
                    type="text"
                    value={formData.company_code}
                    onChange={(e) => setFormData({ ...formData, company_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="e.g., SOLAR2025"
                    required
                  />
                  <p className="text-xs text-stone-500 mt-1">Used for login. Letters, numbers, hyphen only.</p>
                </div>
                <div>
                  <label className="block text-sm text-stone-300 mb-1">Admin Username</label>
                  <input
                    type="text"
                    value={formData.admin_username}
                    onChange={(e) => setFormData({ ...formData, admin_username: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="e.g., admin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-300 mb-1">Admin PIN</label>
                  <input
                    type="text"
                    value={formData.admin_pin}
                    onChange={(e) => setFormData({ ...formData, admin_pin: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="e.g., 1234"
                    required
                  />
                </div>

                {formError && (
                  <p className="text-red-400 text-sm">{formError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormError('');
                      setFormData({ company_name: '', company_code: '', admin_username: '', admin_pin: '' });
                    }}
                    className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-stone-600 text-white rounded-lg transition-colors"
                  >
                    {submitting ? 'Adding...' : 'Add Vendor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Vendors Table */}
        {error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : vendors.length === 0 ? (
          <div className="text-stone-400 text-center py-8">No vendors yet. Add your first vendor!</div>
        ) : (
          <div className="bg-stone-800 rounded-xl border border-stone-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-700">
                  <th className="text-left text-xs font-medium text-stone-400 uppercase px-6 py-4">Vendor</th>
                  <th className="text-left text-xs font-medium text-stone-400 uppercase px-6 py-4">Code</th>
                  <th className="text-center text-xs font-medium text-stone-400 uppercase px-6 py-4">Customers</th>
                  <th className="text-left text-xs font-medium text-stone-400 uppercase px-6 py-4">Last Login</th>
                  <th className="text-center text-xs font-medium text-stone-400 uppercase px-6 py-4">Status</th>
                  <th className="text-right text-xs font-medium text-stone-400 uppercase px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-stone-700/50 hover:bg-stone-700/30">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{vendor.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-stone-300 bg-stone-700 px-2 py-1 rounded">{vendor.code}</code>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white font-medium">{vendor.customer_count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-400">{formatDate(vendor.last_login)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vendor.is_active
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        {vendor.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/superadmin/vendor/${vendor.code}`}
                          className="px-3 py-1.5 text-sm text-stone-300 hover:text-white hover:bg-stone-700 rounded transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(vendor.code, vendor.is_active)}
                          className={`px-3 py-1.5 text-sm rounded transition-colors ${
                            vendor.is_active
                              ? 'text-red-400 hover:bg-red-900/30'
                              : 'text-green-400 hover:bg-green-900/30'
                          }`}
                        >
                          {vendor.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
