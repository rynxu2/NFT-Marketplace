'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Gavel, Clock, Loader2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Countdown from '@/components/auction/Countdown';
import EmptyState from '@/components/ui/EmptyState';
import { formatSOL, shortenAddress } from '@/lib/solana/connection';
import { useFetchAuctions } from '@/hooks/useData';

export default function AuctionsPage() {
  const { auctions, loading } = useFetchAuctions();

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          LIVE AUCTIONS
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Bid on exclusive NFTs in real-time auctions
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
        </div>
      ) : auctions.length === 0 ? (
        <EmptyState
          variant="auction"
          title="No Active Auctions"
          description="There are no active auctions right now. Create one from your NFT detail page!"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction, i) => {
            const isEnded = new Date(auction.endTime).getTime() <= Date.now();
            return (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/auction/${auction.id}`}>
                  <div className="group bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--color-signal-orange)]/50 transition-all cursor-pointer overflow-hidden">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      {auction.nft.image ? (
                        <Image
                          src={auction.nft.image}
                          alt={auction.nft.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--bg-primary)] flex items-center justify-center">
                          <Gavel size={32} className="text-[var(--text-secondary)]" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge variant={isEnded ? 'danger' : 'warning'} size="sm">
                          <Gavel size={10} />
                          {auction.status === 'settled' ? 'SETTLED' : isEnded ? 'ENDED' : 'LIVE'}
                        </Badge>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-[family-name:var(--font-display)] text-sm font-bold tracking-wider mb-1 truncate">
                        {auction.nft.name || 'Unnamed NFT'}
                      </h3>
                      <p className="text-[10px] text-[var(--text-secondary)] font-[family-name:var(--font-mono)] mb-3">
                        by {shortenAddress(auction.seller)}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">
                            {isEnded ? 'Final Bid' : 'Current Bid'}
                          </p>
                          <p className="font-[family-name:var(--font-mono)] text-lg font-bold text-[var(--color-signal-orange)]">
                            ◎ {formatSOL(auction.currentBid)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">
                            Bids
                          </p>
                          <p className="font-[family-name:var(--font-mono)] text-lg font-bold">
                            {auction.bids.length}
                          </p>
                        </div>
                      </div>

                      {!isEnded && (
                        <div className="border-t border-[var(--border-color)] pt-3">
                          <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Clock size={9} /> Ends In
                          </p>
                          <Countdown endTime={auction.endTime} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
