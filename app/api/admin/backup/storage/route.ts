/**
 * GET /api/admin/backup/storage
 * Get current total blob storage statistics
 */

import { NextResponse } from 'next/server';
import { getBlobStorageStats } from '@/lib/r2-storage';

export async function GET(request: Request) {
  try {
    const stats = await getBlobStorageStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage statistics' },
      { status: 500 }
    );
  }
}
