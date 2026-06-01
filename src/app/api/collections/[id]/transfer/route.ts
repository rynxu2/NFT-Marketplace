import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    const body = await request.json();

    if (!body.new_owner) {
      return NextResponse.json(
        { error: 'new_owner is required' },
        { status: 400 }
      );
    }

    // Fetch existing collection to validate ownership
    const { data: existing, error: fetchError } = await supabase
      .from('collections')
      .select('owner')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Verify caller is the current owner
    const callerWallet = auth?.wallet || request.headers.get('x-wallet-address');
    if (callerWallet && callerWallet !== existing.owner) {
      return NextResponse.json({ error: 'Not authorized to transfer this collection' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('collections')
      .update({ owner: body.new_owner, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to transfer collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
