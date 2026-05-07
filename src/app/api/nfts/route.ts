import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const creator = searchParams.get('creator');
    const collection = searchParams.get('collection');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase.from('nfts').select('*').order('created_at', { ascending: false }).limit(limit);

    if (owner) query = query.eq('owner', owner);
    if (creator) query = query.eq('creator', creator);
    if (collection) query = query.eq('collection', collection);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch NFTs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('nfts')
      .insert({
        mint: body.mint,
        name: body.name,
        symbol: body.symbol || 'CYBER',
        description: body.description || '',
        image: body.image,
        owner: body.owner,
        creator: body.creator,
        collection: body.collection || null,
        attributes: body.attributes || [],
        metadata_uri: body.metadata_uri || null,
        tx_signature: body.tx_signature || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create NFT';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
