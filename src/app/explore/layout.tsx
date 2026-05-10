import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore NFTs',
  description: 'Browse and discover unique digital collectibles on the NEXUS NFT Marketplace. Filter by category, price, and more.',
  openGraph: {
    title: 'Explore NFTs | NEXUS',
    description: 'Browse and discover unique digital collectibles on Solana.',
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
