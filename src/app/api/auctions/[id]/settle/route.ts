import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const caller = body.seller || body.caller;

    // Get auction
    const { data: auction, error: fetchError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    // Already settled
    if (auction.status === 'settled') {
      return NextResponse.json({ error: 'Auction already settled' }, { status: 400 });
    }

    // Authorization: seller OR winner can settle
    const isSeller = caller === auction.seller;
    const isWinner = caller === auction.highest_bidder;

    if (!isSeller && !isWinner) {
      return NextResponse.json(
        { error: 'Only the seller or winner can settle' },
        { status: 403 }
      );
    }

    if (!auction.highest_bidder) {
      return NextResponse.json({ error: 'No bids to settle' }, { status: 400 });
    }

    // Check auction has ended
    const endTime = new Date(auction.end_time).getTime();
    if (endTime > Date.now()) {
      return NextResponse.json({ error: 'Auction has not ended yet' }, { status: 400 });
    }

    // 1. Update auction status
    const { error: updateError } = await supabase
      .from('auctions')
      .update({ status: 'settled' })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 2. Transfer NFT ownership to winner
    const { error: transferError } = await supabase
      .from('nfts')
      .update({
        owner: auction.highest_bidder,
        listed: false,
        price: null,
      })
      .eq('mint', auction.nft_mint);

    if (transferError) {
      console.error('NFT transfer failed:', transferError.message);
    }

    // 3. Log settlement activity
    await supabase.from('activities').insert({
      type: 'auction_settled',
      nft_mint: auction.nft_mint,
      from_address: auction.seller,
      to_address: auction.highest_bidder,
      price: auction.current_bid,
      chain: auction.chain || 'solana',
    });

    // 4. Log auction_won activity for the winner
    await supabase.from('activities').insert({
      type: 'auction_won',
      nft_mint: auction.nft_mint,
      from_address: auction.highest_bidder,
      to_address: auction.highest_bidder,
      price: auction.current_bid,
      chain: auction.chain || 'solana',
    });

    return NextResponse.json({
      success: true,
      winner: auction.highest_bidder,
      nft_mint: auction.nft_mint,
      final_price: auction.current_bid,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to settle auction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
