'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Customer, DashboardStats, CustomerType } from '@/types';
import { formatDate, getStepName } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export default function FinanceDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerType, setNewCustomerType] = useState<CustomerType>('finance');
  const router = useRouter();
  const { userRole } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery, statusFilter, stepFilter, typeFilter]);

  const fetchData = async () => {
    try {
      // Fetch all customers (both finance and cash)
      const customersRes = await fetch('/api/customers');
      const customersData = await customersRes.json();
      const allCustomers = customersData.customers || [];
      setCustomers(allCustomers);

      // Calculate stats from all customers
      const statsData = {
        total_active: allCustomers.filter((c: Customer) => c.status === 'active').length,
        total_completed: allCustomers.filter((c: Customer) => c.status === 'completed').length,
        total_archived: allCustomers.filter((c: Customer) => c.status === 'archived').length,
      };
      setStats(statsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((c) => c.type === typeFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Step filter
    if (stepFilter !== 'all') {
      filtered = filtered.filter((c) => c.current_step === parseInt(stepFilter));
    }

    setFilteredCustomers(filtered);
  };

  const handleCustomerClick = (customerId: string) => {
    router.push(`/dashboard/customer/${customerId}`);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-stone-900">
                All Customers
              </h2>
              <p className="text-stone-600 mt-1">
                Manage your solar installations
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNewCustomerType('finance');
                  setShowNewCustomerModal(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
              >
                + Finance Customer
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => {
                    setNewCustomerType('cash');
                    setShowNewCustomerModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  + Cash Customer
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-stone-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Active</p>
                  <p className="text-3xl font-semibold text-stone-900 mt-2">
                    {stats?.total_active || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-stone-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Completed</p>
                  <p className="text-3xl font-semibold text-stone-900 mt-2">
                    {stats?.total_completed || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-stone-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Archived</p>
                  <p className="text-3xl font-semibold text-stone-900 mt-2">
                    {stats?.total_archived || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-stone-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Total</p>
                  <p className="text-3xl font-semibold text-stone-900 mt-2">
                    {(stats?.total_active || 0) + (stats?.total_completed || 0) + (stats?.total_archived || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-stone-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Customer Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="finance">Finance</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Search by name
                </label>
                <input
                  type="text"
                  placeholder="Enter customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Filter by status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Filter by step
                </label>
                <select
                  value={stepFilter}
                  onChange={(e) => setStepFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                >
                  <option value="all">All Steps</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((step) => (
                    <option key={step} value={step}>
                      Step {step}: {getStepName(step, 'finance')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Customer Table */}
          <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Current Step
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Date Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                        No customers found. Click "New Customer" to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => handleCustomerClick(customer.id)}
                        className="hover:bg-stone-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-stone-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-stone-500">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              customer.type === 'finance'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {customer.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-stone-900">
                            {customer.current_step}/16
                          </div>
                          <div className="text-xs text-stone-500">
                            {getStepName(customer.current_step, customer.type)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                          {formatDate(customer.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                          {formatDate(customer.updated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              customer.status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : customer.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            {customer.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* New Customer Modal */}
        {showNewCustomerModal && (
          <NewCustomerModal
            type={newCustomerType}
            onClose={() => setShowNewCustomerModal(false)}
            onSuccess={() => {
              setShowNewCustomerModal(false);
              fetchData();
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// New Customer Modal Component
function NewCustomerModal({
  type,
  onClose,
  onSuccess,
}: {
  type: 'finance' | 'cash';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    kw_capacity: '',
    quotation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, type }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to create customer');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900">
            New {type === 'finance' ? 'Finance' : 'Cash'} Customer
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                KW Capacity *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.kw_capacity}
                onChange={(e) => setFormData({ ...formData, kw_capacity: e.target.value })}
                placeholder="e.g., 5.5"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Quotation (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.quotation}
                onChange={(e) => setFormData({ ...formData, quotation: e.target.value })}
                placeholder="e.g., 250000"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
