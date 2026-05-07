import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const nftMint = searchParams.get('nft_mint');

    let query = supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) query = query.eq('type', type);
    if (nftMint) query = query.eq('nft_mint', nftMint);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch activities';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('activities')
      .insert({
        type: body.type,
        nft_mint: body.nft_mint || null,
        nft_name: body.nft_name || null,
        nft_image: body.nft_image || null,
        from_address: body.from_address || null,
        to_address: body.to_address || null,
        price: body.price || null,
        tx_signature: body.tx_signature || null,
        collection: body.collection || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to log activity';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
