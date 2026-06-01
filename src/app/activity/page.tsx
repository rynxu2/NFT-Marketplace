'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Gavel, Tag, Repeat, Sparkles, XCircle, Trophy, Activity as ActivityIcon, Loader2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { shortenAddress, timeAgo } from '@/lib/solana/connection';
import { formatChainCurrency } from '@/types/chain';
import { useFetchActivities } from '@/hooks/useData';
import type { ActivityType } from '@/types/activity';

const TYPE_CONFIG: Record<ActivityType, { icon: React.ElementType; label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  sale: { icon: ArrowUpRight, label: 'Sale', variant: 'success' },
  listing: { icon: Tag, label: 'Listed', variant: 'info' },
  bid: { icon: Gavel, label: 'Bid', variant: 'warning' },
  transfer: { icon: Repeat, label: 'Transfer', variant: 'default' },
  mint: { icon: Sparkles, label: 'Mint', variant: 'info' },
  cancel: { icon: XCircle, label: 'Cancelled', variant: 'danger' },
  auction_created: { icon: Gavel, label: 'Auction', variant: 'warning' },
  auction_settled: { icon: ArrowDownLeft, label: 'Settled', variant: 'success' },
  auction_won: { icon: Trophy, label: 'Won', variant: 'success' },
  offer: { icon: Tag, label: 'Offer', variant: 'warning' },
  offer_accepted: { icon: ArrowUpRight, label: 'Offer Accepted', variant: 'success' },
};

const FILTER_TYPES: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sale', label: 'Sales' },
  { value: 'listing', label: 'Listings' },
  { value: 'bid', label: 'Bids' },
  { value: 'transfer', label: 'Transfers' },
  { value: 'mint', label: 'Mints' },
];

export default function ActivityPage() {
  const [filter, setFilter] = useState('all');
  const { activities, loading } = useFetchActivities({ limit: 50 });

  const filtered = useMemo(() => {
    return filter === 'all'
      ? activities
      : activities.filter((a) => a.type === filter);
  }, [activities, filter]);

  return (
    <div className="max-w-[64rem] mx-auto px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon className="text-[var(--accent)]" size={20} />
          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold uppercase tracking-wider">
            Activity
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Real-time feed of marketplace transactions
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TYPES.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-xs font-[family-name:var(--font-display)] uppercase tracking-wider border transition-all cursor-pointer ${
              filter === f.value
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState variant="activity" />
      ) : (
        /* Activity List */
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 border-b border-[var(--border-color)] text-[9px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
            <div className="col-span-1">Type</div>
            <div className="col-span-3">NFT</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">From</div>
            <div className="col-span-2">To</div>
            <div className="col-span-2 text-right">Time</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--border-color)]">
            {filtered.map((act, i) => {
              const config = TYPE_CONFIG[act.type];
              if (!config) return null;
              const Icon = config.icon;

              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-3 hover:bg-[var(--accent)]/5 transition-colors items-center"
                >
                  {/* Type */}
                  <div className="sm:col-span-1">
                    <Badge variant={config.variant} size="sm">
                      <Icon size={10} />
                      <span className="sm:hidden">{config.label}</span>
                    </Badge>
                  </div>

                  {/* NFT */}
                  <div className="sm:col-span-3">
                    <Link href={`/nft/${act.nftMint}`} className="flex items-center gap-3 group">
                      {act.nftImage && (
                        <div className="relative w-10 h-10 overflow-hidden shrink-0 border border-[var(--border-color)]">
                          <Image src={act.nftImage} alt={act.nftName} fill sizes="40px" className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate group-hover:text-[var(--accent)] transition-colors">
                          {act.nftName || 'Unknown NFT'}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate">{act.collection}</p>
                      </div>
                    </Link>
                  </div>

                  {/* Price */}
                  <div className="sm:col-span-2">
                    {act.price ? (
                      <p className="text-xs font-[family-name:var(--font-mono)] font-semibold">
                        {formatChainCurrency(act.price, act.chain || 'solana')}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)]">—</p>
                    )}
                  </div>

                  {/* From */}
                  <div className="sm:col-span-2">
                    <p className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">
                      {shortenAddress(act.from)}
                    </p>
                  </div>

                  {/* To */}
                  <div className="sm:col-span-2">
                    <p className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">
                      {act.to ? shortenAddress(act.to) : '—'}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="sm:col-span-2 text-right">
                    <p className="text-[10px] text-[var(--text-secondary)] font-[family-name:var(--font-mono)]">
                      {timeAgo(act.timestamp)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
