'use client';

import React, { use, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, Droplets, Loader2, Wallet, Trophy, Gavel } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import NFTGrid from '@/components/nft/NFTGrid';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { shortenAddress, formatSOL, getExplorerUrl, getNetwork } from '@/lib/solana/connection';
import { SOL_PRICE_USD } from '@/lib/constants';
import { useBalance, useRequestAirdrop } from '@/hooks/useBalance';
import { useToastStore } from '@/store/useToastStore';
import { useFetchNFTs, useFetchListings, useFetchAuctions, useFetchActivities } from '@/hooks/useData';
import { useFavorites } from '@/hooks/useFavorites';

export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const { publicKey } = useWallet();
  const { balance, refresh: refreshBalance } = useBalance();
  const { airdrop, loading: airdropLoading } = useRequestAirdrop();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'owned' | 'created' | 'listed' | 'favorites' | 'won' | 'activity'>('owned');

  const { nfts: ownedNFTs, loading: ownedLoading } = useFetchNFTs({ owner: address });
  const { nfts: createdNFTs, loading: createdLoading } = useFetchNFTs({ creator: address });
  const { listings, loading: listingsLoading } = useFetchListings();
  const { auctions, loading: auctionsLoading } = useFetchAuctions();
  const { activities } = useFetchActivities();
  const { favorites, loading: favoritesLoading } = useFavorites();

  const isOwnProfile = publicKey && publicKey.toBase58() === address;
  const network = getNetwork();

  const listedNFTs = useMemo(() => {
    return listings.filter((l) => l.seller === address).map((l) => l.nft);
  }, [address, listings]);

  // Won auctions: where this user is the highest bidder and auction is settled
  const wonAuctions = useMemo(() => {
    return auctions.filter(
      (a) => a.highestBidder === address && (a.status === 'settled' || a.status === 'ended')
    );
  }, [address, auctions]);

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
    { id: 'won' as const, label: 'Won', count: wonAuctions.length },
    { id: 'activity' as const, label: 'Activity', count: profileActivities.length },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    addToast('Address copied!', 'info', undefined, 2000);
  };

  const handleAirdrop = async () => {
    const sig = await airdrop(1);
    if (sig) {
      setTimeout(refreshBalance, 2000);
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
                href={getExplorerUrl(address, 'address')}
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
                    ◎ {formatSOL(balance)}
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
              { label: 'Won', val: wonAuctions.length },
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
            {tab.id === 'won' && <Trophy size={10} className="inline mr-1 -mt-0.5" />}
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
                        href={getExplorerUrl(act.txSignature)}
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
      ) : activeTab === 'won' ? (
        /* Won Auctions Tab */
        <div>
          {auctionsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
            </div>
          ) : wonAuctions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wonAuctions.map((auction, index) => (
                <motion.div
                  key={auction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/auction/${auction.id}`} className="block group">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden transition-all duration-300 group-hover:border-[var(--color-signal-orange)]/50 group-hover:shadow-[0_0_20px_rgba(255,107,43,0.15)]">
                      <div className="relative aspect-square">
                        <Image
                          src={auction.nft.image}
                          alt={auction.nft.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant={auction.status === 'settled' ? 'success' : 'warning'} size="sm">
                            <Trophy size={10} />
                            {auction.status === 'settled' ? 'CLAIMED' : 'PENDING'}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-signal-orange)] transition-colors mb-1">
                          {auction.nft.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Won at</p>
                            <p className="text-base font-[family-name:var(--font-mono)] font-bold text-[var(--color-signal-orange)]">
                              ◎ {formatSOL(auction.currentBid)}
                            </p>
                            <p className="text-[10px] text-[var(--text-secondary)]">
                              ≈ ${(auction.currentBid * SOL_PRICE_USD).toFixed(2)}
                            </p>
                          </div>
                          {auction.status !== 'settled' && (
                            <div className="text-right">
                              <Badge variant="danger" size="sm">
                                <Gavel size={10} />
                                CLAIM
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              variant="auction"
              title="No Won Auctions"
              description="You haven't won any auctions yet. Start bidding to win NFTs!"
            />
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
