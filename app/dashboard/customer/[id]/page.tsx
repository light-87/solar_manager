'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Customer, StepData } from '@/types';
import { formatDate } from '@/lib/utils';
import Step1 from '@/components/steps/Step1';
import Step2 from '@/components/steps/Step2';
import Step3 from '@/components/steps/Step3';
import Step4 from '@/components/steps/Step4';
import Step5 from '@/components/steps/Step5';
import Step6 from '@/components/steps/Step6';
import Step7 from '@/components/steps/Step7';
import Step8 from '@/components/steps/Step8';
import Step9 from '@/components/steps/Step9';
import Step10 from '@/components/steps/Step10';
import Step11 from '@/components/steps/Step11';
import Step12 from '@/components/steps/Step12';
import Step13 from '@/components/steps/Step13';
import Step14 from '@/components/steps/Step14';
import Step15 from '@/components/steps/Step15';
import Step16 from '@/components/steps/Step16';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [steps, setSteps] = useState<StepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState(1);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      const [customerRes, stepsRes] = await Promise.all([
        fetch(`/api/customers/${id}`),
        fetch(`/api/customers/${id}/steps`),
      ]);

      const customerData = await customerRes.json();
      const stepsData = await stepsRes.json();

      setCustomer(customerData.customer);
      setSteps(stepsData.steps || []);
      setNotes(customerData.customer.notes || '');
      setSelectedStep(customerData.customer.current_step);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setLoading(false);
    }
  };

  const handleSaveStep = async (stepNumber: number, data: any) => {
    try {
      const response = await fetch(`/api/customers/${id}/steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step_number: stepNumber,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save step');
      }

      // Refresh step data
      await fetchCustomerData();
    } catch (error) {
      console.error('Error saving step:', error);
      throw error;
    }
  };

  const handleUpdateCustomer = async (updates: Partial<Customer>) => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      await fetchCustomerData();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await handleUpdateCustomer({ notes });
      alert('Notes saved successfully!');
    } catch (error) {
      alert('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const getStepData = (stepNumber: number) => {
    const step = steps.find(s => s.step_number === stepNumber);
    return step?.data || null;
  };

  const renderStepComponent = () => {
    if (!customer) return null;

    const stepData = getStepData(selectedStep);

    const stepProps = {
      customer,
      stepData,
      onSave: (data: any) => handleSaveStep(selectedStep, data),
    };

    const step1Props = {
      ...stepProps,
      onUpdateCustomer: handleUpdateCustomer,
    };

    switch (selectedStep) {
      case 1:
        return <Step1 {...step1Props} />;
      case 2:
        return <Step2 {...stepProps} />;
      case 3:
        return <Step3 {...stepProps} />;
      case 4:
        return <Step4 {...stepProps} />;
      case 5:
        return <Step5 {...stepProps} />;
      case 6:
        return <Step6 {...stepProps} />;
      case 7:
        return <Step7 {...stepProps} />;
      case 8:
        return <Step8 {...stepProps} />;
      case 9:
        return <Step9 {...stepProps} />;
      case 10:
        return <Step10 {...stepProps} />;
      case 11:
        return <Step11 {...stepProps} />;
      case 12:
        return <Step12 {...stepProps} />;
      case 13:
        return <Step13 {...stepProps} />;
      case 14:
        return <Step14 {...stepProps} />;
      case 15:
        return <Step15 {...stepProps} />;
      case 16:
        return <Step16 {...stepProps} />;
      default:
        return <div>Invalid step</div>;
    }
  };

  const getStepName = (step: number) => {
    const stepNames: Record<number, string> = {
      1: 'Details & Documents',
      2: 'Site Selection',
      3: 'Online Application',
      4: 'Submit to Bank',
      5: 'Bank Verification',
      6: '1st Disbursement',
      7: 'Materials List',
      8: 'Installation',
      9: 'Completion Details',
      10: 'Document Uploads',
      11: 'MSEB Inspection',
      12: 'Meter Release',
      13: 'Meter Installation',
      14: 'Mail Bank',
      15: 'Bank Inspection',
      16: 'Final Disbursement',
    };
    return stepNames[step] || `Step ${step}`;
  };

  // Collect all document URLs from all steps
  const getAllDocuments = () => {
    const documents: { name: string; url: string; step: number }[] = [];

    steps.forEach((step) => {
      const data = step.data;
      const stepNum = step.step_number;

      // Helper to add documents
      const addDoc = (name: string, url: string | string[] | undefined) => {
        if (Array.isArray(url)) {
          url.forEach((u, i) => {
            if (u) documents.push({ name: `${name} ${i + 1}`, url: u, step: stepNum });
          });
        } else if (url) {
          documents.push({ name, url, step: stepNum });
        }
      };

      // Step 1 documents
      if (stepNum === 1) {
        addDoc('Aadhaar Card', data.aadhaar_card);
        addDoc('PAN Card', data.pan_card);
        addDoc('Electric Bill', data.electric_bill);
        addDoc('Bank Passbook', data.bank_passbook);
      }

      // Step 3 documents
      if (stepNum === 3) {
        addDoc('JanSamarth', data.jan_samarth);
        addDoc('Acknowledgment', data.acknowledgment);
      }

      // Step 9 documents
      if (stepNum === 9) {
        addDoc('GPS Photo', data.gps_photo);
      }

      // Step 10 documents
      if (stepNum === 10) {
        addDoc('Completion File', data.completion_file);
        addDoc('Net Agreement', data.net_agreement);
        addDoc('Model Agreement', data.model_agreement);
        addDoc('DCR/NDCR Certificate', data.dcr_ndcr_certificate);
      }
    });

    return documents;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!customer) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center">
            <p className="text-stone-600">Customer not found</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg"
            >
              Go Back
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const allDocuments = getAllDocuments();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-stone-600 hover:text-stone-900 flex items-center gap-2 mb-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <h2 className="text-2xl font-semibold text-stone-900">
                {customer.name}
              </h2>
              <p className="text-stone-600 mt-1">
                {customer.type === 'finance' ? 'Finance' : 'Cash'} Customer • {customer.phone}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50">
                Download Report
              </button>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h3 className="font-semibold text-stone-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-stone-600">Email</p>
                <p className="font-medium text-stone-900">{customer.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Phone</p>
                <p className="font-medium text-stone-900">{customer.phone}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">KW Capacity</p>
                <p className="font-medium text-stone-900">{customer.kw_capacity || 'N/A'} kW</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Quotation</p>
                <p className="font-medium text-stone-900">₹{customer.quotation?.toLocaleString('en-IN') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Created</p>
                <p className="font-medium text-stone-900">{formatDate(customer.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Status</p>
                <span
                  className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                    customer.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : customer.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-stone-100 text-stone-800'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
            </div>
            {customer.address && (
              <div className="mt-4">
                <p className="text-sm text-stone-600">Address</p>
                <p className="font-medium text-stone-900">{customer.address}</p>
              </div>
            )}
          </div>

          {/* Progress Stepper */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h3 className="font-semibold text-stone-900 mb-4">
              Progress: Step {customer.current_step} of 16
            </h3>
            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-4">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((step) => {
                  const completed = step < customer.current_step;
                  const current = step === customer.current_step;

                  return (
                    <button
                      key={step}
                      onClick={() => setSelectedStep(step)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all min-w-[120px] ${
                        selectedStep === step
                          ? 'border-amber-600 bg-amber-50'
                          : completed
                          ? 'border-green-600 bg-green-50'
                          : current
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          completed
                            ? 'bg-green-600 text-white'
                            : current
                            ? 'bg-blue-600 text-white'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {completed ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          step
                        )}
                      </div>
                      <span className="text-xs text-center font-medium text-stone-700">
                        {getStepName(step)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-stone-900">
                Step {selectedStep}: {getStepName(selectedStep)}
              </h3>
            </div>

            {renderStepComponent()}
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h3 className="font-semibold text-stone-900 mb-4">All Documents</h3>
            {allDocuments.length === 0 ? (
              <p className="text-stone-500 text-center py-8">No documents uploaded yet</p>
            ) : (
              <div className="space-y-2">
                {allDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-stone-300 rounded-lg hover:bg-stone-50"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-stone-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{doc.name}</p>
                        <p className="text-xs text-stone-500">From Step {doc.step}: {getStepName(doc.step)}</p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h3 className="font-semibold text-stone-900 mb-4">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this customer..."
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none resize-none"
              rows={6}
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white rounded-lg"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
