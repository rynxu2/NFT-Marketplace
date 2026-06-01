'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Clock, Loader2, History, AlertCircle, Trophy } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Countdown from '@/components/auction/Countdown';
import EmptyState from '@/components/ui/EmptyState';
import { shortenAddress } from '@/lib/solana/connection';
import { formatChainCurrency } from '@/types/chain';
import { useFetchAuctions } from '@/hooks/useData';
import { useChainWallet } from '@/hooks/useChainWallet';

type TabId = 'live' | 'history';

export default function AuctionsPage() {
  // Poll every 10s to keep auction prices up-to-date
  const { auctions, loading } = useFetchAuctions({ pollingInterval: 10000 });
  const [activeTab, setActiveTab] = useState<TabId>('live');
  const { address: walletAddress, connected } = useChainWallet();

  // Stable current time to prevent React 19 linter warnings
  const [currentTime] = useState(() => Date.now());

  // Filter auctions into Live and History categories
  const liveAuctions = useMemo(() => {
    return auctions.filter(
      (a) => a.status !== 'settled' && new Date(a.endTime).getTime() > currentTime
    );
  }, [auctions, currentTime]);

  const historyAuctions = useMemo(() => {
    return auctions.filter(
      (a) => a.status === 'settled' || new Date(a.endTime).getTime() <= currentTime
    );
  }, [auctions, currentTime]);

  const tabs = [
    { id: 'live' as const, label: 'Live Auctions', count: liveAuctions.length, icon: Gavel },
    { id: 'history' as const, label: 'Auction History', count: historyAuctions.length, icon: History },
  ];

  const activeAuctions = activeTab === 'live' ? liveAuctions : historyAuctions;

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight mb-2 uppercase">
            NEXUS Auction House
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Bid on exclusive digital assets or explore historical auction results
          </p>
        </div>

        {/* Custom Tab Switcher */}
        <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1 relative rounded-sm select-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 text-xs font-[family-name:var(--font-display)] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 z-10 ${
                  isActive ? 'text-[var(--bg-primary)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={12} />
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-[family-name:var(--font-mono)] ${
                    isActive
                      ? 'bg-[var(--bg-primary)]/20 text-[var(--bg-primary)]'
                      : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                  }`}
                >
                  {tab.count}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="auctions-tab"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="absolute inset-0 bg-gradient-to-r from-[var(--color-signal-orange)] to-[var(--color-electric-lime)] rounded-sm -z-10"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeAuctions.length === 0 ? (
            <motion.div
              key={`${activeTab}-empty`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'live' ? (
                <EmptyState
                  variant="auction"
                  title="No Live Auctions"
                  description="Không có phiên đấu giá trực tuyến nào đang chạy lúc này. Hãy bắt đầu tạo một phiên từ trang chi tiết NFT của bạn!"
                />
              ) : (
                <EmptyState
                  variant="auction"
                  title="No Auction History"
                  description="Chưa có phiên đấu giá nào kết thúc hoặc được quyết toán (settled) trên sàn giao dịch."
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {activeAuctions.map((auction, i) => {
                const isEnded = new Date(auction.endTime).getTime() <= currentTime;
                const isSettled = auction.status === 'settled';

                // Personal participation status on ended/settled cards
                const hasParticipated = connected && walletAddress && auction.bids.some(b => b.bidder === walletAddress);
                const isWinner = connected && walletAddress && auction.highestBidder === walletAddress;
                const isSeller = connected && walletAddress && auction.seller === walletAddress;

                return (
                  <motion.div
                    key={auction.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="group"
                  >
                    <Link href={`/auction/${auction.id}`}>
                      <div
                        className={`bg-[var(--bg-secondary)] border transition-all cursor-pointer overflow-hidden relative ${
                          isSettled
                            ? 'border-[var(--border-color)] hover:border-[var(--color-electric-lime)]/50'
                            : isEnded
                            ? 'border-[var(--border-color)] hover:border-[var(--color-crimson)]/50'
                            : 'border-[var(--border-color)] hover:border-[var(--color-signal-orange)]/50 hover:shadow-[0_0_20px_var(--color-signal-orange-glow)]'
                        }`}
                      >
                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden bg-[var(--bg-primary)]">
                          {auction.nft.image ? (
                            <Image
                              src={auction.nft.image}
                              alt={auction.nft.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gavel size={32} className="text-[var(--text-secondary)]" />
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="absolute top-3 left-3 z-10 flex gap-2">
                            <Badge
                              variant={isSettled ? 'success' : isEnded ? 'danger' : 'warning'}
                              size="sm"
                            >
                              <Gavel size={10} />
                              {isSettled ? 'SETTLED' : isEnded ? 'ENDED' : 'LIVE'}
                            </Badge>

                            {isEnded && (
                              <>
                                {isWinner && (
                                  <Badge variant="success" size="sm" className="bg-[var(--color-electric-lime)] text-[var(--bg-primary)]">
                                    <Trophy size={10} className="mr-1" />
                                    YOU WON 🏆
                                  </Badge>
                                )}
                                {!isWinner && hasParticipated && (
                                  <Badge variant="danger" size="sm">
                                    PARTICIPATED
                                  </Badge>
                                )}
                                {isSeller && (
                                  <Badge variant="info" size="sm">
                                    YOUR NFT
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>

                          {/* Winner Overlay (if settled) */}
                          {isSettled && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="text-center p-4">
                                <Badge variant="success" size="md" className="mx-auto mb-1">SETTLED</Badge>
                                <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">Winner Address</p>
                                <p className="text-xs font-[family-name:var(--font-mono)] font-bold text-[var(--color-electric-lime)]">
                                  {auction.highestBidder ? shortenAddress(auction.highestBidder) : '—'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="font-[family-name:var(--font-display)] text-sm font-bold tracking-wider mb-1 truncate group-hover:text-[var(--accent)] transition-colors">
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
                              <p
                                className={`font-[family-name:var(--font-mono)] text-lg font-bold ${
                                  isSettled
                                    ? 'text-[var(--color-electric-lime)]'
                                    : isEnded
                                    ? 'text-[var(--text-primary)]'
                                    : 'text-[var(--color-signal-orange)]'
                                }`}
                              >
                                {formatChainCurrency(auction.currentBid, auction.nft?.chain || 'solana')}
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

                          {/* Countdown (only for live auctions) */}
                          {!isEnded && (
                            <div className="border-t border-[var(--border-color)] pt-3">
                              <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Clock size={9} /> Ends In
                              </p>
                              <Countdown endTime={auction.endTime} size="sm" />
                            </div>
                          )}

                          {/* Winner/Ended indicator (for history auctions that are NOT settled yet) */}
                          {isEnded && !isSettled && (
                            <div className="border-t border-[var(--border-color)] pt-3 flex items-center gap-1.5 text-[9px] text-[var(--color-signal-orange)] uppercase tracking-wider">
                              <AlertCircle size={10} />
                              Awaiting Settlement (Đợi quyết toán)
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
