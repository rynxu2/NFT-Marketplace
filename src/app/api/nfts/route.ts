import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const creator = searchParams.get('creator');
    const collection = searchParams.get('collection');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let query = supabase.from('nfts').select('*').order('created_at', { ascending: false }).limit(limit);

    if (owner) query = query.eq('owner', owner);
    if (creator) query = query.eq('creator', creator);
    if (collection) query = query.eq('collection', collection);
    // Sanitize search input to prevent injection
    if (search) {
      const sanitized = search.replace(/[%_\\]/g, '');
      if (sanitized.length > 0) {
        query = query.or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

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
    // Verify wallet signature if auth headers are present
    const auth = await authenticateRequest(request);

    const body = await request.json();

    // Validate required fields
    if (!body.mint || !body.name || !body.image || !body.owner || !body.creator) {
      return NextResponse.json(
        { error: 'Missing required fields: mint, name, image, owner, creator' },
        { status: 400 }
      );
    }

    // If authenticated, verify the caller matches the owner/creator
    if (auth && auth.wallet !== body.owner && auth.wallet !== body.creator) {
      return NextResponse.json({ error: 'Wallet mismatch' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('nfts')
      .insert({
        mint: body.mint,
        name: String(body.name).slice(0, 100),
        symbol: String(body.symbol || 'CYBER').slice(0, 10),
        description: String(body.description || '').slice(0, 1000),
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { mint, owner, listed, price } = body;

    if (!mint) {
      return NextResponse.json({ error: 'mint is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (owner !== undefined) updates.owner = owner;
    if (listed !== undefined) updates.listed = listed;
    if (price !== undefined) updates.price = price;

    const { data, error } = await supabase
      .from('nfts')
      .update(updates)
      .eq('mint', mint)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update NFT';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
