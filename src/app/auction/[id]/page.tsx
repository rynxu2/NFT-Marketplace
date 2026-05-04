'use client';

import React, { use } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Gavel } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Countdown from '@/components/auction/Countdown';
import { mockAuctions } from '@/data/mock';
import { formatSOL, shortenAddress, timeAgo } from '@/lib/solana/connection';
import { SOL_PRICE_USD } from '@/lib/constants';

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const auction = mockAuctions.find((a) => a.id === id) || mockAuctions[0];

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6">
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <div className="relative bg-[var(--bg-secondary)] border border-[var(--color-signal-orange)]/20 overflow-hidden">
            <div className="relative aspect-square">
              <Image src={auction.nft.image} alt={auction.nft.name} fill sizes="50vw" className="object-cover" priority />
            </div>
          </div>
        </motion.div>

        {/* Auction Info */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Badge variant="warning" size="md">
            <Gavel size={12} />
            LIVE AUCTION
          </Badge>

          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold mt-3 mb-2">
            {auction.nft.name}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">{auction.nft.description}</p>

          {/* Countdown */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--color-signal-orange)]/20 p-6 mb-6">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-3">Auction Ends In</p>
            <Countdown endTime={auction.endTime} size="lg" />
          </div>

          {/* Current Bid */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Current Bid</p>
                <p className="font-[family-name:var(--font-mono)] text-2xl font-bold text-[var(--color-signal-orange)]">
                  ◎ {formatSOL(auction.currentBid)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  ≈ ${(auction.currentBid * SOL_PRICE_USD).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Min Increment</p>
                <p className="font-[family-name:var(--font-mono)] text-lg font-bold">
                  ◎ {auction.minBidIncrement}
                </p>
              </div>
            </div>

            {/* Bid Input */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder={`Min: ${(auction.currentBid + auction.minBidIncrement).toFixed(2)} SOL`}
                  step={auction.minBidIncrement}
                />
              </div>
              <Button size="md">
                <Gavel size={14} />
                PLACE BID
              </Button>
            </div>
          </div>

          {/* Bid History */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <div className="px-4 py-3 border-b border-[var(--border-color)]">
              <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)]">
                Bid History ({auction.bids.length})
              </h3>
            </div>
            {auction.bids.length > 0 ? (
              <div className="divide-y divide-[var(--border-color)]">
                {[...auction.bids].reverse().map((bid, i) => (
                  <div key={bid.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold font-[family-name:var(--font-mono)] ${i === 0 ? 'bg-[var(--color-signal-orange)] text-white' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-[family-name:var(--font-mono)]">{shortenAddress(bid.bidder)}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{timeAgo(bid.timestamp)}</p>
                      </div>
                    </div>
                    <p className="font-[family-name:var(--font-mono)] text-sm font-semibold">
                      ◎ {formatSOL(bid.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-[var(--text-secondary)] text-center">No bids yet — be the first!</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
