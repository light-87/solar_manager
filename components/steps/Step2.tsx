'use client';

import { useState, useEffect } from 'react';
import { Customer, Step2Data } from '@/types';

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
          Select Site *
        </label>
        <div className="space-y-2">
          {(['site_a', 'site_b', 'site_c'] as const).map((site) => (
            <label key={site} className="flex items-center gap-2 p-3 border border-stone-300 rounded-lg hover:bg-stone-50 cursor-pointer">
              <input
                type="radio"
                name="selected_site"
                value={site}
                checked={formData.selected_site === site}
                onChange={(e) => setFormData({ ...formData, selected_site: e.target.value as 'site_a' | 'site_b' | 'site_c' })}
                className="w-4 h-4 text-amber-600 focus:ring-amber-600"
              />
              <span className="text-sm text-stone-700 capitalize">
                {site.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Completion Date
        </label>
        <input
          type="date"
          value={formData.completion_date}
          onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'filled' | 'not_filled' })}
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
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'filled' | 'not_filled' })}
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">Not Filled</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        {message && (
          <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
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
