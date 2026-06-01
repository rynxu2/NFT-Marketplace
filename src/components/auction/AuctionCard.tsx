'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';
import type { Auction } from '@/types/auction';
import { formatChainCurrency } from '@/types/chain';
import Countdown from './Countdown';
import Badge from '@/components/ui/Badge';

interface AuctionCardProps {
  auction: Auction;
  index?: number;
}

export default function AuctionCard({ auction, index = 0 }: AuctionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
    >
      <Link href={`/auction/${auction.id}`} className="block group">
        <div className="bg-[var(--bg-secondary)] border border-[var(--color-signal-orange)]/20 overflow-hidden transition-all duration-300 group-hover:border-[var(--color-signal-orange)]/50 group-hover:shadow-[0_0_20px_rgba(255,107,43,0.15)]">
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="relative w-full sm:w-48 aspect-square sm:aspect-auto shrink-0 overflow-hidden">
              <Image
                src={auction.nft.image}
                alt={auction.nft.name}
                fill
                sizes="(max-width: 640px) 100vw, 192px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2">
                <Badge variant="warning" size="sm">
                  <Gavel size={10} />
                  LIVE
                </Badge>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  {auction.nft.collection}
                </p>
                <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-signal-orange)] transition-colors mb-2">
                  {auction.nft.name}
                </h3>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Current Bid</p>
                    <p className="text-lg font-[family-name:var(--font-mono)] font-bold text-[var(--color-signal-orange)]">
                      {formatChainCurrency(auction.currentBid, auction.nft?.chain || 'solana')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Bids</p>
                    <p className="text-lg font-[family-name:var(--font-mono)] font-bold text-[var(--text-primary)]">
                      {auction.bids.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Countdown */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Ends In</p>
                  <Countdown endTime={auction.endTime} size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
