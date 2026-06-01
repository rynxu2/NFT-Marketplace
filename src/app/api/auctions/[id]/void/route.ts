import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const caller = body.caller;

    if (!caller) {
      return NextResponse.json({ error: 'Caller address required' }, { status: 400 });
    }

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

    // Only seller can void
    if (caller.toLowerCase() !== auction.seller.toLowerCase()) {
      return NextResponse.json(
        { error: 'Only the seller can void this auction' },
        { status: 403 }
      );
    }

    // 1. Update auction status to 'ended' and clear highest bidder
    const { error: updateError } = await supabase
      .from('auctions')
      .update({
        status: 'ended',
        highest_bidder: null,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 2. Reset NFT ownership back to seller and listed to false
    const { error: transferError } = await supabase
      .from('nfts')
      .update({
        owner: auction.seller,
        listed: false,
        price: null,
      })
      .eq('mint', auction.nft_mint);

    if (transferError) {
      console.error('NFT reset failed:', transferError.message);
    }

    // Fetch NFT to get rich details for logging
    const { data: nft } = await supabase
      .from('nfts')
      .select('name, image')
      .eq('mint', auction.nft_mint)
      .single();

    // 3. Log cancel activity
    await supabase.from('activities').insert({
      type: 'cancel',
      nft_mint: auction.nft_mint,
      nft_name: nft?.name || '',
      nft_image: nft?.image || '',
      from_address: auction.seller,
      to_address: '',
      price: auction.starting_price,
      chain: auction.chain || 'solana',
    });

    return NextResponse.json({
      success: true,
      nft_mint: auction.nft_mint,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to void auction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
