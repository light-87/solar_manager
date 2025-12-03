'use client';

import { useState } from 'react';
import type { Customer } from '@/types';

interface BackupCustomer extends Customer {
  document_count: number;
  storage_bytes: number;
  storage_mb: number;
  completed_at: string;
}

interface BackupCustomerCardProps {
  customer: BackupCustomer;
  onBackupComplete: () => void;
  onCleanupComplete: () => void;
}

export default function BackupCustomerCard({
  customer,
  onBackupComplete,
  onCleanupComplete,
}: BackupCustomerCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Get user info from localStorage
      const authData = localStorage.getItem('auth');
      if (!authData) {
        alert('Authentication required');
        return;
      }

      const { userId, username } = JSON.parse(authData);

      const response = await fetch('/api/admin/backup/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          userId,
          username,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download backup');
      }

      // Download the ZIP file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${customer.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Notify parent to refresh
      onBackupComplete();

      alert(`Backup downloaded successfully! Customer marked as archived.`);
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert(error instanceof Error ? error.message : 'Failed to download backup');
    } finally {
      setDownloading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setCleaning(true);

      // Get user info from localStorage
      const authData = localStorage.getItem('auth');
      if (!authData) {
        alert('Authentication required');
        return;
      }

      const { userId, username } = JSON.parse(authData);

      const response = await fetch(`/api/admin/backup/cleanup/${customer.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          username,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cleanup storage');
      }

      const result = await response.json();

      // Notify parent to refresh
      onCleanupComplete();

      alert(
        `Storage cleanup successful!\n\n` +
        `Documents deleted: ${result.documents_deleted}\n` +
        `Storage freed: ${result.storage_freed_mb} MB`
      );

      setShowCleanupConfirm(false);
    } catch (error) {
      console.error('Error cleaning up storage:', error);
      alert(error instanceof Error ? error.message : 'Failed to cleanup storage');
    } finally {
      setCleaning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{customer.name}</h3>
          <div className="text-sm text-gray-600 mt-1 space-y-1">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {customer.phone}
            </div>
            {customer.email && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {customer.email}
              </div>
            )}
          </div>
        </div>
        <div className="ml-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            customer.type === 'finance' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {customer.type === 'finance' ? 'Finance' : 'Cash'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-gray-600 text-xs">Completed</div>
          <div className="font-medium text-gray-900">{formatDate(customer.completed_at)}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-gray-600 text-xs">Documents</div>
          <div className="font-medium text-gray-900">{customer.document_count} files</div>
        </div>
        <div className="bg-orange-50 rounded p-2 col-span-2">
          <div className="text-orange-700 text-xs">Storage Size</div>
          <div className="font-semibold text-orange-900">{customer.storage_mb.toFixed(2)} MB</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center"
        >
          {downloading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Backup
            </>
          )}
        </button>

        {customer.status === 'archived' && (
          <button
            onClick={() => setShowCleanupConfirm(true)}
            disabled={cleaning}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center"
          >
            {cleaning ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cleaning...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Cleanup Storage
              </>
            )}
          </button>
        )}
      </div>

      {/* Cleanup Confirmation Dialog */}
      {showCleanupConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Storage Cleanup</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete all documents for <strong>{customer.name}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>This will permanently delete:</strong>
              </p>
              <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                <li>{customer.document_count} documents</li>
                <li>{customer.storage_mb.toFixed(2)} MB of storage</li>
              </ul>
              <p className="text-sm text-red-800 mt-2">
                Make sure you have downloaded the backup before proceeding!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCleanupConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCleanup}
                disabled={cleaning}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {cleaning ? 'Deleting...' : 'Yes, Delete Files'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
