import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('auctions')
      .select('*')
      .in('status', ['active', 'ended'])
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

    return NextResponse.json({ data: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch auctions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const endTime = new Date(Date.now() + (body.duration_hours || 24) * 3600000).toISOString();

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
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create auction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
