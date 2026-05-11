import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
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
    let nfts: Record<string, unknown> = {};

    if (mints.length > 0) {
      const { data: nftData } = await supabase.from('nfts').select('*').in('mint', mints);
      if (nftData) {
        nfts = Object.fromEntries(nftData.map((n) => [n.mint, n]));
      }
    }

    const enriched = (data || []).map((listing) => ({
      ...listing,
      nft: nfts[listing.mint] || null,
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
    const { data: activeAuction } = await supabase
      .from('auctions')
      .select('id')
      .eq('nft_mint', body.mint)
      .in('status', ['active', 'ended'])
      .limit(1)
      .maybeSingle();

    if (activeAuction) {
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

    // Log activity
    await supabase.from('activities').insert({
      type: 'cancel',
      nft_mint: body.mint,
      from_address: body.seller || '',
      to_address: '',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel listing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
