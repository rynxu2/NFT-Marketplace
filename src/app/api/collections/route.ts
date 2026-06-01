import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 30);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');
    const owner = searchParams.get('owner');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let query = supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Don't filter by chain here — we filter after checking NFTs
    if (owner) query = query.eq('owner', owner);
    if (category) query = query.eq('category', category);
    if (search) {
      const sanitized = search.replace(/[%_\\]/g, '');
      if (sanitized.length > 0) {
        query = query.ilike('name', `%${sanitized}%`);
      }
    }

    const forSale = searchParams.get('for_sale');
    if (forSale === 'true') query = query.eq('for_sale', true);

    const { data: collections, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!collections || collections.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Compute stats for each collection
    const collectionIds = collections.map((c) => c.id);

    const { data: nfts } = await supabase
      .from('nfts')
      .select('collection_id, listed, price, chain, owner')
      .in('collection_id', collectionIds);

    const statsMap: Record<string, { item_count: number; floor_price: number | null; listed_count: number; owner_count: number }> = {};
    // Track which chains each collection has NFTs on
    const collectionChains: Record<string, Set<string>> = {};
    // Track unique owners per collection
    const ownerSets: Record<string, Set<string>> = {};

    for (const id of collectionIds) {
      statsMap[id] = { item_count: 0, floor_price: null, listed_count: 0, owner_count: 0 };
      collectionChains[id] = new Set();
      ownerSets[id] = new Set();
    }

    if (nfts) {
      for (const nft of nfts) {
        if (nft.chain) collectionChains[nft.collection_id]?.add(nft.chain);

        // Track unique owners (across all chains)
        if (nft.owner && ownerSets[nft.collection_id]) {
          ownerSets[nft.collection_id].add(nft.owner);
        }

        // Only count stats for NFTs on the requested chain (or all if no chain filter)
        if (chain && nft.chain !== chain) continue;

        const s = statsMap[nft.collection_id];
        if (!s) continue;
        s.item_count++;
        if (nft.listed) {
          s.listed_count++;
          if (nft.price != null) {
            if (s.floor_price === null || nft.price < s.floor_price) {
              s.floor_price = nft.price;
            }
          }
        }
      }

      // Set owner_count from unique owners set
      for (const id of collectionIds) {
        if (statsMap[id]) {
          statsMap[id].owner_count = ownerSets[id]?.size || 0;
        }
      }
    }

    let data = collections.map((c) => ({
      ...c,
      stats: statsMap[c.id] || { item_count: 0, floor_price: null, listed_count: 0, owner_count: 0 },
    }));

    // Filter by chain: show collection if its own chain matches OR if it has NFTs on the requested chain
    if (chain) {
      data = data.filter((c) =>
        c.chain === chain || (collectionChains[c.id]?.has(chain))
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch collections';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const body = await request.json();

    if (!body.name || !body.owner) {
      return NextResponse.json(
        { error: 'Missing required fields: name, owner' },
        { status: 400 }
      );
    }

    if (auth && auth.wallet !== body.owner) {
      return NextResponse.json({ error: 'Wallet mismatch' }, { status: 403 });
    }

    const slug = generateSlug(body.name);

    const { data, error } = await supabase
      .from('collections')
      .insert({
        name: String(body.name).slice(0, 100),
        slug,
        description: String(body.description || '').slice(0, 1000),
        logo: body.logo || null,
        banner: body.banner || null,
        owner: body.owner,
        category: body.category || null,
        theme_color: body.theme_color || null,
        social_links: body.social_links || {},
        chain: body.chain || 'solana',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
