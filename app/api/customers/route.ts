import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all customers with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const step = searchParams.get('step');

    let query = supabase
      .from('customers')
      .select('*')
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (step) {
      query = query.eq('current_step', parseInt(step));
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customers: data });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new customer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, address, type } = body;

    if (!name || !phone || !type) {
      return NextResponse.json(
        { error: 'Name, phone, and type are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          name,
          email,
          phone,
          address,
          type,
          status: 'active',
          current_step: 1,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Initialize step 1 data
    const { error: stepError } = await supabase
      .from('step_data')
      .insert([
        {
          customer_id: data.id,
          step_number: 1,
          data: {
            created_on: new Date().toISOString(),
          },
        },
      ]);

    if (stepError) {
      console.error('Step initialization error:', stepError);
    }

    return NextResponse.json({ customer: data }, { status: 201 });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
