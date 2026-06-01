import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('active', true)
      .order('listed_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with NFT data
    const mints = (data || []).map((l) => l.mint);
    let nfts: Record<string, Record<string, unknown>> = {};

    if (mints.length > 0) {
      let nftQuery = supabase.from('nfts').select('*').in('mint', mints);
      // Chain filter on the NFT side
      if (chain) nftQuery = nftQuery.eq('chain', chain);

      const { data: nftData } = await nftQuery;
      if (nftData) {
        nfts = Object.fromEntries(nftData.map((n) => [n.mint, n]));
      }
    }

    // Only return listings whose NFT exists (and matches chain filter)
    const enriched = (data || [])
      .filter((listing) => nfts[listing.mint])
      .map((listing) => ({
        ...listing,
        nft: nfts[listing.mint],
      }));

    return NextResponse.json({ data: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch listings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Guard: check if NFT has an active auction
    const { data: activeAuctions } = await supabase
      .from('auctions')
      .select('id, end_time, highest_bidder, status')
      .eq('nft_mint', body.mint)
      .in('status', ['active', 'ended']);

    const hasRealActiveAuction = (activeAuctions || []).some((auc) => {
      const isExpired = new Date(auc.end_time).getTime() <= Date.now();
      const hasBids = !!auc.highest_bidder;
      return !isExpired || hasBids;
    });

    if (hasRealActiveAuction) {
      return NextResponse.json(
        { error: 'NFT has an active auction. Cancel or settle the auction first.' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('listings')
      .insert({
        mint: body.mint,
        seller: body.seller,
        price: body.price,
        tx_signature: body.tx_signature || null,
        chain: body.chain || 'solana',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update NFT listed status
    await supabase.from('nfts').update({ listed: true, price: body.price }).eq('mint', body.mint);

    // Log activity
    await supabase.from('activities').insert({
      type: 'listing',
      nft_mint: body.mint,
      nft_name: body.nft_name || '',
      nft_image: body.nft_image || '',
      from_address: body.seller,
      to_address: '',
      price: body.price,
      tx_signature: body.tx_signature || null,
      chain: body.chain || 'solana',
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create listing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const { error } = await supabase
      .from('listings')
      .update({ active: false })
      .eq('mint', body.mint)
      .eq('active', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update NFT listed status
    await supabase.from('nfts').update({ listed: false, price: null }).eq('mint', body.mint);

    // Fetch NFT to get rich details for logging
    const { data: nft } = await supabase
      .from('nfts')
      .select('chain, name, image, collection')
      .eq('mint', body.mint)
      .single();

    // Log activity
    await supabase.from('activities').insert({
      type: 'cancel',
      nft_mint: body.mint,
      nft_name: nft?.name || '',
      nft_image: nft?.image || '',
      from_address: body.seller || '',
      to_address: '',
      collection: nft?.collection || null,
      chain: nft?.chain || 'solana',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel listing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
