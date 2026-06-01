import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'accept' | 'reject' | 'cancel'

    if (!['accept', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get the offer
    const { data: offer, error: fetchError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (offer.status !== 'active') {
      return NextResponse.json({ error: 'Offer is no longer active' }, { status: 400 });
    }

    // Update offer status
    const newStatus = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'cancelled';
    const { error: updateError } = await supabase
      .from('offers')
      .update({ status: newStatus })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (action === 'accept') {
      // When accepting: create a sale activity
      const { data: nft } = await supabase
        .from('nfts')
        .select('*')
        .eq('mint', offer.nft_mint)
        .single();

      // Transfer ownership
      await supabase
        .from('nfts')
        .update({ owner: offer.bidder, listed: false, price: null })
        .eq('mint', offer.nft_mint);

      // Cancel any active listings for this NFT
      await supabase
        .from('listings')
        .update({ active: false })
        .eq('mint', offer.nft_mint)
        .eq('active', true);

      // Cancel other active offers for this NFT
      await supabase
        .from('offers')
        .update({ status: 'cancelled' })
        .eq('nft_mint', offer.nft_mint)
        .eq('status', 'active')
        .neq('id', id);

      // Log sale activity
      await supabase.from('activities').insert({
        type: 'sale',
        nft_mint: offer.nft_mint,
        nft_name: nft?.name || '',
        nft_image: nft?.image || '',
        from_address: nft?.owner || '',
        to_address: offer.bidder,
        price: offer.amount,
        chain: offer.chain || 'solana',
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update offer';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
