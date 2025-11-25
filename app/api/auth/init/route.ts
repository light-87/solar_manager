import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
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
        { error: 'Users already initialized' },
        { status: 400 }
      );
    }

    // Hash default PINs
    const adminPinHash = await bcrypt.hash('12345', 10);
    const employeePinHash = await bcrypt.hash('54321', 10);

    // Insert default users
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        { role: 'admin', pin_hash: adminPinHash },
        { role: 'employee', pin_hash: employeePinHash },
      ]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Users initialized successfully',
      defaultPins: {
        admin: '12345',
        employee: '54321',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
