'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

interface StorageStats {
  total_storage_bytes: number;
  total_storage_mb: number;
  total_files: number;
  customers_with_documents: number;
}

export default function BackupStorageStats() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/backup/storage');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-orange-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
        Blob Storage Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-orange-100">
          <div className="text-sm text-gray-600 mb-1">Total Storage Used</div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.total_storage_mb.toFixed(2)} MB
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.total_storage_bytes.toLocaleString()} bytes
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-orange-100">
          <div className="text-sm text-gray-600 mb-1">Total Files</div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.total_files}
          </div>
          <div className="text-xs text-gray-500 mt-1">documents stored</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-orange-100">
          <div className="text-sm text-gray-600 mb-1">Customers with Documents</div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.customers_with_documents}
          </div>
          <div className="text-xs text-gray-500 mt-1">active customers</div>
        </div>
      </div>
    </div>
  );
}
