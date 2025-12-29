/**
 * Backup Utility Functions
 * Handles customer data backup and ZIP generation
 */

import JSZip from 'jszip';
import { downloadBlobFile, extractDocumentsWithCategory, DocumentInfo } from './r2-storage';
import type { Customer } from '@/types';

interface StepData {
  id: string;
  customer_id: string;
  step_number: number;
  data: any;
  completed_at: string | null;
  updated_at: string;
}

/**
 * Generate HTML report for customer (server-side version)
 */
export function generateCustomerReport(
  customer: Customer,
  steps: StepData[],
  exportedBy: string
): string {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const generateRows = () => {
    let rows = '';

    const addSectionHeader = (title: string) => {
      rows += `
        <tr class="section-header">
          <th colspan="2">${title}</th>
        </tr>
      `;
    };

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
    if (customer.notes) {
      addSectionHeader('Additional Notes');
      addRow('Notes', customer.notes);
    }

    return rows;
  };

  const reportContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Customer Report - ${customer.name}</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #1f2937; background-color: #ffffff; }
        h1 { text-align: center; color: #d97706; margin-bottom: 10px; font-size: 28px; font-weight: 700; }
        .meta { text-align: center; color: #6b7280; margin-bottom: 40px; font-size: 14px; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; border: 1px solid #e5e7eb; }

        th, td { padding: 12px 16px; text-align: left; vertical-align: top; }

        .section-header th {
          background-color: #fff7ed;
          color: #9a3412;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 13px;
          letter-spacing: 0.05em;
          border-top: 2px solid #fed7aa;
          border-bottom: 1px solid #fed7aa;
          padding-top: 16px;
          padding-bottom: 8px;
        }

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

        .footer { text-align: center; margin-top: 40px; color: #6b7280; font-size: 12px; }

        @media print {
          body { padding: 0; }
          .section-header th { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #fff7ed !important; }
          .field { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #f9fafb !important; }
        }
      </style>
    </head>
    <body>
      <h1>Solar Installation Report</h1>
      <div class="meta">Generated on ${new Date().toLocaleDateString()} | Exported by: ${exportedBy}</div>

      <table>
        <tbody>
          ${generateRows()}
        </tbody>
      </table>

      <div class="footer">
        This is an archived backup report for ${customer.name}
      </div>
    </body>
    </html>
  `;

  return reportContent;
}

/**
 * Sanitize customer name for file naming
 */
function sanitizeCustomerName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .substring(0, 30); // Limit length
}

/**
 * Get file extension from filename or content type
 */
function getFileExtension(filename: string, contentType: string): string {
  // Try to get extension from filename
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (extMatch) {
    return extMatch[1].toLowerCase();
  }

  // Fallback to content type
  const mimeExtensions: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };

  return mimeExtensions[contentType] || 'bin';
}

/**
 * Create backup ZIP for a customer
 */
export async function createCustomerBackupZip(
  customer: Customer,
  steps: StepData[],
  exportedBy: string
): Promise<Blob> {
  const zip = new JSZip();

  // Create a documents folder
  const documentsFolder = zip.folder('documents');

  // 1. Generate and add HTML report
  const reportHtml = generateCustomerReport(customer, steps, exportedBy);
  zip.file('customer-report.html', reportHtml);

  // 2. Create customer data JSON
  const customerData = {
    customer,
    steps,
    exported_at: new Date().toISOString(),
    exported_by: exportedBy,
  };
  zip.file('customer-data.json', JSON.stringify(customerData, null, 2));

  // 3. Extract and download all document files with category info
  const documents = extractDocumentsWithCategory(steps);
  const customerPrefix = sanitizeCustomerName(customer.name);

  // Track used filenames to avoid collisions
  const usedFilenames = new Set<string>();

  for (const doc of documents) {
    try {
      const fileData = await downloadBlobFile(doc.url);
      if (fileData && documentsFolder) {
        // Get file extension
        const extension = getFileExtension(fileData.filename, fileData.contentType);

        // Build descriptive filename: CustomerName_Category[_Index].ext
        let baseFilename = `${customerPrefix}_${doc.category}`;
        if (doc.index) {
          baseFilename += `_${doc.index}`;
        }
        let filename = `${baseFilename}.${extension}`;

        // Handle collisions by adding a suffix
        let counter = 1;
        while (usedFilenames.has(filename.toLowerCase())) {
          filename = `${baseFilename}_${counter}.${extension}`;
          counter++;
        }
        usedFilenames.add(filename.toLowerCase());

        // Add file to documents folder
        documentsFolder.file(filename, fileData.buffer);
      }
    } catch (error) {
      console.error(`Error downloading file ${doc.url}:`, error);
      // Continue with other files
    }
  }

  // 4. Generate ZIP blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * Generate filename for backup ZIP
 */
export function generateBackupFilename(customerName: string): string {
  const sanitizedName = customerName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const date = new Date().toISOString().split('T')[0];
  return `backup-${sanitizedName}-${date}.zip`;
}
