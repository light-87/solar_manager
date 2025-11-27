import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validatePin, validateWorkspaceCode, getSuperAdminPin } from '@/lib/env';

/**
 * Login API Route - Workspace-based PIN authentication
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

    // Validate workspace code
    if (!validateWorkspaceCode(workspaceCode)) {
      return NextResponse.json(
        { error: 'Invalid workspace code' },
        { status: 401 }
      );
    }

    // Validate PIN format
    if (!validatePin(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 5 digits' },
        { status: 400 }
      );
    }

    // Get user by username
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Check authentication: user PIN or super admin PIN
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
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        username: user.username,
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
