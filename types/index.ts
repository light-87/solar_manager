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
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface StepData {
  id: string;
  customer_id: string;
  step_number: number;
  data: Record<string, any>;
  updated_at: string;
}

// Step 1: Details & Documents
export interface Step1Data {
  aadhaar_card?: string; // File URL
  electricity_bill?: string; // File URL
  ration_card?: string; // File URL
  other_documents?: string[]; // Array of file URLs
  created_on: string;
}

// Step 2: Online Application
export interface Step2Data {
  status: 'filled' | 'pending';
  updated_on: string;
}

// Step 3: Submit to Bank (Finance only)
export interface Step3Data {
  bank_name: string;
  status: 'submitted' | 'not_submitted';
  updated_on: string;
}

// Step 4: Bank Call Verification (Finance only)
export interface Step4Data {
  status: 'done' | 'pending';
  updated_on: string;
}

// Step 5: 1st Disbursement / Payment (Finance) or Payment Type (Cash)
export interface Step5DataFinance {
  amount_received: number;
  updated_on: string;
}

export interface Step5DataCash {
  payment_type: 'advance' | 'full';
  amount: number;
  updated_on: string;
}

// Step 6: Material Supplier
export interface Step6Data {
  solar_panels: boolean;
  inverter: boolean;
  mounting_structure: boolean;
  wiring_cables: boolean;
  junction_box: boolean;
  battery: boolean;
  other_materials: boolean;
  updated_on: string;
}

// Step 7: Installation
export interface Step7Data {
  structure_installation: boolean;
  wiring_installation: boolean;
  updated_on: string;
}

// Step 8: File Completion
export interface Step8Data {
  installation_photos?: string[]; // Array of file URLs
  system_photos?: string[]; // Array of file URLs
  barcode_number: string;
  meter_number: string;
  inverter_number: string;
  panel_number: string;
  system_kw_capacity: number;
  status: 'ready' | 'not_ready';
  updated_on: string;
}

// Step 9: Print & Submit Online
export interface Step9Data {
  status: 'done' | 'not_done';
  updated_on: string;
}

// Step 10: MSEB Inspection
export interface Step10Data {
  status: 'done' | 'pending';
  updated_on: string;
}

// Step 11: MSEB Meter Release
export interface Step11Data {
  status: 'done' | 'no';
  updated_on: string;
}

// Step 12: Meter Installation
export interface Step12Data {
  status: 'done' | 'no';
  updated_on: string;
}

// Step 13: Mail Bank (Finance only)
export interface Step13Data {
  status: 'done' | 'no';
  updated_on: string;
}

// Step 14: Bank Inspection (Finance only)
export interface Step14Data {
  status: 'done' | 'no';
  updated_on: string;
}

// Step 15: Final Disbursement (Finance) or Final Payment (Cash)
export interface Step15DataFinance {
  amount_received: number;
  status: 'done' | 'no';
  updated_on: string;
}

export interface Step15DataCash {
  amount?: number;
  status: 'done' | 'no';
  updated_on: string;
  auto_completed?: boolean; // Set if full payment was made in Step 5
}

export interface DashboardStats {
  total_active: number;
  total_completed: number;
  total_archived: number;
  by_step: Record<number, number>;
}
