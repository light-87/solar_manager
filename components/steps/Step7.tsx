'use client';

import { useState, useEffect } from 'react';
import { Customer, Step7Data } from '@/types';
import { apiFetch } from '@/lib/api-client';

interface Step7Props {
  customer: Customer;
  stepData: Step7Data | null;
  onSave: (data: Step7Data) => Promise<void>;
}

export default function Step7({ customer, stepData, onSave }: Step7Props) {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<Step7Data>({
    materials: stepData?.materials || {},
    completion_date: stepData?.completion_date || getTodayDate(),
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Materials state
  const [materials, setMaterials] = useState<string[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [addMaterialError, setAddMaterialError] = useState('');

  // Fetch materials on mount
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await apiFetch('/api/workspace/settings');
      if (response.ok) {
        const data = await response.json();
        const fetchedMaterials = data.materials || [];
        setMaterials(fetchedMaterials);

        // Initialize materials that don't exist in formData yet
        const updatedMaterials = { ...formData.materials };
        fetchedMaterials.forEach((material: string) => {
          if (!(material in updatedMaterials)) {
            updatedMaterials[material] = false;
          }
        });
        setFormData((prev) => ({ ...prev, materials: updatedMaterials }));
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterialName.trim()) {
      setAddMaterialError('Please enter a material name');
      return;
    }

    setAddingMaterial(true);
    setAddMaterialError('');

    try {
      const response = await apiFetch('/api/workspace/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'material', value: newMaterialName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAddMaterialError(data.error || 'Failed to add material');
        return;
      }

      // Update materials list
      setMaterials(data.materials || []);

      // Auto-check the newly added material
      const addedMaterial = newMaterialName.trim();
      setFormData((prev) => ({
        ...prev,
        materials: {
          ...prev.materials,
          [addedMaterial]: true, // Auto-tick the new material
        },
      }));

      // Reset form
      setNewMaterialName('');
      setShowAddMaterial(false);
    } catch (error) {
      setAddMaterialError('Failed to add material. Please try again.');
    } finally {
      setAddingMaterial(false);
    }
  };

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
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Completion Date
        </label>
        <input
          type="date"
          value={formData.completion_date}
          onChange={(e) =>
            setFormData({ ...formData, completion_date: e.target.value })
          }
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none mb-4"
        />

        <label className="block text-sm font-medium text-stone-700 mb-3">
          Materials Checklist
        </label>

        {loadingMaterials ? (
          <div className="text-sm text-stone-500">Loading materials...</div>
        ) : (
          <div className="space-y-2">
            {materials.map((material) => (
              <label
                key={material}
                className="flex items-center gap-2 p-3 border border-stone-300 rounded-lg hover:bg-stone-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.materials[material] || false}
                  onChange={(e) => handleCheckboxChange(material, e.target.checked)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-600 rounded"
                />
                <span className="text-sm text-stone-700">{material}</span>
              </label>
            ))}

            {/* Add Custom Material Option */}
            {!showAddMaterial ? (
              <button
                type="button"
                onClick={() => setShowAddMaterial(true)}
                className="flex items-center gap-2 p-3 w-full border border-dashed border-stone-300 rounded-lg hover:bg-stone-50 hover:border-amber-400 text-stone-600 hover:text-amber-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span className="text-sm">Add Custom Material</span>
              </button>
            ) : (
              <div className="p-4 border border-amber-300 bg-amber-50 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    New Material Name
                  </label>
                  <input
                    type="text"
                    value={newMaterialName}
                    onChange={(e) => {
                      setNewMaterialName(e.target.value);
                      setAddMaterialError('');
                    }}
                    placeholder="e.g., Battery Storage, AC Distribution Box"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
                    autoFocus
                  />
                  {addMaterialError && (
                    <p className="text-sm text-red-600 mt-1">{addMaterialError}</p>
                  )}
                  <p className="text-xs text-stone-500 mt-1">
                    This material will be available for all customers and auto-checked
                    for this customer.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    disabled={addingMaterial}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white text-sm rounded-lg transition-colors"
                  >
                    {addingMaterial ? 'Adding...' : 'Add Material'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMaterial(false);
                      setNewMaterialName('');
                      setAddMaterialError('');
                    }}
                    className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        {message && (
          <p
            className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}
          >
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
