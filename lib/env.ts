/**
 * Environment Variable Validation and Helpers
 *
 * This module provides utilities for validating and accessing environment variables
 * required for multi-deployment configuration.
 */

// Client-side environment variables (accessible in browser)
export function getWorkspaceCode(): string {
  const workspaceCode = process.env.NEXT_PUBLIC_WORKSPACE_CODE;

  if (!workspaceCode) {
    throw new Error(
      'Missing NEXT_PUBLIC_WORKSPACE_CODE environment variable. ' +
      'This is required for workspace-based authentication. ' +
      'Please set this in your .env.local file or deployment environment.'
    );
  }

  return workspaceCode;
}

export function getVendorName(): string {
  return process.env.NEXT_PUBLIC_VENDOR_NAME || 'Solar Sales Management';
}

// Server-side only environment variables (NOT accessible in browser)
export function getSuperAdminPin(): string {
  const superAdminPin = process.env.SUPER_ADMIN_PIN;

  if (!superAdminPin) {
    throw new Error(
      'Missing SUPER_ADMIN_PIN environment variable. ' +
      'This is required for super admin authentication. ' +
      'Please set this in your .env.local file or deployment environment.'
    );
  }

  // Validate PIN format (exactly 5 digits)
  if (!/^\d{5}$/.test(superAdminPin)) {
    throw new Error(
      'Invalid SUPER_ADMIN_PIN format. ' +
      'Must be exactly 5 digits (00000-99999).'
    );
  }

  return superAdminPin;
}

// Validation helpers
export function validatePin(pin: string): boolean {
  return /^\d{5}$/.test(pin);
}

export function validateWorkspaceCode(code: string): boolean {
  try {
    const expectedCode = getWorkspaceCode();
    return code === expectedCode;
  } catch {
    return false;
  }
}

// Check if running on server-side
export function isServer(): boolean {
  return typeof window === 'undefined';
}

// Validate all required environment variables at startup
export function validateEnvironment(serverSide: boolean = false): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Client-side variables
  try {
    getWorkspaceCode();
  } catch (error) {
    errors.push((error as Error).message);
  }

  // Server-side variables (only check on server)
  if (serverSide) {
    try {
      getSuperAdminPin();
    } catch (error) {
      errors.push((error as Error).message);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
