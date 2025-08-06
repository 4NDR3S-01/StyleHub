import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Usar service role key para operaciones server-side
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json(
      { error: 'user_id is required' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', user_id)
      .eq('active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ payment_methods: data });

  } catch (error: any) {
    console.error('Error getting payment methods:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      type,
      provider,
      external_id,
      card_last_four,
      card_brand,
      card_exp_month,
      card_exp_year,
      paypal_email,
      nickname,
      is_default = false
    } = body;

    // Validaciones básicas
    if (!user_id || !type || !provider || !external_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Si es el método predeterminado, quitar default de otros métodos
    if (is_default) {
      await supabase
        .from('user_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user_id);
    }

    const { data, error } = await supabase
      .from('user_payment_methods')
      .insert({
        user_id,
        type,
        provider,
        external_id,
        card_last_four,
        card_brand,
        card_exp_month,
        card_exp_year,
        paypal_email,
        nickname,
        is_default,
        active: true
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ payment_method: data }, { status: 201 });

  } catch (error: any) {
    console.error('Error saving payment method:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const payment_method_id = searchParams.get('payment_method_id');
  const user_id = searchParams.get('user_id');

  if (!payment_method_id || !user_id) {
    return NextResponse.json(
      { error: 'payment_method_id and user_id are required' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('user_payment_methods')
      .update({ active: false })
      .eq('id', payment_method_id)
      .eq('user_id', user_id);

    if (error) throw error;

    return NextResponse.json({ message: 'Payment method deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { payment_method_id, user_id, is_default, nickname } = body;

    if (!payment_method_id || !user_id) {
      return NextResponse.json(
        { error: 'payment_method_id and user_id are required' },
        { status: 400 }
      );
    }

    // Si está estableciendo como predeterminado, quitar default de otros
    if (is_default) {
      await supabase
        .from('user_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user_id);
    }

    const updateData: any = {};
    if (typeof is_default === 'boolean') updateData.is_default = is_default;
    if (nickname !== undefined) updateData.nickname = nickname;

    const { data, error } = await supabase
      .from('user_payment_methods')
      .update(updateData)
      .eq('id', payment_method_id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ payment_method: data });

  } catch (error: any) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
