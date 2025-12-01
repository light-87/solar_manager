'use client';

import { useState, useEffect } from 'react';
import { Customer, Step7Data } from '@/types';

interface Step7Props {
  customer: Customer;
  stepData: Step7Data | null;
  onSave: (data: Step7Data) => Promise<void>;
}

const DEFAULT_MATERIALS = [
  'Solar Panels',
  'Inverter',
  'Mounting Structure',
  'Wiring & Cables',
  'Junction Box',
  'MCB/MCCB',
  'Earthing Kit',
  'LA (Lightning Arrester)',
  'Net Meter',
  'Other Materials',
];

export default function Step7({ customer, stepData, onSave }: Step7Props) {
  const [formData, setFormData] = useState<Step7Data>({
    materials: stepData?.materials || DEFAULT_MATERIALS.reduce((acc, mat) => ({ ...acc, [mat]: false }), {}),
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

  const handleCheckboxChange = (material: string, checked: boolean) => {
    setFormData({
      ...formData,
      materials: {
        ...formData.materials,
        [material]: checked,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-3">
          Materials Checklist
        </label>
        <div className="space-y-2">
          {DEFAULT_MATERIALS.map((material) => (
            <label key={material} className="flex items-center gap-2 p-3 border border-stone-300 rounded-lg hover:bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.materials[material] || false}
                onChange={(e) => handleCheckboxChange(material, e.target.checked)}
                className="w-4 h-4 text-amber-600 focus:ring-amber-600 rounded"
              />
              <span className="text-sm text-stone-700">{material}</span>
            </label>
          ))}
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
