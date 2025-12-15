/**
 * GET /api/admin/backup/customers
 * List all completed customers ready for backup
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractDocumentUrls, calculateDocumentStorage } from '@/lib/r2-storage';
import { requireWorkspaceId } from '@/lib/workspace-auth';

export async function GET(request: Request) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    // Fetch all completed (non-archived) customers from THIS workspace
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('status', 'completed')
      .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
      .order('updated_at', { ascending: false });

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        customers: [],
        total_storage_bytes: 0,
        total_storage_mb: 0,
        total_customers: 0,
      });
    }

    // For each customer, get their step data and calculate storage
    const customersWithStorage = await Promise.all(
      customers.map(async (customer) => {
        // Fetch step data for this customer (within the same workspace)
        const { data: steps, error: stepsError } = await supabase
          .from('step_data')
          .select('*')
          .eq('customer_id', customer.id)
          .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
          .order('step_number', { ascending: true });

        if (stepsError || !steps) {
          console.error(`Error fetching steps for customer ${customer.id}:`, stepsError);
          return {
            ...customer,
            document_count: 0,
            storage_bytes: 0,
            storage_mb: 0,
          };
        }

        // Extract document URLs from steps
        const documentUrls = extractDocumentUrls(steps);

        // Calculate storage for these documents
        const storage = await calculateDocumentStorage(documentUrls);

        return {
          ...customer,
          document_count: storage.file_count,
          storage_bytes: storage.total_bytes,
          storage_mb: storage.total_mb,
          completed_at: customer.updated_at, // Use updated_at as completed timestamp
        };
      })
    );

    // Calculate totals
    const totalStorageBytes = customersWithStorage.reduce(
      (sum, c) => sum + c.storage_bytes,
      0
    );
    const totalStorageMb = parseFloat((totalStorageBytes / (1024 * 1024)).toFixed(2));

    return NextResponse.json({
      customers: customersWithStorage,
      total_storage_bytes: totalStorageBytes,
      total_storage_mb: totalStorageMb,
      total_customers: customersWithStorage.length,
    });
  } catch (error) {
    console.error('Error in backup customers endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backup customers' },
      { status: 500 }
    );
  }
}
