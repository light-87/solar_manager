'use client';

import { useState, useEffect } from 'react';
import { Customer, Step1Data } from '@/types';
import FileUpload from '@/components/FileUpload';

interface Step1Props {
  customer: Customer;
  stepData: Step1Data | null;
  onSave: (data: Step1Data) => Promise<void>;
  onUpdateCustomer: (updates: Partial<Customer>) => Promise<void>;
}

export default function Step1({ customer, stepData, onSave, onUpdateCustomer }: Step1Props) {
  const [formData, setFormData] = useState<Step1Data>({
    address: customer.address || '',
    site_location: customer.site_location || '',
    kw_capacity: customer.kw_capacity || 0,
    quotation: customer.quotation || 0,
    commercial_domestic: stepData?.commercial_domestic || undefined,
    aadhaar_card: stepData?.aadhaar_card || '',
    pan_card: stepData?.pan_card || '',
    electric_bill: stepData?.electric_bill || '',
    bank_passbook: stepData?.bank_passbook || [],
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
      // Also update customer fields if changed
      await onUpdateCustomer({
        address: formData.address,
        site_location: formData.site_location,
        kw_capacity: formData.kw_capacity,
        quotation: formData.quotation,
      });
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleManualSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await onSave(formData);
      await onUpdateCustomer({
        address: formData.address,
        site_location: formData.site_location,
        kw_capacity: formData.kw_capacity,
        quotation: formData.quotation,
      });
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
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-900">
          <strong>Note:</strong> Name, Email, and Phone are locked after customer creation. All other fields are editable.
        </p>
      </div>

      {/* Pre-filled Customer Information */}
      <div className="space-y-4">
        <h4 className="font-semibold text-stone-900">Customer Information</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customer.name}
              disabled
              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-100 text-stone-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={customer.phone}
              disabled
              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-100 text-stone-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={customer.email || 'N/A'}
            disabled
            className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-100 text-stone-500 cursor-not-allowed truncate"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Site Location (Optional)
          </label>
          <input
            type="text"
            value={formData.site_location}
            onChange={(e) => setFormData({ ...formData, site_location: e.target.value })}
            placeholder="Search on Google Maps and paste the link from address bar"
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
          />
          <p className="text-xs text-stone-500 mt-1">
            Hint: Open <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Google Maps</a>, search for the location, and copy the URL from your browser's address bar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              KW Capacity
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.kw_capacity || ''}
              onChange={(e) => setFormData({ ...formData, kw_capacity: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Quotation (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.quotation || ''}
              onChange={(e) => setFormData({ ...formData, quotation: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Commercial/Domestic *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="commercial_domestic"
                value="commercial"
                checked={formData.commercial_domestic === 'commercial'}
                onChange={(e) => setFormData({ ...formData, commercial_domestic: e.target.value as 'commercial' | 'domestic' })}
                className="w-4 h-4 text-amber-600 focus:ring-amber-600"
              />
              <span className="text-sm text-stone-700">Commercial</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="commercial_domestic"
                value="domestic"
                checked={formData.commercial_domestic === 'domestic'}
                onChange={(e) => setFormData({ ...formData, commercial_domestic: e.target.value as 'commercial' | 'domestic' })}
                className="w-4 h-4 text-amber-600 focus:ring-amber-600"
              />
              <span className="text-sm text-stone-700">Domestic</span>
            </label>
          </div>
        </div>
      </div>

      {/* Document Uploads */}
      <div className="space-y-4">
        <h4 className="font-semibold text-stone-900">Document Uploads</h4>

        <FileUpload
          label="Aadhaar Card"
          accept="image/*,.pdf"
          value={formData.aadhaar_card}
          onChange={(url) => setFormData({ ...formData, aadhaar_card: url as string })}
          customerId={customer.id}
          documentType="aadhaar_card"
        />

        <FileUpload
          label="PAN Card"
          accept="image/*,.pdf"
          value={formData.pan_card}
          onChange={(url) => setFormData({ ...formData, pan_card: url as string })}
          customerId={customer.id}
          documentType="pan_card"
        />

        <FileUpload
          label="Electric Bill"
          accept="image/*,.pdf"
          value={formData.electric_bill}
          onChange={(url) => setFormData({ ...formData, electric_bill: url as string })}
          customerId={customer.id}
          documentType="electric_bill"
        />

        <FileUpload
          label="Bank Passbook (Multiple files allowed)"
          accept="image/*,.pdf"
          multiple
          value={formData.bank_passbook}
          onChange={(url) => setFormData({ ...formData, bank_passbook: url as string[] })}
          customerId={customer.id}
          documentType="bank_passbook"
        />
      </div>

      {/* Save Button */}
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
