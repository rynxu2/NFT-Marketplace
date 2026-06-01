import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.mints || !Array.isArray(body.mints) || body.mints.length === 0) {
      return NextResponse.json(
        { error: 'mints array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Fetch collection for name and slug
    const { data: collection, error: fetchError } = await supabase
      .from('collections')
      .select('id, name, slug')
      .eq('id', id)
      .single();

    if (fetchError || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('nfts')
      .update({
        collection_id: collection.id,
        collection: collection.name,
        collection_slug: collection.slug,
      })
      .in('mint', body.mints)
      .select('mint');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { added: data?.length || 0 } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add NFTs to collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.mints || !Array.isArray(body.mints) || body.mints.length === 0) {
      return NextResponse.json(
        { error: 'mints array is required and must not be empty' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('nfts')
      .update({
        collection_id: null,
        collection: null,
        collection_slug: null,
      })
      .in('mint', body.mints)
      .eq('collection_id', id)
      .select('mint');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { removed: data?.length || 0 } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove NFTs from collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
