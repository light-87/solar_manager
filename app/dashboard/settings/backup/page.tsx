'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import BackupStorageStats from '@/components/admin/BackupStorageStats';
import BackupCustomerCard from '@/components/admin/BackupCustomerCard';
import BackupActivityLog from '@/components/admin/BackupActivityLog';
import type { Customer } from '@/types';
import { apiFetch } from '@/lib/api-client';

interface BackupCustomer extends Customer {
  document_count: number;
  storage_bytes: number;
  storage_mb: number;
  completed_at: string;
}

interface BackupCustomersResponse {
  customers: BackupCustomer[];
  total_storage_bytes: number;
  total_storage_mb: number;
  total_customers: number;
}

export default function BackupPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<BackupCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    total_storage_mb: 0,
    total_customers: 0,
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/backup/customers');
      if (response.ok) {
        const data: BackupCustomersResponse = await response.json();
        setCustomers(data.customers || []);
        setTotalStats({
          total_storage_mb: data.total_storage_mb,
          total_customers: data.total_customers,
        });
      }
    } catch (error) {
      console.error('Error fetching backup customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRefresh = () => {
    fetchCustomers();
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Backup & Archive</h1>
            <p className="text-gray-600">
              Download customer backups and free up storage space
            </p>
          </div>

          {/* Storage Stats */}
          <BackupStorageStats />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customers List - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Completed Customers Ready for Backup
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {totalStats.total_customers} customer{totalStats.total_customers !== 1 ? 's' : ''} • {totalStats.total_storage_mb.toFixed(2)} MB total
                    </p>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="text-orange-600 hover:text-orange-700 p-2 rounded-md hover:bg-orange-50 transition-colors"
                    title="Refresh"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : customers.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No customers ready for backup</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Completed customers will appear here for backup and archival.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customers.map((customer) => (
                      <BackupCustomerCard
                        key={customer.id}
                        customer={customer}
                        onBackupComplete={handleRefresh}
                        onCleanupComplete={handleRefresh}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Activity Log - Takes 1 column on large screens */}
            <div className="lg:col-span-1">
              <BackupActivityLog />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
