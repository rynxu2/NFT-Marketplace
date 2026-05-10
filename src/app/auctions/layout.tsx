import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auctions',
  description: 'Bid on live NFT auctions on the NEXUS marketplace. Place bids, track countdowns, and win unique digital collectibles.',
  openGraph: {
    title: 'NFT Auctions | NEXUS',
    description: 'Live NFT auctions on Solana. Bid and win!',
  },
};

export default function AuctionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
