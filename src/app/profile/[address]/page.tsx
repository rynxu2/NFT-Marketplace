'use client';

import React, { use, useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, Droplets, Loader2, Wallet, Trophy, Gavel, TrendingUp, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import NFTGrid from '@/components/nft/NFTGrid';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { shortenAddress, getNetwork } from '@/lib/solana/connection';
import { formatChainCurrency, getChainExplorerUrl } from '@/types/chain';
import { useChainWallet } from '@/hooks/useChainWallet';
import { useChainStore } from '@/store/useChainStore';
import { useRequestAirdrop } from '@/hooks/useBalance';
import { useToastStore } from '@/store/useToastStore';
import { useFetchNFTs, useFetchListings, useFetchAuctions, useFetchActivities } from '@/hooks/useData';
import { useFavorites } from '@/hooks/useFavorites';

export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const router = useRouter();
  const { connected, address: walletAddress, balance } = useChainWallet();
  const { activeChain } = useChainStore();
  const { airdrop, loading: airdropLoading } = useRequestAirdrop();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'owned' | 'created' | 'listed' | 'favorites' | 'auctions' | 'activity'>('owned');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'won' | 'lost' | 'active'>('all');
  const [currentTime] = useState(() => Date.now());

  // Redirect to current chain wallet when switching chains
  useEffect(() => {
    if (connected && walletAddress && walletAddress !== address) {
      router.replace(`/profile/${walletAddress}`);
    }
  }, [activeChain, connected, walletAddress, address, router]);

  const { nfts: ownedNFTs, loading: ownedLoading } = useFetchNFTs({ owner: address });
  const { nfts: createdNFTs, loading: createdLoading } = useFetchNFTs({ creator: address });
  const { listings, loading: listingsLoading } = useFetchListings();
  const { auctions, loading: auctionsLoading } = useFetchAuctions();
  const { activities } = useFetchActivities();
  const { favorites, loading: favoritesLoading } = useFavorites();

  const isOwnProfile = connected && walletAddress === address;
  const network = getNetwork();

  const listedNFTs = useMemo(() => {
    return listings.filter((l) => l.seller === address).map((l) => l.nft);
  }, [address, listings]);

  // Dynamic metrics & categories (computed dynamically)
  const auctionMetrics = useMemo(() => {
    // 1. All auctions where the user has placed at least one bid
    const participated = auctions.filter((a) =>
      a.bids.some((b) => b.bidder === address)
    );

    // 2. Total individual bids placed by this user
    const totalBids = auctions.reduce((acc, a) => {
      const userBids = a.bids.filter((b) => b.bidder === address);
      return acc + userBids.length;
    }, 0);

    // 3. Won auctions: where user is highest bidder and auction is ended/settled
    const won = auctions.filter((a) => {
      const isEnded = new Date(a.endTime).getTime() <= currentTime || a.status === 'settled' || a.status === 'ended';
      return a.highestBidder === address && isEnded;
    });

    // 4. Lost auctions: where user bid but is NOT highest bidder, and auction is ended/settled
    const lost = participated.filter((a) => {
      const isEnded = new Date(a.endTime).getTime() <= currentTime || a.status === 'settled' || a.status === 'ended';
      return a.highestBidder !== address && isEnded;
    });

    // 5. Active bidded: where user bid and auction is still live
    const activeBids = participated.filter((a) => {
      const isEnded = new Date(a.endTime).getTime() <= currentTime || a.status === 'settled' || a.status === 'ended';
      return !isEnded;
    });

    // 6. Success Rate
    const winsCount = won.length;
    const lossesCount = lost.length;
    const successRate = winsCount + lossesCount === 0 
      ? 0 
      : Math.round((winsCount / (winsCount + lossesCount)) * 100);

    return {
      participated,
      totalBids,
      won,
      lost,
      activeBids,
      successRate
    };
  }, [auctions, address, currentTime]);

  const filteredAuctions = useMemo(() => {
    switch (historyFilter) {
      case 'won':
        return auctionMetrics.won;
      case 'lost':
        return auctionMetrics.lost;
      case 'active':
        return auctionMetrics.activeBids;
      case 'all':
      default:
        return auctionMetrics.participated;
    }
  }, [historyFilter, auctionMetrics]);

  const profileActivities = useMemo(() => {
    return activities.filter((a) => a.from === address || a.to === address).slice(0, 20);
  }, [address, activities]);

  const nfts = activeTab === 'owned' ? ownedNFTs : activeTab === 'created' ? createdNFTs : activeTab === 'favorites' ? favorites : listedNFTs;
  const isLoading = activeTab === 'owned' ? ownedLoading : activeTab === 'created' ? createdLoading : activeTab === 'favorites' ? favoritesLoading : listingsLoading;

  const tabs = [
    { id: 'owned' as const, label: 'Owned', count: ownedNFTs.length },
    { id: 'created' as const, label: 'Created', count: createdNFTs.length },
    { id: 'listed' as const, label: 'Listed', count: listedNFTs.length },
    { id: 'favorites' as const, label: 'Favorites', count: favorites.length },
    { id: 'auctions' as const, label: 'Auctions', count: auctionMetrics.participated.length },
    { id: 'activity' as const, label: 'Activity', count: profileActivities.length },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    addToast('Address copied!', 'info', undefined, 2000);
  };

  const handleAirdrop = async () => {
    const sig = await airdrop(1);
    if (sig) {
      addToast('Airdrop sent! Balance will update shortly.', 'success');
    }
  };

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 sm:p-8 mb-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent)] to-[var(--color-electric-lime)] flex items-center justify-center text-2xl font-bold text-[var(--bg-primary)] font-[family-name:var(--font-display)]">
            {address.slice(0, 2)}
          </div>

          <div className="flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-wider mb-1">
              {isOwnProfile ? 'My Profile' : 'User Profile'}
            </h1>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--text-secondary)]">
                {shortenAddress(address, 8)}
              </span>
              <button
                onClick={handleCopy}
                className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                aria-label="Copy address"
              >
                <Copy size={14} />
              </button>
              <a
                href={getChainExplorerUrl(activeChain, address, 'address')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Balance */}
            {isOwnProfile && balance !== null && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Wallet size={14} className="text-[var(--accent)]" />
                  <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--accent)] font-semibold">
                    {formatChainCurrency(balance, activeChain)}
                  </span>
                </div>
                {network === 'devnet' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAirdrop}
                    loading={airdropLoading}
                    disabled={airdropLoading}
                    className="text-[10px]"
                  >
                    {airdropLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Droplets size={12} />
                    )}
                    {airdropLoading ? 'Airdropping...' : 'Airdrop 1 SOL'}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: 'Owned', val: ownedNFTs.length },
              { label: 'Created', val: createdNFTs.length },
              { label: 'Listed', val: listedNFTs.length },
              { label: 'Auctions', val: auctionMetrics.participated.length },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-[family-name:var(--font-mono)] text-lg font-bold">{s.val}</p>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-[var(--border-color)] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-3 text-xs font-[family-name:var(--font-display)] uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.id === 'auctions' && <Gavel size={10} className="inline mr-1 -mt-0.5" />}
            {tab.label}
            <span className="ml-1.5 text-[10px] font-[family-name:var(--font-mono)]">({tab.count})</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="profile-tab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'activity' ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          {profileActivities.length > 0 ? (
            <div className="divide-y divide-[var(--border-color)]">
              {profileActivities.map((act) => (
                <div key={act.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        act.type === 'sale'
                          ? 'bg-[var(--color-electric-lime)]/20 text-[var(--color-electric-lime)]'
                          : act.type === 'mint'
                            ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                            : act.type === 'auction_won'
                              ? 'bg-[var(--color-signal-orange)]/20 text-[var(--color-signal-orange)]'
                              : 'bg-[var(--color-signal-orange)]/20 text-[var(--color-signal-orange)]'
                      }`}
                    >
                      {act.type === 'auction_won' ? '🏆 WON' : act.type === 'auction_settled' ? 'SETTLED' : act.type}
                    </span>
                    <p className="text-xs text-[var(--text-primary)] mt-1">{act.nftName}</p>
                  </div>
                  <div className="text-right">
                    {act.price && (
                      <p className="text-xs font-[family-name:var(--font-mono)] font-semibold">◎ {act.price}</p>
                    )}
                    {act.txSignature && (
                      <a
                        href={getChainExplorerUrl(activeChain, act.txSignature)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[8px] text-[var(--accent)] hover:underline"
                      >
                        View Tx
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState variant="activity" />
          )}
        </div>
      ) : activeTab === 'auctions' ? (
        /* Auctions History Tab */
        <div>
          {auctionsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
            </div>
          ) : (
            <div>
              {/* Premium Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Total Bids */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Bids Placed</p>
                    <p className="font-[family-name:var(--font-mono)] text-xl font-bold">{auctionMetrics.totalBids}</p>
                  </div>
                  <div className="w-10 h-10 bg-[var(--accent)]/10 flex items-center justify-center rounded-sm text-[var(--accent)]">
                    <Gavel size={18} />
                  </div>
                </div>
                
                {/* Wins */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Auctions Won</p>
                    <p className="font-[family-name:var(--font-mono)] text-xl font-bold text-[var(--color-electric-lime)]">{auctionMetrics.won.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-[var(--color-electric-lime)]/10 flex items-center justify-center rounded-sm text-[var(--color-electric-lime)]">
                    <Trophy size={18} />
                  </div>
                </div>

                {/* Losses */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Auctions Lost</p>
                    <p className="font-[family-name:var(--font-mono)] text-xl font-bold text-[var(--color-crimson)]">{auctionMetrics.lost.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-[var(--color-crimson)]/10 flex items-center justify-center rounded-sm text-[var(--color-crimson)]">
                    <XCircle size={18} />
                  </div>
                </div>

                {/* Success Rate */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Success Rate</p>
                    <p className="font-[family-name:var(--font-mono)] text-xl font-bold text-[var(--accent)]">{auctionMetrics.successRate}%</p>
                  </div>
                  <div className="w-10 h-10 bg-[var(--accent)]/10 flex items-center justify-center rounded-sm text-[var(--accent)]">
                    <TrendingUp size={18} />
                  </div>
                </div>
              </div>

              {/* Sub-pill Switcher */}
              <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1 rounded-sm select-none mb-6 w-fit">
                {[
                  { id: 'all' as const, label: 'All Bids', count: auctionMetrics.participated.length },
                  { id: 'won' as const, label: 'Wins', count: auctionMetrics.won.length, icon: Trophy },
                  { id: 'lost' as const, label: 'Losses', count: auctionMetrics.lost.length, icon: XCircle },
                  { id: 'active' as const, label: 'Active', count: auctionMetrics.activeBids.length, icon: Clock },
                ].map((pill) => {
                  const Icon = pill.icon;
                  const isActive = historyFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      onClick={() => setHistoryFilter(pill.id)}
                      className={`relative px-4 py-2 text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 z-10 ${
                        isActive ? 'text-[var(--bg-primary)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {Icon && <Icon size={10} />}
                      {pill.label}
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-[family-name:var(--font-mono)] ${
                        isActive
                          ? 'bg-[var(--bg-primary)]/20 text-[var(--bg-primary)]'
                          : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                      }`}>
                        {pill.count}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="profile-history-tab"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          className="absolute inset-0 bg-gradient-to-r from-[var(--color-signal-orange)] to-[var(--color-electric-lime)] rounded-sm -z-10"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Cards Grid */}
              {filteredAuctions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAuctions.map((auction, index) => {
                    const isEnded = new Date(auction.endTime).getTime() <= currentTime || auction.status === 'settled' || auction.status === 'ended';
                    const isWinner = auction.highestBidder === address;
                    const isSeller = auction.seller === address;
                    
                    // Find highest bid placed by user
                    const userHighestBid = (() => {
                      const userBids = auction.bids.filter((b) => b.bidder === address);
                      if (userBids.length === 0) return 0;
                      return Math.max(...userBids.map((b) => b.amount));
                    })();

                    // Determine Badge & Badge Color
                    let badgeLabel = 'BIDDED';
                    let badgeVariant: 'warning' | 'success' | 'danger' | 'info' = 'info';
                    
                    if (isSeller) {
                      badgeLabel = 'YOUR AUCTION';
                      badgeVariant = 'info';
                    } else if (isEnded) {
                      if (isWinner) {
                        badgeLabel = auction.status === 'settled' ? 'WON (CLAIMED)' : 'WON (CLAIMABLE)';
                        badgeVariant = 'success';
                      } else {
                        badgeLabel = 'LOST';
                        badgeVariant = 'danger';
                      }
                    } else {
                      // Live
                      if (isWinner) {
                        badgeLabel = 'WINNING ⚡';
                        badgeVariant = 'success';
                      } else {
                        badgeLabel = 'OUTBID ⚠️';
                        badgeVariant = 'warning';
                      }
                    }

                    return (
                      <motion.div
                        key={auction.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.04 }}
                        className="group"
                      >
                        <Link href={`/auction/${auction.id}`} className="block group">
                          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden transition-all duration-300 group-hover:border-[var(--color-signal-orange)]/50 group-hover:shadow-[0_0_20px_rgba(255,107,43,0.15)] relative">
                            {/* Image aspect ratio */}
                            <div className="relative aspect-square">
                              <Image
                                src={auction.nft.image}
                                alt={auction.nft.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-2 left-2 z-10">
                                <Badge variant={badgeVariant} size="sm">
                                  {badgeLabel}
                                </Badge>
                              </div>
                              
                              {/* Winner Overlay (if won & settled) */}
                              {isEnded && isWinner && auction.status === 'settled' && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                  <div className="text-center p-4">
                                    <Badge variant="success" size="md" className="mx-auto mb-1">CLAIMED</Badge>
                                    <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">NFT transferred to wallet</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-4">
                              <h3 className="text-sm font-[family-name:var(--font-display)] uppercase font-bold tracking-wider text-[var(--text-primary)] group-hover:text-[var(--color-signal-orange)] transition-colors mb-1 truncate">
                                {auction.nft.name}
                              </h3>
                              <p className="text-[9px] text-[var(--text-secondary)] font-[family-name:var(--font-mono)] mb-3">
                                by {shortenAddress(auction.seller)}
                              </p>

                              <div className="flex items-center justify-between mb-3 border-t border-[var(--border-color)] pt-3">
                                <div>
                                  <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">
                                    {isEnded ? 'Final Price' : 'Current Bid'}
                                  </p>
                                  <p className={`text-base font-[family-name:var(--font-mono)] font-bold ${
                                    isEnded && isWinner 
                                      ? 'text-[var(--color-electric-lime)]'
                                      : isEnded
                                      ? 'text-[var(--text-primary)]'
                                      : isWinner
                                      ? 'text-[var(--color-electric-lime)]'
                                      : 'text-[var(--color-signal-orange)]'
                                  }`}>
                                    {formatChainCurrency(auction.currentBid, auction.nft.chain || 'solana')}
                                  </p>
                                </div>
                                
                                <div className="text-right">
                                  <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">
                                    Your Highest Bid
                                  </p>
                                  <p className="text-base font-[family-name:var(--font-mono)] font-bold text-[var(--text-secondary)]">
                                    {userHighestBid > 0 ? formatChainCurrency(userHighestBid, auction.nft.chain || 'solana') : '—'}
                                  </p>
                                </div>
                              </div>

                              {/* Ended claim warning or live timer */}
                              {isEnded && isWinner && auction.status !== 'settled' && (
                                <div className="border-t border-[var(--border-color)] pt-3">
                                  <Badge variant="danger" size="sm" className="w-full justify-center">
                                    <Gavel size={10} className="mr-1" />
                                    CLAIM NFT NOW
                                  </Badge>
                                </div>
                              )}

                              {!isEnded && (
                                <div className="border-t border-[var(--border-color)] pt-3 flex items-center justify-between text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">
                                  <span className="flex items-center gap-1"><Clock size={9} /> Live</span>
                                  <span className="font-[family-name:var(--font-mono)] font-semibold text-[var(--color-signal-orange)]">
                                    {auction.bids.length} total bids
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  variant="auction"
                  title={
                    historyFilter === 'won' ? 'No Auctions Won' :
                    historyFilter === 'lost' ? 'No Failed Auctions' :
                    historyFilter === 'active' ? 'No Active Bids' :
                    'No Bidding History'
                  }
                  description={
                    historyFilter === 'won' ? "You haven't won any auctions yet. Start bidding to collect exclusive digital assets!" :
                    historyFilter === 'lost' ? "Excellent! You haven't lost any of the auctions you bidded on." :
                    historyFilter === 'active' ? "You don't have any active bids running right now. Place bids in live auctions!" :
                    "You haven't participated in any auctions yet. Explore the auction house to start bidding!"
                  }
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <NFTGrid
          nfts={nfts}
          loading={isLoading}
          emptyMessage={
            activeTab === 'owned' ? 'No NFTs owned yet'
            : activeTab === 'created' ? 'No NFTs created yet'
            : 'No NFTs listed for sale'
          }
        />
      )}
    </div>
  );
}
