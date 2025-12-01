'use client';

import { useState, useEffect } from 'react';
import { Customer, Step6Data } from '@/types';
import { useAuth } from '@/lib/auth-context';

interface Step6Props {
  customer: Customer;
  stepData: Step6Data | null;
  onSave: (data: Step6Data) => Promise<void>;
}

export default function Step6({ customer, stepData, onSave }: Step6Props) {
  const { role } = useAuth();
  const [formData, setFormData] = useState<Step6Data>({
    amount: stepData?.amount || 0,
    remaining_amount: stepData?.remaining_amount || 0,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Calculate remaining amount
  useEffect(() => {
    const quotation = customer.quotation || 0;
    const remaining = quotation - formData.amount;
    setFormData(prev => ({ ...prev, remaining_amount: remaining }));
  }, [formData.amount, customer.quotation]);

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

  // For Cash customers, only Admin can see amounts
  const isCash = customer.type === 'cash';
  const isEmployee = role === 'employee';
  const hideForEmployee = isCash && isEmployee;

  if (hideForEmployee) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <p className="text-amber-900">
          Payment information is only visible to administrators for cash customers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Total Quotation:</strong> ₹{customer.quotation?.toLocaleString('en-IN') || 0}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          1st Disbursement Amount (₹) *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max={customer.quotation || undefined}
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          placeholder="Enter amount"
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          <strong>Remaining Amount:</strong> ₹{formData.remaining_amount?.toLocaleString('en-IN') || 0}
        </p>
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
