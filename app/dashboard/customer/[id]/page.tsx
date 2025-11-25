'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Customer, StepData } from '@/types';
import { formatDate, getStepName, isStepSkipped } from '@/lib/utils';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [steps, setSteps] = useState<StepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState(1);
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
      setSelectedStep(customerData.customer.current_step);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setLoading(false);
    }
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
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
                Mark as Completed
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
              Progress: Step {customer.current_step} of 15
            </h3>
            <div className="relative">
              {/* Progress Bar */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-stone-200">
                <div
                  className="h-full bg-amber-600 transition-all"
                  style={{ width: `${(customer.current_step / 15) * 100}%` }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((step) => {
                  const skipped = isStepSkipped(step, customer.type);
                  const completed = step < customer.current_step;
                  const current = step === customer.current_step;

                  return (
                    <button
                      key={step}
                      onClick={() => setSelectedStep(step)}
                      disabled={skipped}
                      className={`flex flex-col items-center ${
                        skipped ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                          skipped
                            ? 'bg-stone-200 text-stone-400'
                            : completed
                            ? 'bg-green-600 text-white'
                            : current
                            ? 'bg-amber-600 text-white ring-4 ring-amber-200'
                            : 'bg-white border-2 border-stone-300 text-stone-600'
                        }`}
                      >
                        {skipped ? (
                          '–'
                        ) : completed ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          step
                        )}
                      </div>
                      <span className="text-xs text-stone-600 mt-2 text-center max-w-[60px] hidden md:block">
                        {getStepName(step, customer.type).split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-stone-900">
                  Step {selectedStep}: {getStepName(selectedStep, customer.type)}
                </h3>
                <p className="text-sm text-stone-600 mt-1">
                  {isStepSkipped(selectedStep, customer.type)
                    ? 'This step is skipped for cash customers'
                    : 'Fill in the required information below'}
                </p>
              </div>
            </div>

            {isStepSkipped(selectedStep, customer.type) ? (
              <div className="text-center py-12 text-stone-500">
                <p>This step is not applicable for {customer.type} customers</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    <strong>Note:</strong> This is a scaffold view. Step forms need to be implemented based on the requirements in the DATABASE_SCHEMA.md and types/index.ts files.
                  </p>
                  <p className="text-sm text-amber-800 mt-2">
                    Each step should have its own form component with the specific fields defined in the requirements.
                  </p>
                </div>

                {/* Placeholder for step form */}
                <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center">
                  <p className="text-stone-600">
                    Step {selectedStep} Form Component
                  </p>
                  <p className="text-sm text-stone-500 mt-2">
                    Implement the form fields for this step based on the requirements
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => selectedStep > 1 && setSelectedStep(selectedStep - 1)}
                    disabled={selectedStep === 1}
                    className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous Step
                  </button>
                  <button
                    onClick={() => selectedStep < 15 && setSelectedStep(selectedStep + 1)}
                    disabled={selectedStep === 15}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h3 className="font-semibold text-stone-900 mb-4">Notes</h3>
            <textarea
              defaultValue={customer.notes || ''}
              placeholder="Add notes about this customer..."
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none resize-none"
              rows={6}
            />
            <div className="mt-3 flex justify-end">
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
