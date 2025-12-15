/**
 * GET /api/admin/backup/storage
 * Get current total blob storage statistics
 */

import { NextResponse } from 'next/server';
import { getBlobStorageStats } from '@/lib/r2-storage';
import { requireWorkspaceId } from '@/lib/workspace-auth';

export async function GET(request: Request) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    // Get storage stats filtered by workspace
    const stats = await getBlobStorageStats(workspaceId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage statistics' },
      { status: 500 }
    );
  }
}
