'use client';

import { useState, useEffect } from 'react';
import { Customer, Step8Data } from '@/types';

interface Step8Props {
  customer: Customer;
  stepData: Step8Data | null;
  onSave: (data: Step8Data) => Promise<void>;
}

export default function Step8({ customer, stepData, onSave }: Step8Props) {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<Step8Data>({
    structure: stepData?.structure || { status: 'no', team_name: '' },
    wiring: stepData?.wiring || { status: 'no', team_name: '' },
    completion_date: stepData?.completion_date || getTodayDate(),
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
          Completion Date
        </label>
        <input
          type="date"
          value={formData.completion_date}
          onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
        />
      </div>

      {/* Structure Installation */}
      <div className="border border-stone-300 rounded-lg p-4">
        <h4 className="font-semibold text-stone-900 mb-3">Structure Installation</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Status *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="structure_status"
                  value="done"
                  checked={formData.structure.status === 'done'}
                  onChange={(e) => setFormData({
                    ...formData,
                    structure: { ...formData.structure, status: e.target.value as 'done' | 'no' }
                  })}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-600"
                />
                <span className="text-sm text-stone-700">Done</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="structure_status"
                  value="no"
                  checked={formData.structure.status === 'no'}
                  onChange={(e) => setFormData({
                    ...formData,
                    structure: { ...formData.structure, status: e.target.value as 'done' | 'no' }
                  })}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-600"
                />
                <span className="text-sm text-stone-700">No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={formData.structure.team_name}
              onChange={(e) => setFormData({
                ...formData,
                structure: { ...formData.structure, team_name: e.target.value }
              })}
              placeholder="Enter team name"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Wiring Installation */}
      <div className="border border-stone-300 rounded-lg p-4">
        <h4 className="font-semibold text-stone-900 mb-3">Wiring Installation</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Status *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="wiring_status"
                  value="done"
                  checked={formData.wiring.status === 'done'}
                  onChange={(e) => setFormData({
                    ...formData,
                    wiring: { ...formData.wiring, status: e.target.value as 'done' | 'no' }
                  })}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-600"
                />
                <span className="text-sm text-stone-700">Done</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="wiring_status"
                  value="no"
                  checked={formData.wiring.status === 'no'}
                  onChange={(e) => setFormData({
                    ...formData,
                    wiring: { ...formData.wiring, status: e.target.value as 'done' | 'no' }
                  })}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-600"
                />
                <span className="text-sm text-stone-700">No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={formData.wiring.team_name}
              onChange={(e) => setFormData({
                ...formData,
                wiring: { ...formData.wiring, team_name: e.target.value }
              })}
              placeholder="Enter team name"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
            />
          </div>
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
