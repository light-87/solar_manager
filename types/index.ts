export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  role: UserRole;
  username: string;
  pin: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  username: string;
  role: string;
  action: string;
  is_super_admin: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export type CustomerType = 'finance' | 'cash';
export type CustomerStatus = 'active' | 'completed' | 'archived';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: CustomerType;
  status: CustomerStatus;
  current_step: number;
  kw_capacity?: number;
  quotation?: number;
  site_location?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface StepData {
  id: string;
  customer_id: string;
  step_number: number;
  data: Record<string, any>;
  completed_at?: string;
  updated_at: string;
}

// Step 1: Details & Documents
export interface Step1Data {
  // Pre-filled customer data (editable except name, email, phone)
  address?: string;
  site_location?: string;
  kw_capacity?: number;
  quotation?: number;
  commercial_domestic?: 'commercial' | 'domestic';
  // Document uploads
  aadhaar_card?: string; // File URL
  pan_card?: string; // File URL
  electric_bill?: string; // File URL
  bank_passbook?: string[]; // Array of file URLs (multiple)
}

// Step 2: Site Selection
export interface Step2Data {
  selected_site?: string; // Dynamic portal site names from workspace settings
  status: 'filled' | 'not_filled';
  completion_date?: string;
}

// Step 3: Online Application
export interface Step3Data {
  online_submitted: 'yes' | 'no';
  completion_date?: string;
  bank_name?: string; // For finance only
  branch_name?: string; // For finance only
  jan_samarth?: string; // File URL
  acknowledgment?: string; // File URL
}

// Step 4: Submit to Bank
export interface Step4Data {
  submitted_to_bank: 'yes' | 'no';
  completion_date?: string;
}

// Step 5: Bank Verification
export interface Step5Data {
  bank_verification: 'done' | 'no';
  completion_date?: string;
}

// Step 6: 1st Disbursement (Admin only for Cash)
export interface Step6Data {
  amount: number;
  remaining_amount?: number; // Calculated: quotation - amount
}

// Step 7: Materials List
export interface Step7Data {
  materials: {
    [key: string]: boolean; // Checklist items
  };
  completion_date?: string;
}

// Step 8: Installation
export interface Step8Data {
  structure: {
    status: 'done' | 'no';
    team_name?: string;
  };
  wiring: {
    status: 'done' | 'no';
    team_name?: string;
  };
  completion_date?: string;
}

// Equipment item interface
export interface EquipmentItem {
  serial_number: string;
  dcr_ndcr: 'dcr' | 'ndcr';
  maker: string;
  capacity: number;
  invoice_date: string;
}

// Step 9: Completion Details
export interface Step9Data {
  completion_file: 'complete' | 'no';
  completion_date?: string;
  panel: {
    count: number;
    items: EquipmentItem[];
  };
  inverter: {
    count: number;
    items: EquipmentItem[];
  };
  gps_photo?: string; // File URL
}

// Step 10: Document Uploads
export interface Step10Data {
  completion_file?: string; // File URL
  net_agreement?: string; // File URL
  model_agreement?: string; // File URL
  dcr_ndcr_certificate?: string; // File URL
  print_sign_upload_done: 'done' | 'no';
  completion_date?: string;
}

// Step 11: MSEB Inspection
export interface Step11Data {
  mseb_inspection: 'done' | 'no';
  inspector_name?: string;
  inspection_date?: string;
}

// Step 12: Meter Release
export interface Step12Data {
  meter_release_date?: string;
  upload_status: 'done' | 'not';
}

// Step 13: Meter Installation
export interface Step13Data {
  status: 'done' | 'no';
  installer_name?: string;
  installation_date?: string;
}

// Step 14: Mail Bank
export interface Step14Data {
  mail_sent: 'done' | 'no';
  completion_date?: string;
}

// Step 15: Bank Inspection
export interface Step15Data {
  inspector_name?: string;
  inspection_date?: string;
}

// Step 16: Final Disbursement (Admin only for Cash)
export interface Step16Data {
  amount: number;
  payment_date?: string;
}

export interface DashboardStats {
  total_active: number;
  total_completed: number;
  total_archived: number;
  by_step: Record<number, number>;
}
