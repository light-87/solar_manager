/**
 * GET /api/admin/backup/logs
 * Get recent backup activity logs
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireWorkspaceId } from '@/lib/workspace-auth';

export async function GET(request: Request) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    // Fetch recent backup logs for THIS workspace (last 50)
    const { data: logs, error } = await supabase
      .from('backup_logs')
      .select('*')
      .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
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
