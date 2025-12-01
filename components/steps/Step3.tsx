'use client';

import { useState, useEffect } from 'react';
import { Customer, Step3Data } from '@/types';
import FileUpload from '@/components/FileUpload';

interface Step3Props {
  customer: Customer;
  stepData: Step3Data | null;
  onSave: (data: Step3Data) => Promise<void>;
}

export default function Step3({ customer, stepData, onSave }: Step3Props) {
  const [formData, setFormData] = useState<Step3Data>({
    online_submitted: stepData?.online_submitted || 'no',
    bank_name: stepData?.bank_name || '',
    branch_name: stepData?.branch_name || '',
    jan_samarth: stepData?.jan_samarth || '',
    acknowledgment: stepData?.acknowledgment || '',
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

  const isFinance = customer.type === 'finance';

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Online Submitted *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="online_submitted"
              value="yes"
              checked={formData.online_submitted === 'yes'}
              onChange={(e) => setFormData({ ...formData, online_submitted: e.target.value as 'yes' | 'no' })}
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="online_submitted"
              value="no"
              checked={formData.online_submitted === 'no'}
              onChange={(e) => setFormData({ ...formData, online_submitted: e.target.value as 'yes' | 'no' })}
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">No</span>
          </label>
        </div>
      </div>

      {isFinance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Bank Name (For finance only)
            </label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="Enter bank name"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Branch Name (For finance only)
            </label>
            <input
              type="text"
              value={formData.branch_name}
              onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
              placeholder="Enter branch name"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
            />
          </div>
        </div>
      )}

      <FileUpload
        label="JanSamarth"
        accept="image/*,.pdf"
        value={formData.jan_samarth}
        onChange={(url) => setFormData({ ...formData, jan_samarth: url as string })}
        customerId={customer.id}
        documentType="jan_samarth"
      />

      <FileUpload
        label="Acknowledgment"
        accept="image/*,.pdf"
        value={formData.acknowledgment}
        onChange={(url) => setFormData({ ...formData, acknowledgment: url as string })}
        customerId={customer.id}
        documentType="acknowledgment"
      />

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
