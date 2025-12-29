'use client';

import { useState, useEffect } from 'react';
import { Customer, Step2Data } from '@/types';
import { apiFetch } from '@/lib/api-client';

interface Step2Props {
  customer: Customer;
  stepData: Step2Data | null;
  onSave: (data: Step2Data) => Promise<void>;
}

export default function Step2({ customer, stepData, onSave }: Step2Props) {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<Step2Data>({
    selected_site: stepData?.selected_site || undefined,
    status: stepData?.status || 'not_filled',
    completion_date: stepData?.completion_date || getTodayDate(),
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Sites state
  const [sites, setSites] = useState<string[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [addingSite, setAddingSite] = useState(false);
  const [addSiteError, setAddSiteError] = useState('');

  // Fetch sites on mount
  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await apiFetch('/api/workspace/settings');
      if (response.ok) {
        const data = await response.json();
        setSites(data.sites || []);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoadingSites(false);
    }
  };

  const handleAddSite = async () => {
    if (!newSiteName.trim()) {
      setAddSiteError('Please enter a site name');
      return;
    }

    setAddingSite(true);
    setAddSiteError('');

    try {
      const response = await apiFetch('/api/workspace/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'site', value: newSiteName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAddSiteError(data.error || 'Failed to add site');
        return;
      }

      // Update sites list
      setSites(data.sites || []);

      // Auto-select the newly added site
      const addedSite = newSiteName.trim();
      setFormData({ ...formData, selected_site: addedSite });

      // Reset form
      setNewSiteName('');
      setShowAddSite(false);
    } catch (error) {
      setAddSiteError('Failed to add site. Please try again.');
    } finally {
      setAddingSite(false);
    }
  };

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData]);

  const handleAutoSave = async () => {
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleManualSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await onSave(formData);
      setMessage('Saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Select Portal Site *
        </label>

        {loadingSites ? (
          <div className="text-sm text-stone-500">Loading sites...</div>
        ) : (
          <div className="space-y-2">
            {sites.map((site) => (
              <label
                key={site}
                className="flex items-center gap-3 p-3 border border-stone-300 rounded-lg hover:bg-stone-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="selected_site"
                  value={site}
                  checked={formData.selected_site === site}
                  onChange={(e) =>
                    setFormData({ ...formData, selected_site: e.target.value })
                  }
                  className="w-4 h-4 text-amber-600 focus:ring-amber-600"
                />
                <span className="text-sm text-stone-700">{site}</span>
              </label>
            ))}

            {/* Add Custom Site Option */}
            {!showAddSite ? (
              <button
                type="button"
                onClick={() => setShowAddSite(true)}
                className="flex items-center gap-2 p-3 w-full border border-dashed border-stone-300 rounded-lg hover:bg-stone-50 hover:border-amber-400 text-stone-600 hover:text-amber-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span className="text-sm">Add Custom Portal Site</span>
              </button>
            ) : (
              <div className="p-4 border border-amber-300 bg-amber-50 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    New Portal Site Name
                  </label>
                  <input
                    type="text"
                    value={newSiteName}
                    onChange={(e) => {
                      setNewSiteName(e.target.value);
                      setAddSiteError('');
                    }}
                    placeholder="e.g., Gujarat State Portal, Tata Power Portal"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                    autoFocus
                  />
                  {addSiteError && (
                    <p className="text-sm text-red-600 mt-1">{addSiteError}</p>
                  )}
                  <p className="text-xs text-stone-500 mt-1">
                    This site will be available for all customers in your workspace.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddSite}
                    disabled={addingSite}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white text-sm rounded-lg transition-colors"
                  >
                    {addingSite ? 'Adding...' : 'Add Site'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSite(false);
                      setNewSiteName('');
                      setAddSiteError('');
                    }}
                    className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Completion Date
        </label>
        <input
          type="date"
          value={formData.completion_date}
          onChange={(e) =>
            setFormData({ ...formData, completion_date: e.target.value })
          }
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none mb-4"
        />

        <label className="block text-sm font-medium text-stone-700 mb-2">
          Status *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value="filled"
              checked={formData.status === 'filled'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'filled' | 'not_filled',
                })
              }
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">Filled</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value="not_filled"
              checked={formData.status === 'not_filled'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'filled' | 'not_filled',
                })
              }
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">Not Filled</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        {message && (
          <p
            className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}
          >
            {message}
          </p>
        )}
        <div className="ml-auto">
          <button
            onClick={handleManualSave}
            disabled={saving}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
