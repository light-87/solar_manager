'use client';

import { useState, useEffect } from 'react';
import { Customer, Step9Data, EquipmentItem } from '@/types';
import FileUpload from '@/components/FileUpload';
import BarcodeScanner from '@/components/BarcodeScanner';

interface Step9Props {
  customer: Customer;
  stepData: Step9Data | null;
  onSave: (data: Step9Data) => Promise<void>;
}

export default function Step9({ customer, stepData, onSave }: Step9Props) {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<Step9Data>({
    completion_file: stepData?.completion_file || 'no',
    completion_date: stepData?.completion_date || getTodayDate(),
    panel: stepData?.panel || { count: 0, items: [] },
    inverter: stepData?.inverter || { count: 0, items: [] },
    gps_photo: stepData?.gps_photo || '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [scannerOpen, setScannerOpen] = useState<{
    type: 'panel' | 'inverter' | null;
    index: number | null;
  }>({ type: null, index: null });

  // Update panel items array when count changes
  useEffect(() => {
    const currentCount = formData.panel.items.length;
    const newCount = formData.panel.count;

    if (newCount > currentCount) {
      const newItems = [...formData.panel.items];
      for (let i = currentCount; i < newCount; i++) {
        newItems.push({
          serial_number: '',
          dcr_ndcr: 'dcr',
          maker: '',
          capacity: 0,
          invoice_date: '',
        });
      }
      setFormData(prev => ({
        ...prev,
        panel: { ...prev.panel, items: newItems },
      }));
    } else if (newCount < currentCount) {
      setFormData(prev => ({
        ...prev,
        panel: { ...prev.panel, items: prev.panel.items.slice(0, newCount) },
      }));
    }
  }, [formData.panel.count]);

  // Update inverter items array when count changes
  useEffect(() => {
    const currentCount = formData.inverter.items.length;
    const newCount = formData.inverter.count;

    if (newCount > currentCount) {
      const newItems = [...formData.inverter.items];
      for (let i = currentCount; i < newCount; i++) {
        newItems.push({
          serial_number: '',
          dcr_ndcr: 'dcr',
          maker: '',
          capacity: 0,
          invoice_date: '',
        });
      }
      setFormData(prev => ({
        ...prev,
        inverter: { ...prev.inverter, items: newItems },
      }));
    } else if (newCount < currentCount) {
      setFormData(prev => ({
        ...prev,
        inverter: { ...prev.inverter, items: prev.inverter.items.slice(0, newCount) },
      }));
    }
  }, [formData.inverter.count]);

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

  const updatePanelItem = (index: number, field: keyof EquipmentItem, value: any) => {
    const newItems = [...formData.panel.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      panel: { ...prev.panel, items: newItems },
    }));
  };

  const updateInverterItem = (index: number, field: keyof EquipmentItem, value: any) => {
    const newItems = [...formData.inverter.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      inverter: { ...prev.inverter, items: newItems },
    }));
  };

  const handleOpenScanner = (type: 'panel' | 'inverter', index: number) => {
    setScannerOpen({ type, index });
  };

  const handleScanSuccess = (scannedValue: string) => {
    if (scannerOpen.type === 'panel' && scannerOpen.index !== null) {
      updatePanelItem(scannerOpen.index, 'serial_number', scannedValue);
    } else if (scannerOpen.type === 'inverter' && scannerOpen.index !== null) {
      updateInverterItem(scannerOpen.index, 'serial_number', scannedValue);
    }
  };

  return (
    <div className="space-y-6">
      {/* Completion File Status */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Completion Date
        </label>
        <input
          type="date"
          value={formData.completion_date}
          onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none mb-4"
        />

        <label className="block text-sm font-medium text-stone-700 mb-2">
          Completion File *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="completion_file"
              value="complete"
              checked={formData.completion_file === 'complete'}
              onChange={(e) => setFormData({ ...formData, completion_file: e.target.value as 'complete' | 'no' })}
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">Complete</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="completion_file"
              value="no"
              checked={formData.completion_file === 'no'}
              onChange={(e) => setFormData({ ...formData, completion_file: e.target.value as 'complete' | 'no' })}
              className="w-4 h-4 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-700">No</span>
          </label>
        </div>
      </div>

      {/* Panel Details */}
      <div className="border border-stone-300 rounded-lg p-4">
        <h4 className="font-semibold text-stone-900 mb-3">Panel Details</h4>

        <div className="mb-4">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Number of Panels *
          </label>
          <input
            type="number"
            min="0"
            value={formData.panel.count || ''}
            onChange={(e) => setFormData({ ...formData, panel: { ...formData.panel, count: parseInt(e.target.value) || 0 } })}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
          />
        </div>

        {formData.panel.items.map((item, index) => (
          <div key={index} className="mb-4 p-3 bg-stone-50 rounded-lg">
            <h5 className="text-sm font-semibold text-stone-700 mb-3">Panel {index + 1}</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Serial Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={item.serial_number}
                    onChange={(e) => updatePanelItem(index, 'serial_number', e.target.value)}
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleOpenScanner('panel', index)}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1 text-sm whitespace-nowrap"
                    title="Scan Barcode"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Scan</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">DCR/NDCR</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`panel_dcr_${index}`}
                      value="dcr"
                      checked={item.dcr_ndcr === 'dcr'}
                      onChange={(e) => updatePanelItem(index, 'dcr_ndcr', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs">DCR</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`panel_dcr_${index}`}
                      value="ndcr"
                      checked={item.dcr_ndcr === 'ndcr'}
                      onChange={(e) => updatePanelItem(index, 'dcr_ndcr', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs">NDCR</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Maker</label>
                <input
                  type="text"
                  value={item.maker}
                  onChange={(e) => updatePanelItem(index, 'maker', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Capacity (W)</label>
                <input
                  type="number"
                  value={item.capacity || ''}
                  onChange={(e) => updatePanelItem(index, 'capacity', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-stone-700 mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={item.invoice_date}
                  onChange={(e) => updatePanelItem(index, 'invoice_date', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inverter Details */}
      <div className="border border-stone-300 rounded-lg p-4">
        <h4 className="font-semibold text-stone-900 mb-3">Inverter Details</h4>

        <div className="mb-4">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Number of Inverters *
          </label>
          <input
            type="number"
            min="0"
            value={formData.inverter.count || ''}
            onChange={(e) => setFormData({ ...formData, inverter: { ...formData.inverter, count: parseInt(e.target.value) || 0 } })}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none"
          />
        </div>

        {formData.inverter.items.map((item, index) => (
          <div key={index} className="mb-4 p-3 bg-stone-50 rounded-lg">
            <h5 className="text-sm font-semibold text-stone-700 mb-3">Inverter {index + 1}</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Serial Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={item.serial_number}
                    onChange={(e) => updateInverterItem(index, 'serial_number', e.target.value)}
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleOpenScanner('inverter', index)}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1 text-sm whitespace-nowrap"
                    title="Scan Barcode"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Scan</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">DCR/NDCR</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`inverter_dcr_${index}`}
                      value="dcr"
                      checked={item.dcr_ndcr === 'dcr'}
                      onChange={(e) => updateInverterItem(index, 'dcr_ndcr', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs">DCR</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`inverter_dcr_${index}`}
                      value="ndcr"
                      checked={item.dcr_ndcr === 'ndcr'}
                      onChange={(e) => updateInverterItem(index, 'dcr_ndcr', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs">NDCR</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Maker</label>
                <input
                  type="text"
                  value={item.maker}
                  onChange={(e) => updateInverterItem(index, 'maker', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Capacity (W)</label>
                <input
                  type="number"
                  value={item.capacity || ''}
                  onChange={(e) => updateInverterItem(index, 'capacity', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-stone-700 mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={item.invoice_date}
                  onChange={(e) => updateInverterItem(index, 'invoice_date', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GPS Photo */}
      <FileUpload
        label="GPS Photo"
        accept="image/*"
        value={formData.gps_photo}
        onChange={(url) => setFormData({ ...formData, gps_photo: url as string })}
        customerId={customer.id}
        documentType="gps_photo"
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

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={scannerOpen.type !== null}
        onClose={() => setScannerOpen({ type: null, index: null })}
        onScanSuccess={handleScanSuccess}
        title={`Scan ${scannerOpen.type === 'panel' ? 'Panel' : 'Inverter'} Serial Number`}
      />
    </div>
  );
}
