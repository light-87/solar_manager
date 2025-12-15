/**
 * API Client with Workspace Context
 *
 * CRITICAL SECURITY: This client automatically includes workspace_id
 * in all API requests to ensure proper multi-tenant isolation.
 */

/**
 * Make an authenticated API request with workspace context
 *
 * This wrapper automatically includes the X-Workspace-ID header
 * from the authenticated user's session.
 *
 * @param url - The API endpoint
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Get workspace_id from localStorage (where auth context stores it)
  const authData = localStorage.getItem('auth');
  let workspaceId: string | null = null;

  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      workspaceId = parsed.workspaceCode;
    } catch (e) {
      console.error('Failed to parse auth data:', e);
    }
  }

  // Add workspace header to all requests
  const headers = new Headers(options.headers);
  if (workspaceId) {
    headers.set('X-Workspace-ID', workspaceId);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
