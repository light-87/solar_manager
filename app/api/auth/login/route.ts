import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { pin, role } = await request.json();

    if (!pin || !role) {
      return NextResponse.json(
        { error: 'PIN and role are required' },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (!/^\d{5}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 5 digits' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'admin' && role !== 'employee') {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Get user by role
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found. Please initialize the database first.' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, user.pin_hash);

    if (!isValidPin) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
