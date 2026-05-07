import { NextRequest, NextResponse } from 'next/server';

const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET = process.env.PINATA_SECRET || '';
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';

export async function POST(request: NextRequest) {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET) {
      return NextResponse.json({ error: 'Pinata not configured' }, { status: 500 });
    }

    const metadata = await request.json();

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: { name: `${metadata.name || 'nft'}-metadata` },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Pinata metadata upload failed: ${err?.error?.details || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      hash: data.IpfsHash,
      url: `${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Metadata upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
