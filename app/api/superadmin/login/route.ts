/**
 * POST /api/superadmin/login
 * Authenticate superadmin with PIN from environment variable
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json(
        { error: 'PIN is required' },
        { status: 400 }
      );
    }

    const superAdminPin = process.env.SUPER_ADMIN_PIN;

    if (!superAdminPin) {
      console.error('SUPER_ADMIN_PIN not configured');
      return NextResponse.json(
        { error: 'Super admin not configured' },
        { status: 500 }
      );
    }

    if (pin !== superAdminPin) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Generate a simple session token
    const token = Buffer.from(`superadmin:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Error in superadmin login:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
