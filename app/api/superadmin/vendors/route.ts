/**
 * Super Admin - Vendors API
 * GET: List all vendors with stats
 * POST: Create new vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Verify superadmin token
function verifySuperAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-superadmin-token');
  if (!token) return false;

  try {
    const decoded = Buffer.from(token, 'base64').toString();
    return decoded.startsWith('superadmin:');
  } catch {
    return false;
  }
}

/**
 * GET /api/superadmin/vendors
 * List all vendors with customer count and last login
 */
export async function GET(request: NextRequest) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all workspaces
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (workspacesError) {
      console.error('Error fetching workspaces:', workspacesError);
      return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
    }

    // Get customer counts per workspace
    const { data: customerCounts, error: countError } = await supabase
      .from('customers')
      .select('workspace_id')
      .then(result => {
        if (result.error) return { data: null, error: result.error };

        const counts: Record<string, number> = {};
        result.data?.forEach(c => {
          counts[c.workspace_id] = (counts[c.workspace_id] || 0) + 1;
        });
        return { data: counts, error: null };
      });

    if (countError) {
      console.error('Error fetching customer counts:', countError);
    }

    // Get last login per workspace from audit_log
    const { data: lastLogins, error: loginError } = await supabase
      .from('audit_log')
      .select('workspace_id, created_at')
      .eq('action', 'login')
      .order('created_at', { ascending: false });

    const lastLoginMap: Record<string, string> = {};
    if (!loginError && lastLogins) {
      lastLogins.forEach(log => {
        if (log.workspace_id && !lastLoginMap[log.workspace_id]) {
          lastLoginMap[log.workspace_id] = log.created_at;
        }
      });
    }

    // Combine data
    const vendors = workspaces?.map(w => ({
      id: w.id,
      code: w.code,
      name: w.name,
      is_active: w.is_active,
      customer_count: customerCounts?.[w.code] || 0,
      last_login: lastLoginMap[w.code] || null,
      created_at: w.created_at,
    })) || [];

    return NextResponse.json({ vendors });
  } catch (error) {
    console.error('Error in GET /api/superadmin/vendors:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/superadmin/vendors
 * Create new vendor (workspace + admin user)
 */
export async function POST(request: NextRequest) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { company_name, company_code, admin_username, admin_pin } = await request.json();

    // Validate required fields
    if (!company_name || !company_code || !admin_username || !admin_pin) {
      return NextResponse.json(
        { error: 'All fields are required: company_name, company_code, admin_username, admin_pin' },
        { status: 400 }
      );
    }

    // Validate company code format (alphanumeric, no spaces)
    if (!/^[a-zA-Z0-9_-]+$/.test(company_code)) {
      return NextResponse.json(
        { error: 'Company code must be alphanumeric (letters, numbers, underscore, hyphen only)' },
        { status: 400 }
      );
    }

    // Check if workspace code already exists
    const { data: existing } = await supabase
      .from('workspaces')
      .select('code')
      .eq('code', company_code)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Company code already exists' },
        { status: 400 }
      );
    }

    // Create workspace
    const { error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        code: company_code,
        name: company_name,
        is_active: true,
        settings: {},
      });

    if (workspaceError) {
      console.error('Error creating workspace:', workspaceError);
      return NextResponse.json(
        { error: 'Failed to create workspace' },
        { status: 500 }
      );
    }

    // Create admin user for the workspace
    const { error: userError } = await supabase
      .from('users')
      .insert({
        username: admin_username,
        pin: admin_pin,
        role: 'admin',
        workspace_id: company_code,
      });

    if (userError) {
      console.error('Error creating admin user:', userError);
      // Rollback workspace creation
      await supabase.from('workspaces').delete().eq('code', company_code);
      return NextResponse.json(
        { error: 'Failed to create admin user: ' + userError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor: {
        code: company_code,
        name: company_name,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/superadmin/vendors:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
