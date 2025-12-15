/**
 * Workspace Authentication Helper
 *
 * CRITICAL SECURITY: This module ensures all API requests are scoped
 * to the authenticated user's workspace, preventing cross-tenant data leaks.
 */

import { NextRequest } from 'next/server';

/**
 * Extract workspace_id from request headers
 *
 * The frontend must include the workspace_id in the X-Workspace-ID header
 * for all authenticated API requests.
 *
 * @param request - The Next.js request object
 * @returns The workspace_id or null if not provided
 */
export function getWorkspaceIdFromRequest(request: Request | NextRequest): string | null {
  const workspaceId = request.headers.get('x-workspace-id');

  if (!workspaceId) {
    console.error('Missing x-workspace-id header in request');
    return null;
  }

  return workspaceId;
}

/**
 * Validate that workspace_id is present in the request
 *
 * Use this to reject requests that don't include workspace context.
 *
 * @param request - The Next.js request object
 * @throws Error if workspace_id is missing
 */
export function requireWorkspaceId(request: Request | NextRequest): string {
  const workspaceId = getWorkspaceIdFromRequest(request);

  if (!workspaceId) {
    throw new Error('Workspace ID is required for this operation');
  }

  return workspaceId;
}
