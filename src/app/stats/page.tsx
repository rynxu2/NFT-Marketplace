'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, Users, Layers, Gavel, Tag,
  Trophy, ArrowUpRight, Crown, Palette, Activity,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { shortenAddress } from '@/lib/solana/connection';
import { formatChainCurrency } from '@/types/chain';
import { useChainStore } from '@/store/useChainStore';
import Link from 'next/link';

interface GlobalStats {
  totalVolume: number;
  totalNFTs: number;
  totalCreators: number;
  activeAuctions: number;
  totalListings: number;
  totalTransactions: number;
}

interface CollectionStat {
  name: string;
  items: number;
  owners: number;
  volume: number;
  floorPrice: number;
  listed: number;
}

interface TraderStat {
  address: string;
  buyVolume: number;
  sellVolume: number;
  trades: number;
  totalVolume: number;
}

interface CreatorStat {
  address: string;
  created: number;
  totalVolume: number;
}

interface StatsData {
  global: GlobalStats;
  collections: CollectionStat[];
  topTraders: TraderStat[];
  topCreators: CreatorStat[];
}

type ActiveTab = 'collections' | 'traders' | 'creators';

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('collections');
  const { activeChain } = useChainStore();

  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['stats', activeChain],
    queryFn: async () => {
      const res = await fetch(`/api/stats?chain=${activeChain}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const globalCards = stats
    ? [
        { label: 'Total Volume', value: formatChainCurrency(stats.global.totalVolume, activeChain), icon: TrendingUp, color: 'var(--accent)' },
        { label: 'NFTs Created', value: stats.global.totalNFTs, icon: Layers, color: 'var(--color-electric-lime)' },
        { label: 'Creators', value: stats.global.totalCreators, icon: Users, color: 'var(--color-signal-orange)' },
        { label: 'Active Listings', value: stats.global.totalListings, icon: Tag, color: 'var(--accent)' },
        { label: 'Live Auctions', value: stats.global.activeAuctions, icon: Gavel, color: 'var(--color-crimson)' },
        { label: 'Transactions', value: stats.global.totalTransactions, icon: Activity, color: 'var(--color-electric-lime)' },
      ]
    : [];

  const tabs = [
    { id: 'collections' as const, label: 'Collections', icon: Layers },
    { id: 'traders' as const, label: 'Top Traders', icon: Trophy },
    { id: 'creators' as const, label: 'Top Creators', icon: Palette },
  ];

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="text-[var(--accent)]" size={24} />
          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold uppercase tracking-wider">
            Marketplace Stats
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Real-time analytics and leaderboards
        </p>
      </motion.div>

      {/* Global Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10"
        >
          {globalCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 hover:border-[var(--accent)]/30 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} style={{ color: card.color }} className="group-hover:scale-110 transition-transform" />
                  <p className="text-[9px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                    {card.label}
                  </p>
                </div>
                <p className="text-lg font-[family-name:var(--font-mono)] font-bold" style={{ color: card.color }}>
                  {card.value}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-[var(--border-color)] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3 text-xs font-[family-name:var(--font-display)] uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={12} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="stats-tab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Collections Tab */}
          {activeTab === 'collections' && stats && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-x-auto">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 border-b border-[var(--border-color)] text-[9px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Collection</div>
                <div className="col-span-2 text-right">Volume</div>
                <div className="col-span-2 text-right">Floor</div>
                <div className="col-span-1 text-right">Items</div>
                <div className="col-span-1 text-right">Owners</div>
                <div className="col-span-2 text-right">Listed</div>
              </div>

              {stats.collections.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--text-secondary)]">No collection data yet</div>
              ) : (
                <div className="divide-y divide-[var(--border-color)]">
                  {stats.collections.map((col, i) => (
                    <motion.div
                      key={col.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-3 hover:bg-[var(--accent)]/5 transition-colors items-center"
                    >
                      <div className="sm:col-span-1">
                        <span className={`text-xs font-[family-name:var(--font-mono)] font-bold ${i < 3 ? 'text-[var(--color-signal-orange)]' : 'text-[var(--text-secondary)]'}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                      </div>
                      <div className="sm:col-span-3">
                        {col.name === 'Independent' ? (
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{col.name}</span>
                        ) : (
                          <Link href={`/collection/${col.name.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                            {col.name}
                          </Link>
                        )}
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <span className="text-sm font-[family-name:var(--font-mono)] font-semibold text-[var(--accent)]">
                          {formatChainCurrency(col.volume, activeChain)}
                        </span>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <span className="text-sm font-[family-name:var(--font-mono)]">
                          {col.floorPrice > 0 ? formatChainCurrency(col.floorPrice, activeChain) : '—'}
                        </span>
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">{col.items}</span>
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">{col.owners}</span>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">
                          {col.listed} / {col.items}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Traders Tab */}
          {activeTab === 'traders' && stats && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-x-auto">
              <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 border-b border-[var(--border-color)] text-[9px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                <div className="col-span-1">Rank</div>
                <div className="col-span-3">Trader</div>
                <div className="col-span-2 text-right">Total Volume</div>
                <div className="col-span-2 text-right">Buy Volume</div>
                <div className="col-span-2 text-right">Sell Volume</div>
                <div className="col-span-2 text-right">Trades</div>
              </div>

              {stats.topTraders.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--text-secondary)]">No trading activity yet</div>
              ) : (
                <div className="divide-y divide-[var(--border-color)]">
                  {stats.topTraders.map((trader, i) => (
                    <motion.div
                      key={trader.address}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-3 hover:bg-[var(--accent)]/5 transition-colors items-center"
                    >
                      <div className="sm:col-span-1">
                        {i === 0 ? (
                          <Badge variant="warning" size="sm"><Crown size={10} /> 1</Badge>
                        ) : i === 1 ? (
                          <Badge variant="info" size="sm">2</Badge>
                        ) : i === 2 ? (
                          <Badge variant="default" size="sm">3</Badge>
                        ) : (
                          <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">#{i + 1}</span>
                        )}
                      </div>
                      <div className="sm:col-span-3">
                        <Link href={`/profile/${trader.address}`} className="flex items-center gap-2 group">
                          <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent)] to-[var(--color-electric-lime)] flex items-center justify-center text-[10px] font-bold text-[var(--bg-primary)] font-[family-name:var(--font-display)]">
                            {trader.address.slice(0, 2)}
                          </div>
                          <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                            {shortenAddress(trader.address, 6)}
                          </span>
                          <ArrowUpRight size={10} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <span className="text-sm font-[family-name:var(--font-mono)] font-bold text-[var(--accent)]">
                          {formatChainCurrency(trader.totalVolume, activeChain)}
                        </span>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-electric-lime)]">
                          {formatChainCurrency(trader.buyVolume, activeChain)}
                        </span>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-signal-orange)]">
                          {formatChainCurrency(trader.sellVolume, activeChain)}
                        </span>
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <Badge variant="default" size="sm">{trader.trades}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Creators Tab */}
          {activeTab === 'creators' && stats && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-x-auto">
              <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 border-b border-[var(--border-color)] text-[9px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Creator</div>
                <div className="col-span-3 text-right">NFTs Created</div>
                <div className="col-span-4 text-right">Sales Volume</div>
              </div>

              {stats.topCreators.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--text-secondary)]">No creators yet</div>
              ) : (
                <div className="divide-y divide-[var(--border-color)]">
                  {stats.topCreators.map((creator, i) => (
                    <motion.div
                      key={creator.address}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-3 hover:bg-[var(--accent)]/5 transition-colors items-center"
                    >
                      <div className="sm:col-span-1">
                        <span className={`text-xs font-[family-name:var(--font-mono)] font-bold ${i < 3 ? 'text-[var(--color-signal-orange)]' : 'text-[var(--text-secondary)]'}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                      </div>
                      <div className="sm:col-span-4">
                        <Link href={`/profile/${creator.address}`} className="flex items-center gap-2 group">
                          <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-signal-orange)] to-[var(--color-crimson)] flex items-center justify-center text-[10px] font-bold text-white font-[family-name:var(--font-display)]">
                            {creator.address.slice(0, 2)}
                          </div>
                          <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                            {shortenAddress(creator.address, 6)}
                          </span>
                        </Link>
                      </div>
                      <div className="sm:col-span-3 text-right">
                        <Badge variant="info" size="sm"><Palette size={10} /> {creator.created} NFTs</Badge>
                      </div>
                      <div className="sm:col-span-4 text-right">
                        <span className="text-sm font-[family-name:var(--font-mono)] font-bold text-[var(--accent)]">
                          {formatChainCurrency(creator.totalVolume, activeChain)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
