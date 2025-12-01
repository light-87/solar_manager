'use client';

import { useState, useEffect } from 'react';
import { Customer, Step10Data } from '@/types';
import FileUpload from '@/components/FileUpload';

interface Step10Props {
  customer: Customer;
  stepData: Step10Data | null;
  onSave: (data: Step10Data) => Promise<void>;
}

export default function Step10({ customer, stepData, onSave }: Step10Props) {
  const [formData, setFormData] = useState<Step10Data>({
    completion_file: stepData?.completion_file || '',
    net_agreement: stepData?.net_agreement || '',
    model_agreement: stepData?.model_agreement || '',
    dcr_ndcr_certificate: stepData?.dcr_ndcr_certificate || '',
    print_sign_upload_done: stepData?.print_sign_upload_done || 'no',
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
      <FileUpload
        label="Completion File"
        accept="image/*,.pdf"
        value={formData.completion_file}
        onChange={(url) => setFormData({ ...formData, completion_file: url as string })}
        customerId={customer.id}
        documentType="completion_file"
      />

      <FileUpload
        label="Net Agreement"
        accept="image/*,.pdf"
        value={formData.net_agreement}
        onChange={(url) => setFormData({ ...formData, net_agreement: url as string })}
        customerId={customer.id}
        documentType="net_agreement"
      />

      <FileUpload
        label="Model Agreement"
        accept="image/*,.pdf"
        value={formData.model_agreement}
        onChange={(url) => setFormData({ ...formData, model_agreement: url as string })}
        customerId={customer.id}
        documentType="model_agreement"
      />

      <FileUpload
        label="DCR/NDCR Certificate"
        accept="image/*,.pdf"
        value={formData.dcr_ndcr_certificate}
        onChange={(url) => setFormData({ ...formData, dcr_ndcr_certificate: url as string })}
        customerId={customer.id}
        documentType="dcr_ndcr_certificate"
      />

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Print → Sign → Upload (Done/No) *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="print_sign_upload_done"
              value="done"
              checked={formData.print_sign_upload_done === 'done'}
              onChange={(e) => setFormData({ ...formData, print_sign_upload_done: e.target.value as 'done' | 'no' })}
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">Done</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="print_sign_upload_done"
              value="no"
              checked={formData.print_sign_upload_done === 'no'}
              onChange={(e) => setFormData({ ...formData, print_sign_upload_done: e.target.value as 'done' | 'no' })}
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
