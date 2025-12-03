/**
 * DELETE /api/admin/backup/cleanup/:id
 * Delete blob files for archived customer
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractDocumentUrls, deleteBlobFiles } from '@/lib/blob-utils';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const body = await request.json();
    const { userId, username } = body;

    if (!userId || !username) {
      return NextResponse.json(
        { error: 'User ID and username are required' },
        { status: 400 }
      );
    }

    // 1. Fetch customer and verify it's archived
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      console.error('Error fetching customer:', customerError);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (customer.status !== 'archived') {
      return NextResponse.json(
        { error: 'Can only cleanup archived customers. Please download backup first.' },
        { status: 400 }
      );
    }

    // 2. Fetch all step data
    const { data: steps, error: stepsError } = await supabase
      .from('step_data')
      .select('*')
      .eq('customer_id', customerId);

    if (stepsError) {
      console.error('Error fetching steps:', stepsError);
      return NextResponse.json(
        { error: 'Failed to fetch customer steps' },
        { status: 500 }
      );
    }

    // 3. Extract all document URLs
    const documentUrls = extractDocumentUrls(steps || []);

    if (documentUrls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No documents to delete',
        documents_deleted: 0,
        storage_freed_bytes: 0,
        storage_freed_mb: 0,
      });
    }

    // 4. Delete blob files
    const deleteResult = await deleteBlobFiles(documentUrls);

    // 5. Log the cleanup action
    const { error: logError } = await supabase
      .from('backup_logs')
      .insert({
        customer_id: customerId,
        customer_name: customer.name,
        performed_by: userId,
        performed_by_username: username,
        action_type: 'cleanup',
        storage_freed_bytes: deleteResult.total_size_freed,
        documents_deleted: deleteResult.deleted_count,
      });

    if (logError) {
      console.error('Error logging cleanup action:', logError);
      // Don't fail the request
    }

    // 6. Return success with stats
    return NextResponse.json({
      success: true,
      documents_deleted: deleteResult.deleted_count,
      documents_failed: deleteResult.failed_count,
      storage_freed_bytes: deleteResult.total_size_freed,
      storage_freed_mb: parseFloat(
        (deleteResult.total_size_freed / (1024 * 1024)).toFixed(2)
      ),
      failed_urls: deleteResult.failed_urls,
    });
  } catch (error) {
    console.error('Error in cleanup endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup storage' },
      { status: 500 }
    );
  }
}
