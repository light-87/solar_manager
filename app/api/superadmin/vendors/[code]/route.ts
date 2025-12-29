/**
 * Super Admin - Single Vendor API
 * GET: Get vendor details with login history
 * PATCH: Enable/disable vendor
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
 * GET /api/superadmin/vendors/[code]
 * Get vendor details with login history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await params;

  try {
    // Get workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('code', code)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get customer count
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', code);

    // Get users for this workspace
    const { data: users } = await supabase
      .from('users')
      .select('id, username, role, created_at')
      .eq('workspace_id', code);

    // Get login history (last 50)
    const { data: loginHistory } = await supabase
      .from('audit_log')
      .select('username, role, created_at, ip_address')
      .eq('workspace_id', code)
      .eq('action', 'login')
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      vendor: {
        id: workspace.id,
        code: workspace.code,
        name: workspace.name,
        is_active: workspace.is_active,
        created_at: workspace.created_at,
        settings: workspace.settings,
      },
      stats: {
        customer_count: customerCount || 0,
        user_count: users?.length || 0,
      },
      users: users || [],
      login_history: loginHistory || [],
    });
  } catch (error) {
    console.error('Error in GET /api/superadmin/vendors/[code]:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/superadmin/vendors/[code]
 * Enable/disable vendor
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await params;

  try {
    const { is_active } = await request.json();

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('workspaces')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('code', code);

    if (error) {
      console.error('Error updating workspace:', error);
      return NextResponse.json(
        { error: 'Failed to update vendor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      is_active,
    });
  } catch (error) {
    console.error('Error in PATCH /api/superadmin/vendors/[code]:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
