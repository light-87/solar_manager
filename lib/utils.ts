import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStepName(stepNumber: number, customerType: 'finance' | 'cash'): string {
  const steps: Record<number, string> = {
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

  return steps[stepNumber] || 'Unknown Step';
}

export function isStepSkipped(stepNumber: number, customerType: 'finance' | 'cash'): boolean {
  if (customerType === 'cash') {
    return stepNumber === 3 || stepNumber === 14;
  }
  return false;
}

export function validatePin(pin: string): boolean {
  return /^\d{5}$/.test(pin);
}
