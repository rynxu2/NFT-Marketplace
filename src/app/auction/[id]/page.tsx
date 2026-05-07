'use client';

import React, { use, useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Gavel, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Countdown from '@/components/auction/Countdown';
import EmptyState from '@/components/ui/EmptyState';
import { formatSOL, shortenAddress, timeAgo } from '@/lib/solana/connection';
import { SOL_PRICE_USD } from '@/lib/constants';
import { usePlaceBid, useSettleAuction } from '@/hooks/useAuction';
import { useBalance } from '@/hooks/useBalance';
import { useFetchAuctions } from '@/hooks/useData';

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { publicKey } = useWallet();
  const { bid: placeBidFn } = usePlaceBid();
  const { settle } = useSettleAuction();
  const { balance } = useBalance();
  const { auctions, loading } = useFetchAuctions();

  const [bidAmount, setBidAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const auction = useMemo(() => auctions.find((a) => a.id === id), [id, auctions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6">
          <ArrowLeft size={16} />
          Back
        </Link>
        <EmptyState
          variant="auction"
          title="Auction Not Found"
          description="This auction doesn't exist or has been removed."
        />
      </div>
    );
  }

  const isEnded = new Date(auction.endTime).getTime() <= Date.now();
  const isSeller = publicKey && auction.seller === publicKey.toBase58();
  const isHighestBidder = publicKey && auction.highestBidder === publicKey.toBase58();
  const minBid = auction.currentBid + auction.minBidIncrement;

  const handleBid = async () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minBid) return;
    setProcessing(true);
    await placeBidFn(auction, amount);
    setProcessing(false);
    setBidAmount('');
  };

  const handleSettle = async () => {
    setProcessing(true);
    await settle(auction);
    setProcessing(false);
  };

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <div className="relative bg-[var(--bg-secondary)] border border-[var(--color-signal-orange)]/20 overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src={auction.nft.image}
                alt={auction.nft.name}
                fill
                sizes="50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </motion.div>

        {/* Auction Info */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Badge variant={isEnded ? (auction.status === 'settled' ? 'info' : 'danger') : 'warning'} size="md">
            <Gavel size={12} />
            {auction.status === 'settled' ? 'SETTLED' : isEnded ? 'ENDED' : 'LIVE AUCTION'}
          </Badge>

          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold mt-3 mb-2">
            {auction.nft.name}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">{auction.nft.description}</p>

          {/* Countdown */}
          {!isEnded && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--color-signal-orange)]/20 p-6 mb-6">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-3">Auction Ends In</p>
              <Countdown endTime={auction.endTime} size="lg" />
            </div>
          )}

          {/* Current Bid */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  {isEnded ? 'Final Bid' : 'Current Bid'}
                </p>
                <p className="font-[family-name:var(--font-mono)] text-2xl font-bold text-[var(--color-signal-orange)]">
                  ◎ {formatSOL(auction.currentBid)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  ≈ ${(auction.currentBid * SOL_PRICE_USD).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  {isEnded ? 'Winner' : 'Min Increment'}
                </p>
                {isEnded && auction.highestBidder ? (
                  <p className="font-[family-name:var(--font-mono)] text-sm font-bold text-[var(--color-electric-lime)]">
                    {shortenAddress(auction.highestBidder)}
                  </p>
                ) : (
                  <p className="font-[family-name:var(--font-mono)] text-lg font-bold">
                    ◎ {auction.minBidIncrement}
                  </p>
                )}
              </div>
            </div>

            {/* Bid Input (only when auction is active) */}
            {!isEnded && auction.status !== 'settled' && (
              <div className="space-y-3">
                {balance !== null && (
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    Balance: <span className="font-[family-name:var(--font-mono)] text-[var(--accent)]">◎ {formatSOL(balance)}</span>
                  </p>
                )}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder={`Min: ${minBid.toFixed(2)} SOL`}
                      step={auction.minBidIncrement}
                      min={minBid}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      disabled={processing}
                    />
                  </div>
                  <Button size="md" onClick={handleBid} loading={processing} disabled={processing || !bidAmount}>
                    {processing ? <Loader2 size={14} className="animate-spin" /> : <Gavel size={14} />}
                    {processing ? 'BIDDING...' : 'PLACE BID'}
                  </Button>
                </div>
              </div>
            )}

            {/* Settle button (for seller when auction ended) */}
            {isEnded && isSeller && auction.status !== 'settled' && auction.highestBidder && (
              <Button size="lg" className="w-full mt-4" onClick={handleSettle} loading={processing}>
                <Shield size={16} />
                {processing ? 'SETTLING...' : 'SETTLE AUCTION'}
              </Button>
            )}

            {/* Status messages */}
            {isEnded && auction.status === 'settled' && (
              <div className="mt-4 p-3 bg-[var(--color-electric-lime)]/10 border border-[var(--color-electric-lime)]/30 text-center">
                <p className="text-xs text-[var(--color-electric-lime)] font-[family-name:var(--font-display)] uppercase tracking-wider">
                  Auction Settled
                </p>
              </div>
            )}

            {isEnded && !auction.highestBidder && (
              <div className="mt-4 p-3 bg-[var(--color-crimson)]/10 border border-[var(--color-crimson)]/30 text-center">
                <p className="text-xs text-[var(--color-crimson)]">
                  Auction ended with no bids
                </p>
              </div>
            )}

            {isHighestBidder && !isEnded && (
              <div className="mt-3 p-2 bg-[var(--color-electric-lime)]/10 border border-[var(--color-electric-lime)]/30 text-center">
                <p className="text-[10px] text-[var(--color-electric-lime)]">You are the highest bidder!</p>
              </div>
            )}
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
                      <div
                        className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold font-[family-name:var(--font-mono)] ${i === 0 ? 'bg-[var(--color-signal-orange)] text-white' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-[family-name:var(--font-mono)]">
                          {shortenAddress(bid.bidder)}
                          {publicKey && bid.bidder === publicKey.toBase58() && (
                            <span className="text-[var(--accent)] ml-1">(You)</span>
                          )}
                        </p>
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
              <p className="px-4 py-6 text-sm text-[var(--text-secondary)] text-center">
                No bids yet — be the first!
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
