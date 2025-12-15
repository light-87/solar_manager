'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Customer, StepData } from '@/types';
import { formatDate, isStepSkipped } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api-client';
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
  const { userRole } = useAuth();

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      const [customerRes, stepsRes] = await Promise.all([
        apiFetch(`/api/customers/${id}`),
        apiFetch(`/api/customers/${id}/steps`),
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
      const response = await apiFetch(`/api/customers/${id}/steps`, {
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
      const stepsRes = await apiFetch(`/api/customers/${id}/steps`);
      const stepsData = await stepsRes.json();
      setSteps(stepsData.steps || []);
    } catch (error) {
      console.error('Error saving step:', error);
      throw error;
    }
  };

  const handleNextStep = async () => {
    if (selectedStep < 16) {
      let nextStep = selectedStep + 1;

      // Skip any steps that should be skipped for this customer type
      while (nextStep <= 16 && isStepSkipped(nextStep, customer!.type)) {
        nextStep++;
      }

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
      const response = await apiFetch(`/api/customers/${id}`, {
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

    // Helper to generate table rows
    const generateRows = () => {
      let rows = '';

      // Helper for adding a section header
      const addSectionHeader = (title: string) => {
        rows += `
          <tr class="section-header">
            <th colspan="2">${title}</th>
          </tr>
        `;
      };

      // Helper for adding a data row
      const addRow = (field: string, value: string | number | undefined | null) => {
        if (value === undefined || value === null || value === '') return;
        rows += `
          <tr>
            <td class="field">${field}</td>
            <td class="value">${value}</td>
          </tr>
        `;
      };

      // --- Customer Information ---
      addSectionHeader('Customer Information');
      addRow('Name', customer.name);
      addRow('Phone', customer.phone);
      addRow('Email', customer.email);
      addRow('Address', customer.address);
      addRow('Type', customer.type === 'finance' ? 'Finance' : 'Cash');
      addRow('Status', customer.status.toUpperCase());
      addRow('KW Capacity', customer.kw_capacity ? `${customer.kw_capacity} kW` : '');
      addRow('Quotation', customer.quotation ? `₹${customer.quotation.toLocaleString('en-IN')}` : '');
      addRow('Created Date', formatDate(customer.created_at));

      // --- Site Details ---
      let hasSiteDetails = false;
      const step1 = steps.find(s => s.step_number === 1)?.data;
      const step2 = steps.find(s => s.step_number === 2)?.data;

      if ((step1?.site_location) || (step2?.selected_site || step2?.completion_date)) {
        addSectionHeader('Site Details');
        if (step1?.site_location) addRow('Google Maps Location', `<a href="${step1.site_location}" target="_blank">View Map</a>`);
        if (step2?.selected_site) addRow('Selected Site', step2.selected_site.replace('_', ' ').toUpperCase());
        if (step2?.completion_date) addRow('Selection Date', step2.completion_date);
      }

      // --- Application & Bank ---
      const step3 = steps.find(s => s.step_number === 3)?.data;
      const step4 = steps.find(s => s.step_number === 4)?.data;
      const step5 = steps.find(s => s.step_number === 5)?.data;
      const step14 = steps.find(s => s.step_number === 14)?.data;

      if (step3 || step4 || step5 || step14) {
        let hasBankData = false;
        // Check if we have any data to show before adding header
        if ((step3?.online_submitted || step3?.bank_name) || (step4?.submitted_to_bank) || (step5?.bank_verification) || (step14?.mail_sent)) {
          addSectionHeader('Application & Bank Details');

          if (step3?.online_submitted) addRow('Online Application', step3.online_submitted === 'yes' ? 'Submitted' : 'Pending');
          if (step3?.bank_name) addRow('Bank Name', step3.bank_name);
          if (step3?.branch_name) addRow('Branch Name', step3.branch_name);
          if (step3?.completion_date) addRow('Application Date', step3.completion_date);

          if (step4?.submitted_to_bank) addRow('Submitted to Bank', step4.submitted_to_bank === 'yes' ? 'Yes' : 'No');
          if (step4?.completion_date) addRow('Submission Date', step4.completion_date);

          if (step5?.bank_verification) addRow('Bank Verification', step5.bank_verification === 'done' ? 'Completed' : 'Pending');
          if (step5?.completion_date) addRow('Verification Date', step5.completion_date);

          if (step14?.mail_sent) addRow('Mail to Bank', step14.mail_sent === 'done' ? 'Sent' : 'Pending');
        }
      }

      // --- Payments ---
      const step6 = steps.find(s => s.step_number === 6)?.data;
      const step16 = steps.find(s => s.step_number === 16)?.data;

      if ((step6?.amount) || (step16?.amount)) {
        addSectionHeader('Payment Information');
        if (step6?.amount) addRow('1st Disbursement', `₹${step6.amount.toLocaleString('en-IN')}`);
        if (step6?.remaining_amount) addRow('Remaining Amount', `₹${step6.remaining_amount.toLocaleString('en-IN')}`);

        if (step16?.amount) addRow('Final Disbursement', `₹${step16.amount.toLocaleString('en-IN')}`);
        if (step16?.payment_date) addRow('Final Payment Date', step16.payment_date);
      }

      // --- Installation & Materials ---
      const step7 = steps.find(s => s.step_number === 7)?.data;
      const step8 = steps.find(s => s.step_number === 8)?.data;
      const step13 = steps.find(s => s.step_number === 13)?.data;

      if (step7 || step8 || step13) {
        if ((step7?.materials) || (step8?.structure || step8?.wiring) || (step13?.status)) {
          addSectionHeader('Installation & Materials');

          if (step7?.materials) {
            const materialsList = Object.entries(step7.materials)
              .filter(([_, checked]) => checked)
              .map(([mat]) => mat)
              .join(', ');
            if (materialsList) addRow('Materials Delivered', materialsList);
            if (step7.completion_date) addRow('Delivery Date', step7.completion_date);
          }

          if (step8?.structure) {
            addRow('Structure Installation', step8.structure.status === 'done' ? 'Completed' : 'Pending');
            if (step8.structure.team_name) addRow('Structure Team', step8.structure.team_name);
          }
          if (step8?.wiring) {
            addRow('Wiring Installation', step8.wiring.status === 'done' ? 'Completed' : 'Pending');
            if (step8.wiring.team_name) addRow('Wiring Team', step8.wiring.team_name);
          }
          if (step8?.completion_date) addRow('Installation Date', step8.completion_date);

          if (step13?.status) addRow('Meter Installation', step13.status === 'done' ? 'Completed' : 'Pending');
          if (step13?.installer_name) addRow('Meter Installer', step13.installer_name);
          if (step13?.installation_date) addRow('Meter Install Date', step13.installation_date);
        }
      }

      // --- Equipment (Panels & Inverters) ---
      const step9 = steps.find(s => s.step_number === 9)?.data;
      if (step9?.panel?.items || step9?.inverter?.items) {
        addSectionHeader('Equipment Details');

        if (step9.panel?.items) {
          step9.panel.items.forEach((item: any, i: number) => {
            addRow(`Panel ${i + 1}`, `${item.maker || 'N/A'} - ${item.capacity}W (${item.dcr_ndcr?.toUpperCase()})`);
            addRow(`Panel ${i + 1} Serial`, item.serial_number || 'N/A');
            addRow(`Panel ${i + 1} Invoice`, item.invoice_date || 'N/A');
          });
        }

        if (step9.inverter?.items) {
          step9.inverter.items.forEach((item: any, i: number) => {
            addRow(`Inverter ${i + 1}`, `${item.maker || 'N/A'} - ${item.capacity}W (${item.dcr_ndcr?.toUpperCase()})`);
            addRow(`Inverter ${i + 1} Serial`, item.serial_number || 'N/A');
            addRow(`Inverter ${i + 1} Invoice`, item.invoice_date || 'N/A');
          });
        }

        if (step9.completion_date) addRow('Equipment Completion', step9.completion_date);
      }

      // --- Inspections & Approvals ---
      const step10 = steps.find(s => s.step_number === 10)?.data;
      const step11 = steps.find(s => s.step_number === 11)?.data;
      const step12 = steps.find(s => s.step_number === 12)?.data;
      const step15 = steps.find(s => s.step_number === 15)?.data;

      if (step10 || step11 || step12 || step15) {
        if ((step10?.print_sign_upload_done) || (step11?.mseb_inspection) || (step12?.meter_release_date) || (step15?.inspector_name)) {
          addSectionHeader('Inspections & Approvals');

          if (step10?.print_sign_upload_done) addRow('Print/Sign/Upload', step10.print_sign_upload_done === 'done' ? 'Completed' : 'Pending');

          if (step11?.mseb_inspection) addRow('MSEB Inspection', step11.mseb_inspection === 'done' ? 'Completed' : 'Pending');
          if (step11?.inspector_name) addRow('MSEB Inspector', step11.inspector_name);
          if (step11?.inspection_date) addRow('MSEB Inspection Date', step11.inspection_date);

          if (step12?.meter_release_date) addRow('Meter Release Date', step12.meter_release_date);
          if (step12?.upload_status) addRow('Meter Upload Status', step12.upload_status === 'done' ? 'Completed' : 'Pending');

          if (step15?.inspector_name) addRow('Bank Inspector', step15.inspector_name);
          if (step15?.inspection_date) addRow('Bank Inspection Date', step15.inspection_date);
        }
      }

      // Notes
      if (notes) {
        addSectionHeader('Additional Notes');
        addRow('Notes', notes);
      }

      return rows;
    };

    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Report - ${customer.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #1f2937; background-color: #ffffff; }
          h1 { text-align: center; color: #d97706; margin-bottom: 10px; font-size: 28px; font-weight: 700; }
          .meta { text-align: center; color: #6b7280; margin-bottom: 40px; font-size: 14px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; border: 1px solid #e5e7eb; }
          
          th, td { padding: 12px 16px; text-align: left; vertical-align: top; }
          
          /* Section Headers */
          .section-header th { 
            background-color: #fff7ed; /* Light orange/amber */
            color: #9a3412; /* Dark orange/amber */
            font-weight: 700;
            text-transform: uppercase;
            font-size: 13px;
            letter-spacing: 0.05em;
            border-top: 2px solid #fed7aa;
            border-bottom: 1px solid #fed7aa;
            padding-top: 16px;
            padding-bottom: 8px;
          }
          
          /* Data Rows */
          tr { border-bottom: 1px solid #f3f4f6; }
          tr:last-child { border-bottom: none; }
          
          .field { 
            font-weight: 500; 
            color: #4b5563; 
            width: 35%; 
            background-color: #f9fafb;
            border-right: 1px solid #f3f4f6;
          }
          .value { 
            color: #111827; 
            width: 65%; 
          }
          
          a { color: #2563eb; text-decoration: none; }
          a:hover { text-decoration: underline; }
          
          @media print { 
            body { padding: 0; }
            button { display: none; }
            .section-header th { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #fff7ed !important; }
            .field { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #f9fafb !important; }
          }
        </style>
      </head>
      <body>
        <h1>Solar Installation Report</h1>
        <div class="meta">Generated on ${new Date().toLocaleDateString()}</div>
        
        <table>
          <tbody>
            ${generateRows()}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 40px;">
          <button onclick="window.print()" style="padding: 12px 24px; background: #d97706; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
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

    // Check if this step is skipped for cash customers
    if (isStepSkipped(selectedStep, customer.type)) {
      return (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-200 rounded-full mb-4">
            <svg className="w-8 h-8 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2">Step Not Applicable</h3>
          <p className="text-stone-600">
            This step is not required for cash customers and will be automatically skipped.
          </p>
          <p className="text-sm text-stone-500 mt-2">
            Bank-related steps (Online Application, Submit to Bank, Bank Verification, Mail Bank, Bank Inspection) are only applicable to finance customers.
          </p>
        </div>
      );
    }

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
              {!(customer.type === 'cash' && userRole === 'employee') && (
                <div>
                  <p className="text-sm text-stone-600">Quotation</p>
                  <p className="font-medium text-stone-900">₹{customer.quotation?.toLocaleString('en-IN') || 'N/A'}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-stone-600">Created</p>
                <p className="font-medium text-stone-900">{formatDate(customer.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Status</p>
                <span
                  className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${customer.status === 'active'
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

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Sidebar - Step Navigation */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white rounded-lg border border-stone-200 overflow-hidden sticky top-6">
                <div className="p-4 border-b border-stone-100 bg-stone-50">
                  <h3 className="font-semibold text-stone-900">Installation Steps</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    {Math.round(((customer.current_step - 1) / 15) * 100)}% Complete
                  </p>
                  {/* Progress Bar */}
                  <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${((customer.current_step - 1) / 15) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((step) => {
                    const completed = step < customer.current_step;
                    const current = step === customer.current_step;
                    const active = selectedStep === step;
                    const skipped = isStepSkipped(step, customer.type);

                    return (
                      <button
                        key={step}
                        onClick={() => {
                          setSelectedStep(step);
                          // On mobile, scroll to content
                          if (window.innerWidth < 1024) {
                            document.getElementById('step-content')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className={`w-full text-left px-4 py-3 border-b border-stone-100 last:border-0 flex items-center gap-3 transition-colors ${
                          skipped
                            ? 'bg-stone-100 opacity-60 cursor-default border-l-4 border-l-stone-300'
                            : active
                            ? 'bg-amber-50 border-l-4 border-l-amber-600'
                            : 'hover:bg-stone-50 border-l-4 border-l-transparent'
                          }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          skipped
                            ? 'bg-stone-200 text-stone-500'
                            : completed
                            ? 'bg-green-100 text-green-700'
                            : current
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-stone-100 text-stone-500'
                          }`}>
                          {skipped ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : completed ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            step
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            skipped ? 'text-stone-500' : active ? 'text-amber-900' : 'text-stone-700'
                            }`}>
                            {getStepName(step)}
                          </p>
                          <p className="text-xs text-stone-500 truncate">
                            {skipped ? 'N/A - Cash Customer' : completed ? 'Completed' : current ? 'In Progress' : 'Pending'}
                          </p>
                        </div>
                        {active && !skipped && (
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Content - Active Step */}
            <div className="lg:col-span-9" id="step-content">
              <div className="bg-white rounded-lg border border-stone-200 shadow-sm min-h-[500px]">
                {/* Step Header */}
                <div className="border-b border-stone-100 p-6 flex items-center justify-between bg-stone-50/50 rounded-t-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                        Step {selectedStep}
                      </span>
                      {selectedStep < customer.current_step && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Completed
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-stone-900">
                      {getStepName(selectedStep)}
                    </h2>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePreviousStep}
                      disabled={selectedStep === 1}
                      className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg disabled:opacity-30 transition-colors"
                      title="Previous Step"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={selectedStep > customer.current_step}
                      className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg disabled:opacity-30 transition-colors"
                      title="Next Step"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Step Content */}
                <div className="p-6">
                  {renderStepComponent()}
                </div>

                {/* Footer Navigation */}
                <div className="border-t border-stone-100 p-6 bg-stone-50/30 rounded-b-lg flex justify-between items-center">
                  <button
                    onClick={handlePreviousStep}
                    disabled={selectedStep === 1}
                    className="px-4 py-2 text-stone-600 hover:text-stone-900 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  {selectedStep === customer.current_step && (
                    selectedStep < 16 ? (
                      <button
                        onClick={handleNextStep}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        Complete & Next
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={handleNextStep}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                      >
                        Mark as Completed
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )
                  )}

                  {customer.status === 'completed' && (
                    <div className="px-6 py-2 bg-green-100 text-green-800 rounded-lg flex items-center gap-2 font-medium">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Customer Completed
                    </div>
                  )}
                </div>
              </div>
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
