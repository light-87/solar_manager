import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { role, currentPin, newPin } = await request.json();

    if (!role || !currentPin || !newPin) {
      return NextResponse.json(
        { error: 'Role, current PIN, and new PIN are required' },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (!/^\d{5}$/.test(currentPin) || !/^\d{5}$/.test(newPin)) {
      return NextResponse.json(
        { error: 'PINs must be 5 digits' },
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
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Verify current PIN
    const isValidPin = await bcrypt.compare(currentPin, user.pin_hash);

    if (!isValidPin) {
      return NextResponse.json(
        { error: 'Current PIN is incorrect' },
        { status: 401 }
      );
    }

    // Hash new PIN
    const newPinHash = await bcrypt.hash(newPin, 10);

    // Update PIN
    const { error: updateError } = await supabase
      .from('users')
      .update({ pin_hash: newPinHash })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'PIN changed successfully',
    });
  } catch (error) {
    console.error('Change PIN error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
