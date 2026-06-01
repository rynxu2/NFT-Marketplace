import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');

    const { data, error } = await supabase
      .from('auctions')
      .select('*')
      .order('start_time', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with NFT data and bids
    const enriched = await Promise.all(
      (data || []).map(async (auction) => {
        const { data: nft } = await supabase
          .from('nfts')
          .select('*')
          .eq('mint', auction.nft_mint)
          .single();

        const { data: bids } = await supabase
          .from('bids')
          .select('*')
          .eq('auction_id', auction.id)
          .order('created_at', { ascending: false });

        return {
          ...auction,
          nft: nft || null,
          bids: bids || [],
        };
      })
    );

    // Chain filter — only return auctions whose NFT matches the chain
    const filtered = chain
      ? enriched.filter((a) => a.nft?.chain === chain)
      : enriched;

    return NextResponse.json({ data: filtered });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch auctions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Guard: check if NFT is currently listed for sale
    const { data: activeListing } = await supabase
      .from('listings')
      .select('id')
      .eq('mint', body.nft_mint)
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    if (activeListing) {
      return NextResponse.json(
        { error: 'NFT is currently listed for sale. Cancel the listing first.' },
        { status: 409 }
      );
    }

    // Guard: check if NFT already has an active auction
    const { data: activeAuctions } = await supabase
      .from('auctions')
      .select('id, end_time, highest_bidder, status')
      .eq('nft_mint', body.nft_mint)
      .in('status', ['active', 'ended']);

    const hasRealActiveAuction = (activeAuctions || []).some((auc) => {
      const isExpired = new Date(auc.end_time).getTime() <= Date.now();
      const hasBids = !!auc.highest_bidder;
      return !isExpired || hasBids;
    });

    if (hasRealActiveAuction) {
      return NextResponse.json(
        { error: 'NFT already has an active auction.' },
        { status: 409 }
      );
    }

    const endTime = new Date(Date.now() + (body.duration_minutes || 30) * 60_000).toISOString();

    const { data, error } = await supabase
      .from('auctions')
      .insert({
        nft_mint: body.nft_mint,
        seller: body.seller,
        starting_price: body.starting_price,
        current_bid: body.starting_price,
        min_bid_increment: body.min_bid_increment || 0.5,
        end_time: endTime,
        tx_signature: body.tx_signature || null,
        chain: body.chain || 'solana',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      type: 'auction_created',
      nft_mint: body.nft_mint,
      nft_name: body.nft_name || '',
      nft_image: body.nft_image || '',
      from_address: body.seller,
      price: body.starting_price,
      tx_signature: body.tx_signature || null,
      chain: body.chain || 'solana',
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create auction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
