import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validatePin, validateWorkspaceCode } from '@/lib/env';

/**
 * First-time setup API route
 *
 * Creates initial admin and employee accounts
 * Only works if no users exist in the database
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

    // Validate workspace code
    if (!validateWorkspaceCode(workspaceCode)) {
      return NextResponse.json(
        { error: 'Invalid workspace code' },
        { status: 401 }
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

    // Check if users already exist
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Setup already completed. Users already exist.' },
        { status: 400 }
      );
    }

    // Check if usernames are already taken (shouldn't happen but check anyway)
    const { data: usernameCheck, error: usernameError } = await supabase
      .from('users')
      .select('username')
      .or(`username.eq.${adminUsername},username.eq.${employeeUsername}`);

    if (usernameError) {
      return NextResponse.json({ error: usernameError.message }, { status: 500 });
    }

    if (usernameCheck && usernameCheck.length > 0) {
      return NextResponse.json(
        { error: 'One or more usernames already taken' },
        { status: 400 }
      );
    }

    // Create admin and employee users
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          role: 'admin',
          username: adminUsername,
          pin: adminPin,
        },
        {
          role: 'employee',
          username: employeeUsername,
          pin: employeePin,
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
