'use client';

import { useState, useEffect } from 'react';
import { Customer, Step15Data } from '@/types';

interface Step15Props {
  customer: Customer;
  stepData: Step15Data | null;
  onSave: (data: Step15Data) => Promise<void>;
}

export default function Step15({ customer, stepData, onSave }: Step15Props) {
  const [formData, setFormData] = useState<Step15Data>({
    inspector_name: stepData?.inspector_name || '',
    inspection_date: stepData?.inspection_date || '',
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
          Inspector Name
        </label>
        <input
          type="text"
          value={formData.inspector_name}
          onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
          placeholder="Enter inspector name"
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Inspection Date
        </label>
        <input
          type="date"
          value={formData.inspection_date}
          onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
        />
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
