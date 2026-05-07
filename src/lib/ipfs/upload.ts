// IPFS upload is now handled server-side via /api/upload routes
// This file only exports types and utility functions

export interface UploadResult {
  hash: string;
  url: string;
}

export interface NFTMetadataUpload {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string | number }[];
  properties?: {
    files: { uri: string; type: string }[];
    creators: { address: string; share: number }[];
  };
  collection?: {
    name: string;
    family?: string;
  };
}

const PINATA_GATEWAY = process.env.PINATA_GATEWAY || process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

export function getIPFSUrl(hash: string): string {
  return `${PINATA_GATEWAY}/ipfs/${hash}`;
}
