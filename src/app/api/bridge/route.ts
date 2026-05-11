import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nftMint = searchParams.get('nft_mint');

    if (!nftMint) {
      return NextResponse.json({ error: 'nft_mint required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('bridge_transactions')
      .select('*')
      .eq('nft_mint', nftMint)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch bridge history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { nft_mint, source_chain, dest_chain, source_tx, dest_tx, initiated_by } = body;

    if (!nft_mint || !source_chain || !dest_chain || !initiated_by) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create bridge transaction record
    const { data: bridgeTx, error: bridgeError } = await supabase
      .from('bridge_transactions')
      .insert({
        nft_mint,
        source_chain,
        dest_chain,
        source_tx: source_tx || null,
        dest_tx: dest_tx || null,
        status: 'pending',
        initiated_by,
      })
      .select()
      .single();

    if (bridgeError) {
      return NextResponse.json({ error: bridgeError.message }, { status: 500 });
    }

    // 2. Update NFT chain in database
    const { error: updateError } = await supabase
      .from('nfts')
      .update({
        chain: dest_chain,
        bridge_origin: source_chain,
      })
      .eq('mint', nft_mint);

    if (updateError) {
      // Rollback bridge tx status
      await supabase
        .from('bridge_transactions')
        .update({ status: 'failed' })
        .eq('id', bridgeTx.id);

      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 3. Mark bridge as completed
    await supabase
      .from('bridge_transactions')
      .update({ status: 'completed', dest_tx: dest_tx || `bridge_${Date.now()}` })
      .eq('id', bridgeTx.id);

    // 4. Log activity
    await supabase.from('activities').insert({
      type: 'bridge',
      nft_mint,
      from_address: initiated_by,
      to_address: initiated_by,
      price: 0,
      tx_signature: `bridge_${source_chain}_to_${dest_chain}_${Date.now()}`,
    });

    return NextResponse.json({ data: bridgeTx, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bridge failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
