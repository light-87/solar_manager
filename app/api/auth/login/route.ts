import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validatePin, validateWorkspaceCodeFormat, getSuperAdminPin } from '@/lib/env';

/**
 * Login API Route - Multi-Tenant Workspace-based PIN Authentication
 *
 * SECURITY MODEL (Multi-Tenancy):
 * - Step 1: Validate workspace exists in database and is active
 * - Step 2: Query user scoped by BOTH username AND workspace_id
 * - Step 3: Verify PIN (user's PIN or super admin PIN)
 * - Step 4: Return workspace name for dynamic branding
 *
 * This prevents cross-tenant access: a user from Client A cannot
 * log into Client B even if they know the workspace code.
 *
 * Supports two authentication methods:
 * 1. Normal user login: workspace code + username + user's PIN
 * 2. Super admin login: workspace code + username + SUPER_ADMIN_PIN
 */
export async function POST(request: Request) {
  try {
    const { workspaceCode, username, pin } = await request.json();

    // Validate required fields
    if (!workspaceCode || !username || !pin) {
      return NextResponse.json(
        { error: 'Workspace code, username, and PIN are required' },
        { status: 400 }
      );
    }

    // Validate workspace code format (basic validation)
    if (!validateWorkspaceCodeFormat(workspaceCode)) {
      return NextResponse.json(
        { error: 'Invalid workspace code format' },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (!validatePin(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 5 digits' },
        { status: 400 }
      );
    }

    // ========================================================
    // STEP 1: Query workspaces table to validate workspace
    // ========================================================
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, code, name, is_active, settings')
      .eq('code', workspaceCode)
      .limit(1);

    if (workspaceError) {
      console.error('Workspace query error:', workspaceError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Check if workspace exists
    if (!workspaces || workspaces.length === 0) {
      return NextResponse.json(
        { error: 'Invalid workspace code' },
        { status: 401 }
      );
    }

    const workspace = workspaces[0];

    // Check if workspace is active
    if (!workspace.is_active) {
      return NextResponse.json(
        { error: 'This workspace is currently inactive. Please contact support.' },
        { status: 403 }
      );
    }

    // ========================================================
    // STEP 2: Query users table scoped by workspace_id
    // ========================================================
    // CRITICAL SECURITY: We query by BOTH username AND workspace_id
    // This prevents a user named "admin" in workspace A from logging
    // into workspace B, even if they know workspace B's code
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('workspace_id', workspaceCode)  // 🔐 Workspace isolation!
      .limit(1);

    if (userError) {
      console.error('User query error:', userError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username or workspace' },
        { status: 401 }
      );
    }

    const user = users[0];

    // ========================================================
    // STEP 3: Validate PIN (user PIN or super admin PIN)
    // ========================================================
    const isSuperAdmin = pin === getSuperAdminPin();
    const isValidUserPin = pin === user.pin;

    if (!isValidUserPin && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Log audit trail for super admin access
    if (isSuperAdmin) {
      await logAuditTrail({
        user_id: user.id,
        username: user.username,
        role: user.role,
        action: 'login',
        is_super_admin: true,
        workspace_id: workspaceCode,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });
    }

    // ========================================================
    // STEP 4: Return success with workspace info
    // ========================================================
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        username: user.username,
        workspace_id: user.workspace_id,
      },
      workspace: {
        code: workspace.code,
        name: workspace.name,  // 🎨 Frontend can display "Florida Solar Pros"
        settings: workspace.settings,
      },
      isSuperAdmin,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Log audit trail for super admin access
 */
async function logAuditTrail(data: {
  user_id: string;
  username: string;
  role: string;
  action: string;
  is_super_admin: boolean;
  workspace_id: string;
  ip_address: string;
  user_agent: string;
}) {
  try {
    await supabase.from('audit_log').insert(data);
  } catch (error) {
    console.error('Failed to log audit trail:', error);
    // Don't fail the login if audit logging fails
  }
}
