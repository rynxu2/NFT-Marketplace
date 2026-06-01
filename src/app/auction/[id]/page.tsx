'use client';

import React, { use, useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gavel, Shield, Loader2, Trophy, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useChainStore } from '@/store/useChainStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Countdown from '@/components/auction/Countdown';
import EmptyState from '@/components/ui/EmptyState';
import { shortenAddress, timeAgo } from '@/lib/solana/connection';
import { formatChainCurrency, CHAIN_CONFIGS } from '@/types/chain';
import { getChainPriceUSD } from '@/lib/constants';
import { usePlaceBid, useSettleAuction, useVoidAuction } from '@/hooks/useAuction';
import { useFetchAuctions } from '@/hooks/useData';
import { useChainWallet } from '@/hooks/useChainWallet';

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address: walletAddress, connected, balance } = useChainWallet();
  const { activeChain } = useChainStore();
  const { bid: placeBidFn } = usePlaceBid();
  const { settle } = useSettleAuction();
  const { voidAuction } = useVoidAuction();

  // Poll every 5s for live bid updates (stops when settled)
  const [isSettledState, setIsSettledState] = useState(false);
  const { auctions, loading, refresh } = useFetchAuctions({
    pollingInterval: isSettledState ? 0 : 5000,
  });

  const [bidAmount, setBidAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);

  const auction = useMemo(() => auctions.find((a) => a.id === id), [id, auctions]);

  // Sort bids by amount descending (highest first) to guarantee the correct leader/winner order
  const sortedBids = useMemo(() => {
    if (!auction?.bids) return [];
    return [...auction.bids].sort((a, b) => b.amount - a.amount);
  }, [auction?.bids]);

  // Stop polling when auction is settled
  useEffect(() => {
    if (auction?.status === 'settled') {
      setIsSettledState(true);
    }
  }, [auction?.status]);

  // Callback when countdown reaches zero — refresh data and set ended flag
  const handleCountdownEnd = useCallback(() => {
    setAuctionEnded(true);
    refresh();
  }, [refresh]);

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

  const isEnded = auctionEnded || new Date(auction.endTime).getTime() <= Date.now();
  const isSeller = !!(walletAddress && auction.seller && walletAddress.toLowerCase() === auction.seller.toLowerCase());
  const isHighestBidder = !!(walletAddress && auction.highestBidder && walletAddress.toLowerCase() === auction.highestBidder.toLowerCase());
  const isSettled = auction.status === 'settled';
  // Only the winner can claim/settle the auction since they must authorize payment on-chain
  const canSettle = isEnded && !isSettled && auction.highestBidder && isHighestBidder && !isSeller;
  // Seller can void the auction if it ends with bids and winner refuses to pay
  const canVoid = isEnded && !isSettled && isSeller && !!auction.highestBidder;
  const minBid = auction.currentBid + auction.minBidIncrement;

  const handleBid = async () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minBid) return;
    setProcessing(true);
    await placeBidFn(auction, amount);
    setProcessing(false);
    setBidAmount('');
    refresh();
  };

  const handleSettle = async () => {
    setProcessing(true);
    await settle(auction);
    setProcessing(false);
    setIsSettledState(true); // Stop polling
    refresh();
  };

  const handleVoid = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy phiên đấu giá này và nhận lại NFT không?')) return;
    setProcessing(true);
    const success = await voidAuction(auction);
    setProcessing(false);
    if (success) {
      setIsSettledState(true);
      refresh();
    }
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

            {/* Settled overlay */}
            <AnimatePresence>
              {isSettled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center"
                >
                  <div className="text-center">
                    <CheckCircle2 size={48} className="text-[var(--color-electric-lime)] mx-auto mb-2" />
                    <p className="text-sm font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--color-electric-lime)]">
                      Settled
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Auction Info */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Badge variant={isSettled ? 'success' : isEnded ? 'danger' : 'warning'} size="md">
            {isSettled ? <CheckCircle2 size={12} /> : isEnded ? <Clock size={12} /> : <Gavel size={12} />}
            {isSettled ? 'SETTLED' : isEnded ? 'ENDED — AWAITING SETTLEMENT' : 'LIVE AUCTION'}
          </Badge>

          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold mt-3 mb-2">
            {auction.nft.name}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">{auction.nft.description}</p>

          {/* Countdown */}
          {!isEnded && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--color-signal-orange)]/20 p-6 mb-6">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-3">Auction Ends In</p>
              <Countdown endTime={auction.endTime} size="lg" onEnd={handleCountdownEnd} />
            </div>
          )}

          {/* Winner Banner — shown when ended and there IS a highest bidder */}
          <AnimatePresence>
            {isEnded && auction.highestBidder && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 mb-6 border ${
                  isSettled
                    ? 'bg-[var(--color-electric-lime)]/10 border-[var(--color-electric-lime)]/30'
                    : 'bg-[var(--color-signal-orange)]/10 border-[var(--color-signal-orange)]/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Trophy size={24} className={isSettled ? 'text-[var(--color-electric-lime)]' : 'text-[var(--color-signal-orange)]'} />
                  <div className="flex-1">
                    {isHighestBidder ? (
                      <>
                        <p className="text-sm font-[family-name:var(--font-display)] uppercase tracking-wider font-bold text-[var(--color-electric-lime)]">
                          🏆 You Won This Auction!
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {isSettled
                            ? 'NFT has been transferred to your wallet. Check your profile!'
                            : 'Click "Claim NFT" below to finalize the transfer.'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-[family-name:var(--font-display)] uppercase tracking-wider font-bold text-[var(--text-primary)]">
                          Auction {isSettled ? 'Settled' : 'Ended'}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          Winner: <span className="font-[family-name:var(--font-mono)] text-[var(--accent)]">{shortenAddress(auction.highestBidder)}</span>
                          {' '}at <span className="font-[family-name:var(--font-mono)] text-[var(--color-signal-orange)]">{formatChainCurrency(auction.currentBid, auction.nft?.chain || 'solana')}</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Bid */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  {isEnded ? 'Final Bid' : 'Current Bid'}
                </p>
                <p className="font-[family-name:var(--font-mono)] text-2xl font-bold text-[var(--color-signal-orange)]">
                  {formatChainCurrency(auction.currentBid, auction.nft?.chain || 'solana')}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  ≈ ${(auction.currentBid * getChainPriceUSD(auction.nft?.chain || 'solana')).toFixed(2)}
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
                    {formatChainCurrency(auction.minBidIncrement, auction.nft?.chain || 'solana')}
                  </p>
                )}
              </div>
            </div>

            {/* Bid Input (only when auction is active) */}
            {!isEnded && auction.status !== 'settled' && (
              <div className="space-y-3">
                {balance !== null && (
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    Balance: <span className="font-[family-name:var(--font-mono)] text-[var(--accent)]">{formatChainCurrency(balance, auction.nft?.chain || 'solana')}</span>
                  </p>
                )}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder={`Min: ${minBid.toFixed(2)} ${CHAIN_CONFIGS[auction.nft?.chain || 'solana'].symbol}`}
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

            {/* Winner Settlement Actions */}
            {canSettle && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 space-y-3"
              >
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSettle}
                  loading={processing}
                  style={{
                    background: 'linear-gradient(135deg, var(--color-signal-orange), var(--color-electric-lime))',
                    color: '#000',
                  }}
                >
                  <Trophy size={16} />
                  {processing ? 'CLAIMING...' : '🏆 CLAIM YOUR NFT'}
                </Button>

                <div className="flex items-start gap-2 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <AlertTriangle size={14} className="text-[var(--color-signal-orange)] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    Claiming will transfer the NFT to your wallet and execute the on-chain payment transaction to the seller.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Seller Settlement Actions */}
            {canVoid && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 space-y-3"
              >
                {auction.highestBidder ? (
                  /* Has bids - show notice to wait for Winner, and void option as fallback */
                  <div className="p-4 bg-[var(--bg-primary)] border border-[var(--color-signal-orange)]/30 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-[var(--color-signal-orange)] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--color-signal-orange)] font-bold">
                          Awaiting Winner Settlement (Chờ Winner thanh toán)
                        </h4>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* No bids - ended and failed */
                  <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)]">
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                      Đấu giá đã kết thúc và không có lượt đặt giá nào. Vui lòng hủy đấu giá để thu hồi NFT.
                    </p>
                  </div>
                )}

                <Button size="lg" variant="secondary" className="w-full text-[var(--color-crimson)] border-[var(--color-crimson)]/20 hover:bg-[var(--color-crimson)]/5" onClick={handleVoid} loading={processing}>
                  <AlertTriangle size={16} />
                  {processing ? 'CANCELLING...' : 'VOID / CANCEL AUCTION (Hủy đấu giá)'}
                </Button>
              </motion.div>
            )}

            {/* Status: Settled */}
            {isSettled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-4 bg-[var(--color-electric-lime)]/10 border border-[var(--color-electric-lime)]/30"
              >
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle2 size={16} className="text-[var(--color-electric-lime)]" />
                  <p className="text-xs text-[var(--color-electric-lime)] font-[family-name:var(--font-display)] uppercase tracking-wider font-bold">
                    Auction Settled — NFT Transferred
                  </p>
                </div>
                {isHighestBidder && (
                  <p className="text-center mt-2">
                    <Link
                      href={`/profile/${walletAddress}`}
                      className="text-xs text-[var(--accent)] hover:underline font-[family-name:var(--font-display)] uppercase tracking-wider"
                    >
                      View in Your Profile →
                    </Link>
                  </p>
                )}
              </motion.div>
            )}

            {/* Ended with no bids */}
            {isEnded && !auction.highestBidder && (
              <div className="mt-4 p-3 bg-[var(--color-crimson)]/10 border border-[var(--color-crimson)]/30 text-center">
                <p className="text-xs text-[var(--color-crimson)]">
                  Auction ended with no bids
                </p>
              </div>
            )}

            {/* You're highest bidder while live */}
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
                Bid History ({sortedBids.length})
              </h3>
            </div>
            {sortedBids.length > 0 ? (
              <div className="divide-y divide-[var(--border-color)]">
                {sortedBids.map((bid, i) => (
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
                          {walletAddress && bid.bidder.toLowerCase() === walletAddress.toLowerCase() && (
                            <span className="text-[var(--accent)] ml-1">(You)</span>
                          )}
                          {isEnded && i === 0 && (
                            <span className="text-[var(--color-electric-lime)] ml-1">
                              <Trophy size={10} className="inline -mt-0.5" /> Winner
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{timeAgo(bid.timestamp)}</p>
                      </div>
                    </div>
                    <p className="font-[family-name:var(--font-mono)] text-sm font-semibold">
                      {formatChainCurrency(bid.amount, auction.nft?.chain || 'solana')}
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
