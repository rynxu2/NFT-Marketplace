import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 30);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');

    let query = supabase.from('collections').select('*');

    if (UUID_REGEX.test(id)) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data: collection, error } = await query.single();

    if (error || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Fetch all NFTs in this collection (with chain info)
    const { data: nfts } = await supabase
      .from('nfts')
      .select('mint, listed, price, chain, owner')
      .eq('collection_id', collection.id);

    let item_count = 0;
    let floor_price: number | null = null;
    let listed_count = 0;
    const uniqueOwners = new Set<string>();

    if (nfts) {
      for (const nft of nfts) {
        // Track unique owners across all chains
        if (nft.owner) uniqueOwners.add(nft.owner);
        // Only count stats for NFTs on the requested chain (or all if no chain filter)
        if (chain && nft.chain !== chain) continue;

        item_count++;
        if (nft.listed) {
          listed_count++;
          if (nft.price != null) {
            if (floor_price === null || nft.price < floor_price) {
              floor_price = nft.price;
            }
          }
        }
      }
    }

    // Compute volume from sale activities (chain-filtered)
    let volume = 0;
    if (nfts && nfts.length > 0) {
      const filteredMints = chain
        ? nfts.filter((n) => n.chain === chain).map((n) => n.mint)
        : nfts.map((n) => n.mint);

      if (filteredMints.length > 0) {
        const { data: sales } = await supabase
          .from('activities')
          .select('price')
          .eq('type', 'sale')
          .in('nft_mint', filteredMints);

        if (sales) {
          volume = sales.reduce((sum, s) => sum + (s.price || 0), 0);
        }
      }
    }

    const data = {
      ...collection,
      stats: { item_count, floor_price, listed_count, volume, owner_count: uniqueOwners.size },
    };

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    const body = await request.json();

    // Fetch existing collection
    const { data: existing, error: fetchError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Validate owner
    const callerWallet = auth?.wallet || request.headers.get('x-wallet-address') || body.owner;
    if (callerWallet && callerWallet !== existing.owner) {
      return NextResponse.json({ error: 'Not authorized to update this collection' }, { status: 403 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      updates.name = String(body.name).slice(0, 100);
      updates.slug = generateSlug(body.name);
    }
    if (body.description !== undefined) updates.description = String(body.description).slice(0, 1000);
    if (body.logo !== undefined) updates.logo = body.logo;
    if (body.banner !== undefined) updates.banner = body.banner;
    if (body.category !== undefined) updates.category = body.category;
    if (body.theme_color !== undefined) updates.theme_color = body.theme_color;
    if (body.social_links !== undefined) updates.social_links = body.social_links;
    if (body.featured_nfts !== undefined) updates.featured_nfts = body.featured_nfts;
    if (body.settings !== undefined) updates.settings = body.settings;
    if (body.for_sale !== undefined) updates.for_sale = body.for_sale;
    if (body.sale_price !== undefined) updates.sale_price = body.sale_price;
    if (body.sale_currency !== undefined) updates.sale_currency = body.sale_currency;
    if (body.sale_tx !== undefined) updates.sale_tx = body.sale_tx;
    if (body.sale_listed_at !== undefined) updates.sale_listed_at = body.sale_listed_at;

    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Disassociate NFTs from this collection
    await supabase
      .from('nfts')
      .update({ collection_id: null, collection: null, collection_slug: null })
      .eq('collection_id', id);

    // Delete the collection
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
