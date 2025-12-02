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
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set());
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

      // Just update the steps data without resetting the selected step
      const stepsRes = await fetch(`/api/customers/${id}/steps`);
      const stepsData = await stepsRes.json();
      setSteps(stepsData.steps || []);
    } catch (error) {
      console.error('Error saving step:', error);
      throw error;
    }
  };

  const handleNextStep = async () => {
    if (selectedStep < 16) {
      const nextStep = selectedStep + 1;

      // Update customer's current_step in the database
      await handleUpdateCustomer({ current_step: nextStep });

      // Move to next step
      setSelectedStep(nextStep);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (selectedStep === 16) {
      // Mark customer as completed when on step 16
      await handleUpdateCustomer({ status: 'completed' });
      // Optionally refresh data to show updated status
      await fetchCustomerData();
    }
  };

  const handlePreviousStep = () => {
    if (selectedStep > 1) {
      setSelectedStep(selectedStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      // Silent save - no notification
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDownloadReport = () => {
    if (!customer) return;

    // Helper to format step data nicely
    const formatStepData = (stepNumber: number, data: any) => {
      if (!data || Object.keys(data).length === 0) return '<p style="color: #999;">No data entered yet</p>';

      let html = '<div style="margin-top: 10px;">';

      switch (stepNumber) {
        case 1:
          if (data.address) html += `<p><strong>Address:</strong> ${data.address}</p>`;
          if (data.site_location) html += `<p><strong>Site Location:</strong> <a href="${data.site_location}" target="_blank">View on Map</a></p>`;
          if (data.kw_capacity) html += `<p><strong>KW Capacity:</strong> ${data.kw_capacity} kW</p>`;
          if (data.quotation) html += `<p><strong>Quotation:</strong> ₹${data.quotation.toLocaleString('en-IN')}</p>`;
          if (data.commercial_domestic) html += `<p><strong>Type:</strong> ${data.commercial_domestic === 'commercial' ? 'Commercial' : 'Domestic'}</p>`;
          break;

        case 2:
          if (data.selected_site) html += `<p><strong>Selected Site:</strong> ${data.selected_site.replace('_', ' ').toUpperCase()}</p>`;
          if (data.status) html += `<p><strong>Status:</strong> ${data.status === 'filled' ? 'Filled' : 'Not Filled'}</p>`;
          if (data.completion_date) html += `<p><strong>Completion Date:</strong> ${data.completion_date}</p>`;
          break;

        case 3:
          if (data.online_submitted) html += `<p><strong>Online Submitted:</strong> ${data.online_submitted === 'yes' ? 'Yes' : 'No'}</p>`;
          if (data.completion_date) html += `<p><strong>Completion Date:</strong> ${data.completion_date}</p>`;
          if (data.bank_name) html += `<p><strong>Bank Name:</strong> ${data.bank_name}</p>`;
          if (data.branch_name) html += `<p><strong>Branch Name:</strong> ${data.branch_name}</p>`;
          break;

        case 4:
          if (data.submitted_to_bank) html += `<p><strong>Submitted to Bank:</strong> ${data.submitted_to_bank === 'yes' ? 'Yes' : 'No'}</p>`;
          if (data.completion_date) html += `<p><strong>Completion Date:</strong> ${data.completion_date}</p>`;
          break;

        case 5:
          if (data.bank_verification) html += `<p><strong>Bank Verification:</strong> ${data.bank_verification === 'done' ? 'Done' : 'No'}</p>`;
          if (data.completion_date) html += `<p><strong>Completion Date:</strong> ${data.completion_date}</p>`;
          break;

        case 6:
          if (data.amount !== undefined) html += `<p><strong>1st Disbursement:</strong> ₹${data.amount.toLocaleString('en-IN')}</p>`;
          if (data.remaining_amount !== undefined) html += `<p><strong>Remaining Amount:</strong> ₹${data.remaining_amount.toLocaleString('en-IN')}</p>`;
          break;

        case 7:
          if (data.completion_date) html += `<p><strong>Completion Date:</strong> ${data.completion_date}</p>`;
          if (data.materials) {
            html += '<p><strong>Materials:</strong></p><ul style="margin: 5px 0; padding-left: 20px;">';
            Object.entries(data.materials).forEach(([mat, checked]) => {
              if (checked) html += `<li>${mat}</li>`;
            });
            html += '</ul>';
          }
          break;

        case 8:
          if (data.completion_date) html += `<p><strong>Completion Date:</strong> ${data.completion_date}</p>`;
          if (data.structure) {
            html += `<p><strong>Structure Installation:</strong> ${data.structure.status === 'done' ? 'Done' : 'No'}`;
            if (data.structure.team_name) html += ` (Team: ${data.structure.team_name})`;
            html += '</p>';
          }
          if (data.wiring) {
            html += `<p><strong>Wiring Installation:</strong> ${data.wiring.status === 'done' ? 'Done' : 'No'}`;
            if (data.wiring.team_name) html += ` (Team: ${data.wiring.team_name})`;
            html += '</p>';
          }
          break;

        case 9:
          if (data.completion_file) html += `<p><strong>Completion File:</strong> ${data.completion_file === 'complete' ? 'Complete' : 'No'}</p>`;
          if (data.completion_date) html += `<p><strong>Completion Date:</strong> ${data.completion_date}</p>`;
          if (data.panel) {
            html += `<p><strong>Panels:</strong> ${data.panel.count} panel(s)</p>`;
            if (data.panel.items && data.panel.items.length > 0) {
              html += '<ul style="margin: 5px 0; padding-left: 20px;">';
              data.panel.items.forEach((item: any, i: number) => {
                html += `<li>Panel ${i + 1}: ${item.maker || 'N/A'} - ${item.capacity}W (${item.dcr_ndcr?.toUpperCase()})</li>`;
              });
              html += '</ul>';
            }
          }
          if (data.inverter) {
            html += `<p><strong>Inverters:</strong> ${data.inverter.count} inverter(s)</p>`;
            if (data.inverter.items && data.inverter.items.length > 0) {
              html += '<ul style="margin: 5px 0; padding-left: 20px;">';
              data.inverter.items.forEach((item: any, i: number) => {
                html += `<li>Inverter ${i + 1}: ${item.maker || 'N/A'} - ${item.capacity}W (${item.dcr_ndcr?.toUpperCase()})</li>`;
              });
              html += '</ul>';
            }
          }
          break;

        case 10:
          if (data.print_sign_upload_done) html += `<p><strong>Print → Sign → Upload:</strong> ${data.print_sign_upload_done === 'done' ? 'Done' : 'No'}</p>`;
          if (data.completion_date) html += `<p><strong>Completion Date:</strong> ${data.completion_date}</p>`;
          break;

        case 11:
          if (data.mseb_inspection) html += `<p><strong>MSEB Inspection:</strong> ${data.mseb_inspection === 'done' ? 'Done' : 'No'}</p>`;
          if (data.inspector_name) html += `<p><strong>Inspector:</strong> ${data.inspector_name}</p>`;
          if (data.inspection_date) html += `<p><strong>Inspection Date:</strong> ${data.inspection_date}</p>`;
          break;

        case 12:
          if (data.meter_release_date) html += `<p><strong>Meter Release Date:</strong> ${data.meter_release_date}</p>`;
          if (data.upload_status) html += `<p><strong>Upload Status:</strong> ${data.upload_status === 'done' ? 'Done' : 'Not Done'}</p>`;
          break;

        case 13:
          if (data.status) html += `<p><strong>Status:</strong> ${data.status === 'done' ? 'Done' : 'No'}</p>`;
          if (data.installer_name) html += `<p><strong>Installer:</strong> ${data.installer_name}</p>`;
          if (data.installation_date) html += `<p><strong>Installation Date:</strong> ${data.installation_date}</p>`;
          break;

        case 14:
          if (data.mail_sent) html += `<p><strong>Mail to Bank:</strong> ${data.mail_sent === 'done' ? 'Done' : 'No'}</p>`;
          if (data.completion_date) html += `<p><strong>Completion Date:</strong> ${data.completion_date}</p>`;
          break;

        case 15:
          if (data.inspector_name) html += `<p><strong>Inspector:</strong> ${data.inspector_name}</p>`;
          if (data.inspection_date) html += `<p><strong>Inspection Date:</strong> ${data.inspection_date}</p>`;
          break;

        case 16:
          if (data.amount !== undefined) html += `<p><strong>Final Disbursement:</strong> ₹${data.amount.toLocaleString('en-IN')}</p>`;
          if (data.payment_date) html += `<p><strong>Payment Date:</strong> ${data.payment_date}</p>`;
          break;

        default:
          html += `<pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${JSON.stringify(data, null, 2)}</pre>`;
      }

      html += '</div>';
      return html;
    };

    // Generate report content
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Report - ${customer.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; }
          h1 { color: #333; border-bottom: 3px solid #d97706; padding-bottom: 10px; }
          h2 { color: #666; margin-top: 30px; border-bottom: 2px solid #ddd; padding-bottom: 8px; }
          h3 { color: #333; margin: 10px 0 5px 0; }
          .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 10px; margin: 20px 0; background: #f9fafb; padding: 20px; border-radius: 8px; }
          .info-label { font-weight: bold; color: #666; }
          .step { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .step.completed { border-left: 4px solid #16a34a; }
          .step h3 { margin-top: 0; }
          .step p { margin: 8px 0; }
          .step ul { margin: 5px 0; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>Solar Installation Customer Report</h1>

        <h2>Customer Information</h2>
        <div class="info-grid">
          <div class="info-label">Name:</div><div>${customer.name}</div>
          <div class="info-label">Email:</div><div>${customer.email || 'N/A'}</div>
          <div class="info-label">Phone:</div><div>${customer.phone}</div>
          <div class="info-label">Type:</div><div>${customer.type === 'finance' ? 'Finance' : 'Cash'}</div>
          <div class="info-label">Status:</div><div style="color: ${customer.status === 'completed' ? '#16a34a' : customer.status === 'active' ? '#2563eb' : '#6b7280'}; font-weight: bold;">${customer.status.toUpperCase()}</div>
          <div class="info-label">KW Capacity:</div><div>${customer.kw_capacity || 'N/A'} kW</div>
          <div class="info-label">Quotation:</div><div>₹${customer.quotation?.toLocaleString('en-IN') || 'N/A'}</div>
          <div class="info-label">Current Step:</div><div>${customer.current_step} of 16</div>
          <div class="info-label">Created:</div><div>${formatDate(customer.created_at)}</div>
        </div>
        ${customer.address ? `<div class="info-grid"><div class="info-label">Address:</div><div>${customer.address}</div></div>` : ''}

        <h2>Installation Progress (Steps 1-16)</h2>
        ${steps.map(step => `
          <div class="step ${step.completed_at ? 'completed' : ''}">
            <h3>Step ${step.step_number}: ${getStepName(step.step_number)}</h3>
            <p style="color: #666; font-size: 13px;">
              <strong>Last Updated:</strong> ${formatDate(step.updated_at)}
              ${step.completed_at ? ` • <strong style="color: #16a34a;">Completed:</strong> ${formatDate(step.completed_at)}` : ''}
            </p>
            ${formatStepData(step.step_number, step.data)}
          </div>
        `).join('')}

        ${notes ? `
          <h2>Additional Notes</h2>
          <div style="white-space: pre-wrap; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #ddd;">
            ${notes}
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 40px;">
          <button onclick="window.print()" style="margin-top: 30px; padding: 12px 30px; background: #d97706; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600;">
            Print / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `;

    // Open in new window
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(reportContent);
      reportWindow.document.close();
    }
  };

  const getStepData = (stepNumber: number) => {
    const step = steps.find(s => s.step_number === stepNumber);
    return step?.data || null;
  };

  const renderStepComponent = () => {
    if (!customer) return null;

    const stepData = getStepData(selectedStep);

    switch (selectedStep) {
      case 1:
        return <Step1
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
          onUpdateCustomer={handleUpdateCustomer}
        />;
      case 2:
        return <Step2
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 3:
        return <Step3
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 4:
        return <Step4
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 5:
        return <Step5
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 6:
        return <Step6
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 7:
        return <Step7
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 8:
        return <Step8
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 9:
        return <Step9
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 10:
        return <Step10
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 11:
        return <Step11
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 12:
        return <Step12
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 13:
        return <Step13
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 14:
        return <Step14
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 15:
        return <Step15
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
      case 16:
        return <Step16
          customer={customer}
          stepData={stepData as any}
          onSave={(data: any) => handleSaveStep(selectedStep, data)}
        />;
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

  const handleSelectDocument = (index: number) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === allDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(allDocuments.map((_, i) => i)));
    }
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      // Fetch the file as a blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Failed to download ${fileName}`);
    }
  };

  const handleDownloadSelected = async () => {
    const docs = allDocuments.filter((_, i) => selectedDocuments.has(i));

    if (docs.length === 0) {
      alert('Please select at least one document to download');
      return;
    }

    // Download each file one by one
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];

      // Create a better filename with customer name
      const fileExtension = doc.url.split('.').pop()?.split('?')[0] || 'file';
      const sanitizedCustomerName = customer?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'customer';
      const sanitizedDocName = doc.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${sanitizedCustomerName}_${sanitizedDocName}.${fileExtension}`;

      await downloadFile(doc.url, fileName);

      // Wait before next download
      if (i < docs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Clear selection after download
    setSelectedDocuments(new Set());
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
              <button
                onClick={handleDownloadReport}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
              >
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

          {/* Progress Timeline */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-stone-900">
                Installation Progress
              </h3>
              <div className="text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${
                  customer.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {customer.status === 'completed' ? '✓ Completed' : `Step ${customer.current_step} of 16`}
                </span>
              </div>
            </div>

            {/* Quick Jump Buttons */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {Array.from({ length: 16 }, (_, i) => i + 1).map((step) => {
                const completed = step < customer.current_step;
                const current = step === customer.current_step;

                return (
                  <button
                    key={step}
                    onClick={() => setSelectedStep(step)}
                    title={`Step ${step}: ${getStepName(step)}`}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      selectedStep === step
                        ? 'bg-amber-600 text-white ring-4 ring-amber-200 scale-110'
                        : completed
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : current
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                    }`}
                  >
                    {completed ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current Step Display */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {selectedStep}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-stone-900">{getStepName(selectedStep)}</h4>
                  <p className="text-sm text-stone-600">Currently viewing this step</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousStep}
                    disabled={selectedStep === 1}
                    className="p-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Step"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={selectedStep === 16 && customer.status === 'completed'}
                    className="p-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Step"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
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

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-stone-200">
              <button
                onClick={handlePreviousStep}
                disabled={selectedStep === 1}
                className="px-6 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <div className="text-sm text-stone-600">
                Step {selectedStep} of 16
              </div>
              {customer.status === 'completed' ? (
                <div className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Customer Completed
                </div>
              ) : selectedStep === 16 ? (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Mark as Completed
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900">All Documents</h3>
              {allDocuments.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    {selectedDocuments.size === allDocuments.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleDownloadSelected}
                    disabled={selectedDocuments.size === 0}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                  >
                    Download Selected ({selectedDocuments.size})
                  </button>
                </div>
              )}
            </div>

            {allDocuments.length === 0 ? (
              <p className="text-stone-500 text-center py-8">No documents uploaded yet</p>
            ) : (
              <div className="space-y-2">
                {allDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-stone-300 rounded-lg hover:bg-stone-50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.has(index)}
                        onChange={() => handleSelectDocument(index)}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-600 rounded"
                      />
                      <svg className="w-5 h-5 text-stone-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-stone-900">{doc.name}</p>
                        <p className="text-xs text-stone-500">From Step {doc.step}: {getStepName(doc.step)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const fileExtension = doc.url.split('.').pop()?.split('?')[0] || 'file';
                        const sanitizedCustomerName = customer?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'customer';
                        const sanitizedDocName = doc.name.replace(/[^a-zA-Z0-9]/g, '_');
                        const fileName = `${sanitizedCustomerName}_${sanitizedDocName}.${fileExtension}`;
                        downloadFile(doc.url, fileName);
                      }}
                      className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm rounded-lg transition-colors flex-shrink-0"
                    >
                      Download
                    </button>
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
