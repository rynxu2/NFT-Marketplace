import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { buyer, tx_signature, chain, price } = body;

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer address is required' }, { status: 400 });
    }

    const { data: collection, error: fetchError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (!collection.for_sale) {
      return NextResponse.json({ error: 'Collection is not for sale' }, { status: 400 });
    }

    if (buyer === collection.owner) {
      return NextResponse.json({ error: 'Cannot buy your own collection' }, { status: 400 });
    }

    const { data: nfts } = await supabase
      .from('nfts')
      .select('mint')
      .eq('collection_id', id);

    const mints = nfts?.map((n) => n.mint) || [];

    if (mints.length > 0) {
      const { data: activeAuctions } = await supabase
        .from('auctions')
        .select('id')
        .in('nft_mint', mints)
        .eq('active', true)
        .limit(1);

      if (activeAuctions && activeAuctions.length > 0) {
        return NextResponse.json(
          { error: 'Cannot buy collection with active auctions' },
          { status: 400 }
        );
      }
    }

    const oldOwner = collection.owner;

    const { data: updatedCollection, error: updateError } = await supabase
      .from('collections')
      .update({
        owner: buyer,
        for_sale: false,
        sale_price: null,
        sale_tx: null,
        sale_listed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    let transferredNfts = 0;
    if (mints.length > 0) {
      const { data: updatedNfts } = await supabase
        .from('nfts')
        .update({ owner: buyer })
        .eq('collection_id', id)
        .select('mint');

      transferredNfts = updatedNfts?.length || 0;
    }

    let deactivatedListings = 0;
    if (mints.length > 0) {
      const { data: updatedListings } = await supabase
        .from('listings')
        .update({ active: false })
        .in('mint', mints)
        .eq('active', true)
        .select('id');

      deactivatedListings = updatedListings?.length || 0;
    }


    await supabase.from('activities').insert({
      type: 'collection_sale',
      from_address: oldOwner,
      to_address: buyer,
      price: price || collection.sale_price,
      tx_signature: tx_signature || null,
      collection: collection.name,
      chain: chain || collection.chain,
    });

    return NextResponse.json({
      data: updatedCollection,
      transferred_nfts: transferredNfts,
      deactivated_listings: deactivatedListings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to buy collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
