import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validatePin, validateWorkspaceCodeFormat } from '@/lib/env';

/**
 * First-time setup API route - Multi-Tenant Version
 *
 * Creates initial admin and employee accounts for a workspace
 * Only works if no users exist for the given workspace
 *
 * MULTI-TENANCY:
 * - Validates workspace code against database (workspaces table)
 * - Creates users scoped to the specific workspace
 */
export async function POST(request: Request) {
  try {
    const {
      workspaceCode,
      adminUsername,
      adminPin,
      employeeUsername,
      employeePin,
    } = await request.json();

    // Validate required fields
    if (!workspaceCode || !adminUsername || !adminPin || !employeeUsername || !employeePin) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate workspace code format
    if (!validateWorkspaceCodeFormat(workspaceCode)) {
      return NextResponse.json(
        { error: 'Invalid workspace code format' },
        { status: 400 }
      );
    }

    // Validate workspace exists in database and is active
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, code, name, is_active')
      .eq('code', workspaceCode)
      .limit(1);

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 500 });
    }

    if (!workspaces || workspaces.length === 0) {
      return NextResponse.json(
        { error: 'Invalid workspace code. Workspace not found.' },
        { status: 401 }
      );
    }

    const workspace = workspaces[0];

    if (!workspace.is_active) {
      return NextResponse.json(
        { error: 'This workspace is currently inactive.' },
        { status: 403 }
      );
    }

    // Validate PIN formats
    if (!validatePin(adminPin)) {
      return NextResponse.json(
        { error: 'Admin PIN must be exactly 5 digits' },
        { status: 400 }
      );
    }

    if (!validatePin(employeePin)) {
      return NextResponse.json(
        { error: 'Employee PIN must be exactly 5 digits' },
        { status: 400 }
      );
    }

    // Validate usernames are different
    if (adminUsername === employeeUsername) {
      return NextResponse.json(
        { error: 'Admin and employee usernames must be different' },
        { status: 400 }
      );
    }

    // Validate PINs are different
    if (adminPin === employeePin) {
      return NextResponse.json(
        { error: 'Admin and employee PINs must be different' },
        { status: 400 }
      );
    }

    // Check if users already exist for THIS workspace
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('workspace_id', workspaceCode)
      .limit(1);

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Setup already completed for this workspace. Users already exist.' },
        { status: 400 }
      );
    }

    // Check if usernames are already taken in THIS workspace
    const { data: usernameCheck, error: usernameError } = await supabase
      .from('users')
      .select('username')
      .eq('workspace_id', workspaceCode)
      .or(`username.eq.${adminUsername},username.eq.${employeeUsername}`);

    if (usernameError) {
      return NextResponse.json({ error: usernameError.message }, { status: 500 });
    }

    if (usernameCheck && usernameCheck.length > 0) {
      return NextResponse.json(
        { error: 'One or more usernames already taken in this workspace' },
        { status: 400 }
      );
    }

    // Create admin and employee users for this workspace
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          role: 'admin',
          username: adminUsername,
          pin: adminPin,
          workspace_id: workspaceCode,  // 🔐 Scope to workspace
        },
        {
          role: 'employee',
          username: employeeUsername,
          pin: employeePin,
          workspace_id: workspaceCode,  // 🔐 Scope to workspace
        },
      ]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Setup completed successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
