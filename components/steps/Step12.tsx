'use client';

import { useState, useEffect } from 'react';
import { Customer, Step12Data } from '@/types';

interface Step12Props {
  customer: Customer;
  stepData: Step12Data | null;
  onSave: (data: Step12Data) => Promise<void>;
}

export default function Step12({ customer, stepData, onSave }: Step12Props) {
  const [formData, setFormData] = useState<Step12Data>({
    meter_release_date: stepData?.meter_release_date || '',
    upload_status: stepData?.upload_status || 'not',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Meter Release Date
        </label>
        <input
          type="date"
          value={formData.meter_release_date}
          onChange={(e) => setFormData({ ...formData, meter_release_date: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Upload Status *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="upload_status"
              value="done"
              checked={formData.upload_status === 'done'}
              onChange={(e) => setFormData({ ...formData, upload_status: e.target.value as 'done' | 'not' })}
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">Done</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="upload_status"
              value="not"
              checked={formData.upload_status === 'not'}
              onChange={(e) => setFormData({ ...formData, upload_status: e.target.value as 'done' | 'not' })}
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">Not Done</span>
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
