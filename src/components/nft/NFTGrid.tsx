'use client';

import React from 'react';
import type { NFT } from '@/types/nft';
import NFTCard from './NFTCard';
import { NFTCardSkeleton } from '@/components/ui/Skeleton';

interface NFTGridProps {
  nfts: NFT[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function NFTGrid({ nfts, loading = false, emptyMessage = 'No NFTs found' }: NFTGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <NFTCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 border border-[var(--border-color)] flex items-center justify-center mb-4">
          <span className="text-2xl">∅</span>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {nfts.map((nft, index) => (
        <NFTCard key={nft.mint} nft={nft} index={index} />
      ))}
    </div>
  );
}
