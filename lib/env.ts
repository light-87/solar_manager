/**
 * Environment Variable Validation and Helpers
 *
 * This module provides utilities for validating and accessing environment variables.
 *
 * MULTI-TENANCY UPDATE:
 * - Workspace codes are now validated against the database (workspaces table)
 * - No longer requires NEXT_PUBLIC_WORKSPACE_CODE environment variable
 * - Each client/workspace is managed dynamically via the database
 * - Vendor names come from workspace.name in database, not environment
 */

/**
 * Get vendor name for display
 *
 * NOTE: In multi-tenant mode, this is just a default fallback.
 * The actual workspace name comes from the database after login.
 */
export function getVendorName(): string {
  return 'Solar Sales Management';
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

/**
 * Validates workspace code format
 *
 * This is a basic format validation only. The actual workspace existence
 * and active status is validated against the database during login.
 *
 * Format rules:
 * - Must be alphanumeric with hyphens allowed
 * - No spaces or special characters
 * - Minimum 2 characters
 */
export function validateWorkspaceCodeFormat(code: string): boolean {
  if (!code || code.length < 2) {
    return false;
  }

  // Allow alphanumeric characters and hyphens, no spaces
  return /^[A-Z0-9-]+$/i.test(code);
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
