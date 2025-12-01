'use client';

import { useState, useEffect } from 'react';
import { Customer, Step4Data } from '@/types';

interface Step4Props {
  customer: Customer;
  stepData: Step4Data | null;
  onSave: (data: Step4Data) => Promise<void>;
}

export default function Step4({ customer, stepData, onSave }: Step4Props) {
  const [formData, setFormData] = useState<Step4Data>({
    submitted_to_bank: stepData?.submitted_to_bank || 'no',
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
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Submitted to Bank *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="submitted_to_bank"
              value="yes"
              checked={formData.submitted_to_bank === 'yes'}
              onChange={(e) => setFormData({ ...formData, submitted_to_bank: e.target.value as 'yes' | 'no' })}
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="submitted_to_bank"
              value="no"
              checked={formData.submitted_to_bank === 'no'}
              onChange={(e) => setFormData({ ...formData, submitted_to_bank: e.target.value as 'yes' | 'no' })}
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">No</span>
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
