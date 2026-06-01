import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get current auction
    const { data: auction, error: fetchError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    if (auction.status !== 'active') {
      return NextResponse.json({ error: 'Auction is not active' }, { status: 400 });
    }

    // Validate bid amount
    const minBid = (auction.current_bid || auction.starting_price) + auction.min_bid_increment;
    if (body.amount < minBid) {
      return NextResponse.json(
        { error: `Bid must be at least ${minBid} SOL` },
        { status: 400 }
      );
    }

    // Insert bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        auction_id: id,
        bidder: body.bidder,
        amount: body.amount,
        tx_signature: body.tx_signature || null,
      })
      .select()
      .single();

    if (bidError) {
      return NextResponse.json({ error: bidError.message }, { status: 500 });
    }

    // Update auction current bid
    await supabase
      .from('auctions')
      .update({
        current_bid: body.amount,
        highest_bidder: body.bidder,
      })
      .eq('id', id);

    // Log activity
    await supabase.from('activities').insert({
      type: 'bid',
      nft_mint: auction.nft_mint,
      from_address: body.bidder,
      price: body.amount,
      tx_signature: body.tx_signature || null,
      chain: auction.chain || 'solana',
    });

    return NextResponse.json({ data: bid });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to place bid';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
