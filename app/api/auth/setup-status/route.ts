import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Check if first-time setup is needed
 * Returns true if no users exist in the database
 */
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      setupNeeded: !users || users.length === 0,
    });
  } catch (error) {
    console.error('Setup status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
