/**
 * GET /api/download?key={r2Key}
 * Proxy endpoint to download files from R2 (bypasses CORS)
 *
 * Use this as a fallback if CORS configuration on R2 is not working
 */

import { NextResponse } from 'next/server';
import { downloadFile } from '@/lib/r2-storage';
import { requireWorkspaceId } from '@/lib/workspace-auth';

export async function GET(request: Request) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing key parameter' },
        { status: 400 }
      );
    }

    // Validate the key belongs to this workspace
    // Key format: {workspaceId}/{customerId}/{category}/{timestamp}_{filename}
    const keyParts = key.split('/');
    if (keyParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid key format' },
        { status: 400 }
      );
    }

    const keyWorkspaceId = keyParts[0];
    if (keyWorkspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Access denied: File does not belong to your workspace' },
        { status: 403 }
      );
    }

    // Download from R2 server-side (no CORS issues)
    const fileData = await downloadFile(key);

    if (!fileData) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Return file with proper headers
    return new NextResponse(fileData.buffer, {
      headers: {
        'Content-Type': fileData.contentType,
        'Content-Disposition': `attachment; filename="${fileData.filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
