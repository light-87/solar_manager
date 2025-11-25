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
    2: 'Online Application',
    3: customerType === 'finance' ? 'Submit to Bank' : 'Skip',
    4: 'Bank Call Verification',
    5: customerType === 'finance' ? '1st Disbursement' : 'Payment Type',
    6: 'Material Supplier',
    7: 'Installation',
    8: 'File Completion',
    9: 'Print & Submit Online',
    10: 'MSEB Inspection',
    11: 'MSEB Meter Release',
    12: 'Meter Installation',
    13: 'Mail Bank',
    14: customerType === 'finance' ? 'Bank Inspection' : 'Skip',
    15: 'Final Disbursement',
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
