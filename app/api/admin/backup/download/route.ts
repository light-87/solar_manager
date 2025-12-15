/**
 * POST /api/admin/backup/download
 * Generate and download ZIP backup for a customer
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createCustomerBackupZip, generateBackupFilename } from '@/lib/backup-utils';
import { requireWorkspaceId } from '@/lib/workspace-auth';

export async function POST(request: Request) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    const body = await request.json();
    const { customerId, userId, username } = body;

    if (!customerId || !userId || !username) {
      return NextResponse.json(
        { error: 'Customer ID, user ID, and username are required' },
        { status: 400 }
      );
    }

    // 1. Fetch customer data (scoped to workspace)
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
      .single();

    if (customerError || !customer) {
      console.error('Error fetching customer:', customerError);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify customer is completed (not already archived)
    if (customer.status !== 'completed') {
      return NextResponse.json(
        { error: 'Customer must be in completed status to backup' },
        { status: 400 }
      );
    }

    // 2. Fetch all step data (scoped to workspace)
    const { data: steps, error: stepsError } = await supabase
      .from('step_data')
      .select('*')
      .eq('customer_id', customerId)
      .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
      .order('step_number', { ascending: true });

    if (stepsError) {
      console.error('Error fetching steps:', stepsError);
      return NextResponse.json(
        { error: 'Failed to fetch customer steps' },
        { status: 500 }
      );
    }

    // 3. Mark customer as archived (BEFORE creating backup to prevent re-download)
    const { error: updateError } = await supabase
      .from('customers')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', customerId)
      .eq('workspace_id', workspaceId);  // 🔐 WORKSPACE ISOLATION!

    if (updateError) {
      console.error('Error updating customer status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update customer status' },
        { status: 500 }
      );
    }

    // 4. Create backup ZIP
    const zipBlob = await createCustomerBackupZip(customer, steps || [], username);

    // 5. Log the backup action
    const { error: logError } = await supabase
      .from('backup_logs')
      .insert({
        customer_id: customerId,
        customer_name: customer.name,
        performed_by: userId,
        performed_by_username: username,
        action_type: 'download',
        storage_freed_bytes: 0,
        documents_deleted: 0,
        workspace_id: workspaceId,  // 🔐 ASSIGN TO WORKSPACE!
      });

    if (logError) {
      console.error('Error logging backup action:', logError);
      // Don't fail the request, just log the error
    }

    // 6. Generate filename and return ZIP
    const filename = generateBackupFilename(customer.name);

    // Convert blob to buffer
    const arrayBuffer = await zipBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return the ZIP file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error in backup download endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}
