import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections | NEXUS NFT Marketplace',
  description: 'Browse curated NFT collections on NEXUS — the multi-chain NFT marketplace for Solana and Polygon.',
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
