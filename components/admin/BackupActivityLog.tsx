'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

interface BackupLog {
  id: string;
  customer_name: string;
  performed_by_username: string;
  action_type: 'download' | 'cleanup';
  storage_freed_bytes: number;
  documents_deleted: number;
  created_at: string;
}

export default function BackupActivityLog() {
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/backup/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching backup logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500 text-center py-8">No backup activity yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>

      <div className="space-y-3">
        {logs.slice(0, 10).map((log) => (
          <div
            key={log.id}
            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div className="flex items-start flex-1">
              <div className={`p-2 rounded-lg mr-3 ${
                log.action_type === 'download'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-red-100 text-red-600'
              }`}>
                {log.action_type === 'download' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </div>

              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {log.action_type === 'download' ? 'Downloaded' : 'Cleaned up'}: {log.customer_name}
                </div>
                <div className="text-sm text-gray-600 mt-0.5">
                  By {log.performed_by_username}
                  {log.action_type === 'cleanup' && log.documents_deleted > 0 && (
                    <span className="ml-2">
                      • {log.documents_deleted} files • {(log.storage_freed_bytes / (1024 * 1024)).toFixed(2)} MB freed
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 ml-4 whitespace-nowrap">
              {formatTimeAgo(log.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
