import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireWorkspaceId } from '@/lib/workspace-auth';

// GET all steps for a customer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    const { id } = await params;
    const { data, error } = await supabase
      .from('step_data')
      .select('*')
      .eq('customer_id', id)
      .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
      .order('step_number', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ steps: data || [] });
  } catch (error) {
    console.error('Get steps error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST or UPDATE a step
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    const { id } = await params;
    const body = await request.json();
    const { step_number, data } = body;

    if (!step_number || !data) {
      return NextResponse.json(
        { error: 'Step number and data are required' },
        { status: 400 }
      );
    }

    // Check if step already exists
    const { data: existingStep } = await supabase
      .from('step_data')
      .select('*')
      .eq('customer_id', id)
      .eq('step_number', step_number)
      .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
      .single();

    let result;

    if (existingStep) {
      // Update existing step
      const { data: updatedData, error } = await supabase
        .from('step_data')
        .update({
          data,
          completed_at: new Date().toISOString()
        })
        .eq('customer_id', id)
        .eq('step_number', step_number)
        .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = updatedData;
    } else {
      // Create new step
      const { data: newData, error } = await supabase
        .from('step_data')
        .insert([
          {
            customer_id: id,
            step_number,
            data,
            workspace_id: workspaceId,  // 🔐 ASSIGN TO WORKSPACE!
            completed_at: new Date().toISOString()
          },
        ])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = newData;
    }

    return NextResponse.json({ step: result });
  } catch (error) {
    console.error('Save step error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
