import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user');

    if (!user) {
      return NextResponse.json({ error: 'User address required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('nft_mint, created_at')
      .eq('user_address', user)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get NFT details for favorites
    const mints = (data || []).map((f) => f.nft_mint);
    let nfts: Record<string, unknown>[] = [];
    if (mints.length > 0) {
      const { data: nftData } = await supabase.from('nfts').select('*').in('mint', mints);
      nfts = nftData || [];
    }

    return NextResponse.json({ data: nfts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch favorites';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.user_address || !body.nft_mint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('favorites')
      .upsert(
        { user_address: body.user_address, nft_mint: body.nft_mint },
        { onConflict: 'user_address,nft_mint' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add favorite';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.user_address || !body.nft_mint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_address', body.user_address)
      .eq('nft_mint', body.nft_mint);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove favorite';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
