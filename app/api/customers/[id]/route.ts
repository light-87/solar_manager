import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireWorkspaceId } from '@/lib/workspace-auth';

// GET single customer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    const { id } = await params;
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer: data });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update customer
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, address, status, current_step, notes, kw_capacity, quotation, site_location } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (status !== undefined) updates.status = status;
    if (current_step !== undefined) updates.current_step = current_step;
    if (notes !== undefined) updates.notes = notes;
    if (kw_capacity !== undefined) updates.kw_capacity = kw_capacity ? parseFloat(kw_capacity) : null;
    if (quotation !== undefined) updates.quotation = quotation ? parseFloat(quotation) : null;
    if (site_location !== undefined) updates.site_location = site_location;

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspaceId)  // 🔐 WORKSPACE ISOLATION!
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customer: data });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE customer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 CRITICAL SECURITY: Get workspace_id from request header
    const workspaceId = requireWorkspaceId(request);

    const { id } = await params;
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId);  // 🔐 WORKSPACE ISOLATION!

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
