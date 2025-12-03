/**
 * GET /api/admin/backup/logs
 * Get recent backup activity logs
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Fetch recent backup logs (last 50)
    const { data: logs, error } = await supabase
      .from('backup_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching backup logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch backup logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: logs || [],
    });
  } catch (error) {
    console.error('Error in backup logs endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backup logs' },
      { status: 500 }
    );
  }
}
