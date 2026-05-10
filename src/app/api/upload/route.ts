import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET = process.env.PINATA_SECRET || '';
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';

const CLOUDINARY_CONFIGURED = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Strategy: Cloudinary for CDN image → Pinata for on-chain metadata reference
    // If Cloudinary is configured, use it as primary (faster CDN, auto-optimize)
    // Fall back to Pinata if Cloudinary is not set up

    if (CLOUDINARY_CONFIGURED) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadToCloudinary(buffer, file.name);

      return NextResponse.json({
        hash: result.public_id,
        url: result.secure_url,
        provider: 'cloudinary',
        width: result.width,
        height: result.height,
      });
    }

    // Fallback: Pinata/IPFS
    if (!PINATA_API_KEY || !PINATA_SECRET) {
      return NextResponse.json(
        { error: 'No image hosting configured. Set CLOUDINARY or PINATA credentials.' },
        { status: 500 }
      );
    }

    const pinataForm = new FormData();
    pinataForm.append('file', file);
    pinataForm.append('pinataMetadata', JSON.stringify({ name: `nexus-nft-${Date.now()}` }));
    pinataForm.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET,
      },
      body: pinataForm,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Pinata upload failed: ${err?.error?.details || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      hash: data.IpfsHash,
      url: `${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
      provider: 'pinata',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
