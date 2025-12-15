import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireWorkspaceId } from '@/lib/workspace-auth';

export async function GET(request: Request) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'finance' or 'cash'

    let query = supabase
      .from('customers')
      .select('status, current_step')
      .eq('workspace_id', workspaceId);  // 🔐 WORKSPACE ISOLATION!

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error} = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stats = {
      total_active: 0,
      total_completed: 0,
      total_archived: 0,
      by_step: {} as Record<number, number>,
    };

    data?.forEach((customer) => {
      if (customer.status === 'active') {
        stats.total_active++;
        stats.by_step[customer.current_step] =
          (stats.by_step[customer.current_step] || 0) + 1;
      } else if (customer.status === 'completed') {
        stats.total_completed++;
      } else if (customer.status === 'archived') {
        stats.total_archived++;
      }
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
