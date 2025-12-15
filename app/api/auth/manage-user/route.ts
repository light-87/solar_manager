import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validatePin } from '@/lib/env';
import { requireWorkspaceId } from '@/lib/workspace-auth';

/**
 * Manage User API - Handle username and PIN changes
 *
 * Supports:
 * - Change own username
 * - Change own PIN
 * - Change employee username (admin only)
 * - Change employee PIN (admin only)
 */
export async function POST(request: Request) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    const { action, userId, currentPin, newUsername, newPin, targetUserId } = await request.json();

    // Validate required fields
    if (!action || !userId || !currentPin) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current user to verify they exist and check their role (scoped to workspace)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
      .limit(1);

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentUser = users[0];

    // Verify current PIN
    if (currentUser.pin !== currentPin) {
      return NextResponse.json(
        { error: 'Invalid current PIN' },
        { status: 401 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'change-own-username':
        return await changeUsername(userId, newUsername, workspaceId);

      case 'change-own-pin':
        return await changePIN(userId, newPin, workspaceId);

      case 'change-employee-username':
        if (currentUser.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can change employee usernames' },
            { status: 403 }
          );
        }
        return await changeUsername(targetUserId, newUsername, workspaceId);

      case 'change-employee-pin':
        if (currentUser.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can change employee PINs' },
            { status: 403 }
          );
        }
        return await changePIN(targetUserId, newPin, workspaceId);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Manage user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Change username for a user
 */
async function changeUsername(userId: string, newUsername: string, workspaceId: string) {
  if (!newUsername || !newUsername.trim()) {
    return NextResponse.json(
      { error: 'New username is required' },
      { status: 400 }
    );
  }

  // Check if username already exists IN THIS WORKSPACE
  const { data: existingUsers, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('username', newUsername)
    .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
    .neq('id', userId);

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  if (existingUsers && existingUsers.length > 0) {
    return NextResponse.json(
      { error: 'Username already taken' },
      { status: 400 }
    );
  }

  // Update username (with workspace check for safety)
  const { error: updateError } = await supabase
    .from('users')
    .update({ username: newUsername })
    .eq('id', userId)
    .eq('workspace_id', workspaceId);  // 🔐 WORKSPACE ISOLATION!

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Username updated successfully',
  });
}

/**
 * Change PIN for a user
 */
async function changePIN(userId: string, newPin: string, workspaceId: string) {
  if (!newPin) {
    return NextResponse.json(
      { error: 'New PIN is required' },
      { status: 400 }
    );
  }

  // Validate PIN format
  if (!validatePin(newPin)) {
    return NextResponse.json(
      { error: 'PIN must be exactly 5 digits' },
      { status: 400 }
    );
  }

  // Update PIN (with workspace check for safety)
  const { error: updateError } = await supabase
    .from('users')
    .update({ pin: newPin })
    .eq('id', userId)
    .eq('workspace_id', workspaceId);  // 🔐 WORKSPACE ISOLATION!

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'PIN updated successfully',
  });
}

/**
 * GET endpoint to fetch employee info (admin only)
 */
export async function GET(request: Request) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user to verify they're admin (scoped to workspace)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
      .limit(1);

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!users || users.length === 0 || users[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get employee info from THIS WORKSPACE ONLY
    const { data: employees, error: employeeError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('role', 'employee')
      .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
      .limit(1);

    if (employeeError) {
      return NextResponse.json({ error: employeeError.message }, { status: 500 });
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { error: 'No employee found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: employees[0],
    });
  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
