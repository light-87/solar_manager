import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validatePin } from '@/lib/env';

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
    const { action, userId, currentPin, newUsername, newPin, targetUserId } = await request.json();

    // Validate required fields
    if (!action || !userId || !currentPin) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current user to verify they exist and check their role
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
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
        return await changeUsername(userId, newUsername);

      case 'change-own-pin':
        return await changePIN(userId, newPin);

      case 'change-employee-username':
        if (currentUser.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can change employee usernames' },
            { status: 403 }
          );
        }
        return await changeUsername(targetUserId, newUsername);

      case 'change-employee-pin':
        if (currentUser.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can change employee PINs' },
            { status: 403 }
          );
        }
        return await changePIN(targetUserId, newPin);

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
async function changeUsername(userId: string, newUsername: string) {
  if (!newUsername || !newUsername.trim()) {
    return NextResponse.json(
      { error: 'New username is required' },
      { status: 400 }
    );
  }

  // Check if username already exists
  const { data: existingUsers, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('username', newUsername)
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

  // Update username
  const { error: updateError } = await supabase
    .from('users')
    .update({ username: newUsername })
    .eq('id', userId);

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
async function changePIN(userId: string, newPin: string) {
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

  // Update PIN
  const { error: updateError } = await supabase
    .from('users')
    .update({ pin: newPin })
    .eq('id', userId);

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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user to verify they're admin
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
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

    // Get employee info
    const { data: employees, error: employeeError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('role', 'employee')
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
