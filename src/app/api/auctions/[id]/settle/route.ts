import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get auction
    const { data: auction, error: fetchError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    if (auction.seller !== body.seller) {
      return NextResponse.json({ error: 'Only the seller can settle' }, { status: 403 });
    }

    // Update auction status
    const { error: updateError } = await supabase
      .from('auctions')
      .update({ status: 'settled' })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log activity
    if (auction.highest_bidder) {
      await supabase.from('activities').insert({
        type: 'auction_settled',
        nft_mint: auction.nft_mint,
        from_address: auction.seller,
        to_address: auction.highest_bidder,
        price: auction.current_bid,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to settle auction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
