import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create NFT',
  description: 'Mint your own NFT on the Solana blockchain. Upload artwork, set attributes, and join the NEXUS marketplace.',
  openGraph: {
    title: 'Create NFT | NEXUS',
    description: 'Mint your own NFT on Solana with NEXUS.',
  },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
