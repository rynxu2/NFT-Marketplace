import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nftMint = searchParams.get('nft_mint');
    const bidder = searchParams.get('bidder');

    let query = supabase
      .from('offers')
      .select('*')
      .eq('status', 'active')
      .order('amount', { ascending: false });

    if (nftMint) query = query.eq('nft_mint', nftMint);
    if (bidder) query = query.eq('bidder', bidder);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with NFT data
    const mints = [...new Set((data || []).map((o) => o.nft_mint))];
    let nfts: Record<string, unknown> = {};

    if (mints.length > 0) {
      const { data: nftData } = await supabase.from('nfts').select('*').in('mint', mints);
      if (nftData) {
        nfts = Object.fromEntries(nftData.map((n) => [n.mint, n]));
      }
    }

    const enriched = (data || []).map((offer) => ({
      ...offer,
      nft: nfts[offer.nft_mint] || null,
    }));

    return NextResponse.json({ data: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch offers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.nft_mint || !body.bidder || !body.amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if bidder already has an active offer on this NFT
    const { data: existing } = await supabase
      .from('offers')
      .select('id')
      .eq('nft_mint', body.nft_mint)
      .eq('bidder', body.bidder)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      // Update existing offer amount
      const { data, error } = await supabase
        .from('offers')
        .update({
          amount: body.amount,
          expires_at: body.expires_at,
          escrow_offer_id: body.escrow_offer_id,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    // Create new offer
    const { data, error } = await supabase
      .from('offers')
      .insert({
        nft_mint: body.nft_mint,
        bidder: body.bidder,
        amount: body.amount,
        chain: body.chain || 'solana',
        escrow_offer_id: body.escrow_offer_id || null,
        expires_at: body.expires_at || new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activities').insert({
      type: 'offer',
      nft_mint: body.nft_mint,
      nft_name: body.nft_name || '',
      nft_image: body.nft_image || '',
      from_address: body.bidder,
      price: body.amount,
      chain: body.chain || 'solana',
      tx_signature: body.tx_signature || null,
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create offer';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
