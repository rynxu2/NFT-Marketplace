'use client';

import React, { use, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Heart, Share2, ShoppingCart, Tag, DollarSign, Loader2, Gavel, Clock, Send, Check, Copy, Zap } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import NFTCard from '@/components/nft/NFTCard';
import TransferModal from '@/components/nft/TransferModal';
import PriceChart from '@/components/nft/PriceChart';
import { shortenAddress, timeAgo } from '@/lib/solana/connection';
import { CHAIN_CONFIGS, formatChainCurrency, getChainExplorerUrl } from '@/types/chain';
import { useChainStore } from '@/store/useChainStore';
import { getChainPriceUSD } from '@/lib/constants';
import { useListNFT, useBuyNFT, useCancelListing } from '@/hooks/useMarketplace';
import { useCreateAuction } from '@/hooks/useAuction';
import { useMakeOffer, useRespondOffer } from '@/hooks/useOffer';
import { useFavorites } from '@/hooks/useFavorites';
import { useFetchNFTs, useFetchListings, useFetchAuctions, useFetchActivities } from '@/hooks/useData';
import { useQuery } from '@tanstack/react-query';
import type { Offer } from '@/types/offer';

export default function NFTDetailPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = use(params);
  const { publicKey } = useWallet();
  const { address: evmAddress } = useAccount();
  const { list } = useListNFT();
  const { buy } = useBuyNFT();
  const { create: createAuction } = useCreateAuction();
  const { cancel } = useCancelListing();
  const { makeOffer } = useMakeOffer();
  const { respond: respondOffer } = useRespondOffer();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { activeChain } = useChainStore();

  const { nfts: allNFTs, loading: nftsLoading } = useFetchNFTs();
  const { listings: allListings } = useFetchListings();
  const { auctions: allAuctions } = useFetchAuctions();
  const { activities: allActivities } = useFetchActivities({ nftMint: mint });

  const [showListForm, setShowListForm] = useState(false);
  const [showAuctionForm, setShowAuctionForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [listPrice, setListPrice] = useState('');
  const [auctionPrice, setAuctionPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('30');
  const [auctionIncrement, setAuctionIncrement] = useState('0.5');
  const [processing, setProcessing] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  const liked = isFavorited(mint);
  const handleLike = useCallback(() => {
    toggleFavorite(mint);
  }, [mint, toggleFavorite]);

  // Find NFT from fetched data
  const nft = allNFTs.find((n) => n.mint === mint);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${nft?.name || 'NFT'} on NEXUS`, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  }, [nft?.name]);

  // Check if listed via React Query data
  const listing = allListings.find((l) => l.mint === mint);
  const isListed = !!listing || !!nft?.listed;

  const [currentTime] = useState(() => Date.now());

  // Check if NFT has an active auction
  const activeAuction = allAuctions.find(
    (a) =>
      a.nft?.mint === mint &&
      a.status !== 'settled' &&
      (new Date(a.endTime).getTime() > currentTime || !!a.highestBidder)
  );
  const hasActiveAuction = !!activeAuction;

  // Check if current user is the owner (works for both Solana and EVM wallets)
  const solanaAddress = publicKey?.toBase58();
  const isOwner = !!(nft?.owner && (
    (solanaAddress && nft.owner === solanaAddress) ||
    (evmAddress && nft.owner.toLowerCase() === evmAddress.toLowerCase())
  ));

  // Related NFTs from same collection
  const relatedNFTs = nft?.collection
    ? allNFTs.filter((n) => n.collection === nft.collection && n.mint !== nft.mint).slice(0, 4)
    : [];

  const handleList = async () => {
    if (!nft) return;
    const price = parseFloat(listPrice);
    if (isNaN(price) || price <= 0) return;
    setProcessing(true);
    await list(nft, price);
    setProcessing(false);
    setShowListForm(false);
    setListPrice('');
  };

  const handleCreateAuction = async () => {
    if (!nft) return;
    const price = parseFloat(auctionPrice);
    const duration = parseInt(auctionDuration);
    const increment = parseFloat(auctionIncrement);
    if (isNaN(price) || price <= 0 || isNaN(duration) || duration <= 0) return;
    setProcessing(true);
    const result = await createAuction(nft, price, duration, increment || 0.5);
    setProcessing(false);
    if (result) {
      setShowAuctionForm(false);
      setAuctionPrice('');
    }
  };

  const handleBuy = async () => {
    if (!listing) return;
    setProcessing(true);
    await buy(listing);
    setProcessing(false);
  };

  const handleCancel = async () => {
    if (!listing) return;
    setProcessing(true);
    await cancel(listing);
    setProcessing(false);
  };

  const handleMakeOffer = async () => {
    if (!nft) return;
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) return;
    setProcessing(true);
    const result = await makeOffer(nft, amount);
    setProcessing(false);
    if (result) {
      setShowOfferForm(false);
      setOfferAmount('');
    }
  };

  const handleRespondOffer = async (offerId: string, action: 'accept' | 'reject', amount?: number) => {
    setProcessing(true);
    await respondOffer(offerId, action, amount, nft);
    setProcessing(false);
  };

  // Fetch offers for this NFT
  const { data: offers = [] } = useQuery<Offer[]>({
    queryKey: ['offers', mint],
    queryFn: async () => {
      const res = await fetch(`/api/offers?nft_mint=${mint}`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data || []).map((o: Record<string, unknown>) => ({
        id: o.id as string,
        nftMint: o.nft_mint as string,
        nft: o.nft || null,
        bidder: o.bidder as string,
        amount: o.amount as number,
        status: o.status as string,
        expiresAt: o.expires_at as string,
        createdAt: o.created_at as string,
      }));
    },
  });

  // Loading state
  if (nftsLoading) {
    return (
      <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
        </div>
      </div>
    );
  }

  // NFT not found
  if (!nft) {
    return (
      <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Explore
        </Link>
        <EmptyState variant="nft" />
      </div>
    );
  }

  const displayPrice = listing?.price || nft.price;
  const displayListed = isListed || nft.listed;

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Explore
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Image */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src={nft.image}
                alt={nft.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Attributes */}
          {nft.attributes.length > 0 && (
            <div className="mt-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4">
              <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)] mb-3">
                Attributes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {nft.attributes.map((attr) => (
                  <div
                    key={attr.trait_type}
                    className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 text-center"
                  >
                    <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      {attr.trait_type}
                    </p>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right: Details */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Collection */}
          {nft.collection && (
            <Link
              href={`/collection/${nft.collectionSlug}`}
              className="inline-flex items-center gap-1 text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)] hover:underline mb-2"
            >
              {nft.collection}
              <ExternalLink size={10} />
            </Link>
          )}

          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold mb-2">{nft.name}</h1>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">{nft.description}</p>

          {/* Owner / Creator */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3">
              <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Creator</p>
              <p className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-primary)]">
                {shortenAddress(nft.creator)}
              </p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3">
              <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Owner</p>
              <p className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-primary)]">
                {shortenAddress(nft.owner)}
              </p>
            </div>
          </div>

          {/* Price + Buy (for listed NFTs the current user doesn't own) */}
          {displayListed && displayPrice && !isOwner && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--accent)]/20 p-6 mb-6">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">Current Price</p>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-[family-name:var(--font-mono)] text-3xl font-bold text-[var(--accent)]">
                  {formatChainCurrency(displayPrice, nft.chain || activeChain)}
                </span>
                <span className="text-sm text-[var(--text-secondary)]">
                  ≈ ${(displayPrice * getChainPriceUSD(nft.chain || activeChain)).toFixed(2)}
                </span>
              </div>
              <Button size="lg" className="w-full" onClick={handleBuy} loading={processing} disabled={processing}>
                {processing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShoppingCart size={16} />
                )}
                {processing ? 'PROCESSING...' : 'BUY NOW'}
              </Button>
            </div>
          )}

          {/* Make Offer (for non-owners) */}
          {!isOwner && (publicKey || evmAddress) && (
            <div className="mb-6">
              {showOfferForm ? (
                <div className="bg-[var(--bg-secondary)] border border-[var(--color-signal-orange)]/20 p-6">
                  <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--color-signal-orange)] mb-4">
                    Make an Offer
                  </h3>
                  <Input
                    label={`Offer Amount (${CHAIN_CONFIGS[activeChain].symbol})`}
                    type="number"
                    placeholder="e.g., 1.0"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                  />
                  <div className="flex gap-3 mt-4">
                    <Button size="lg" className="flex-1" onClick={handleMakeOffer} loading={processing}>
                      <DollarSign size={16} />
                      SUBMIT OFFER
                    </Button>
                    <Button variant="secondary" size="lg" onClick={() => setShowOfferForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowOfferForm(true)}
                >
                  <DollarSign size={16} />
                  MAKE OFFER
                </Button>
              )}
            </div>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <div className="mb-6">
              {hasActiveAuction ? (
                /* NFT has active auction — block all sale actions */
                <div className="bg-[var(--bg-secondary)] border border-[var(--color-signal-orange)]/20 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Gavel size={16} className="text-[var(--color-signal-orange)]" />
                    <p className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--color-signal-orange)]">
                      Active Auction
                    </p>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    This NFT has an active auction. You cannot list it for sale or create another auction until the current auction is settled.
                  </p>
                  <Link href={`/auction/${activeAuction.id}`}>
                    <Button size="lg" variant="secondary" className="w-full">
                      <Gavel size={16} />
                      VIEW AUCTION
                    </Button>
                  </Link>
                  <Button size="md" variant="cyber-cyan" className="w-full mt-2" onClick={() => setShowTransfer(true)}>
                    <Send size={14} />
                    TRANSFER NFT
                  </Button>
                </div>
              ) : isListed ? (
                <div className="bg-[var(--bg-secondary)] border border-[var(--accent)]/20 p-6">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Listed for
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-2xl font-bold text-[var(--accent)] mb-4">
                    {formatChainCurrency(displayPrice || 0, nft.chain || activeChain)}
                  </p>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={handleCancel}
                    loading={processing}
                  >
                    CANCEL LISTING
                  </Button>
                </div>
              ) : showListForm ? (
                <div className="bg-[var(--bg-secondary)] border border-[var(--accent)]/20 p-6 space-y-4">
                  <Input
                    label={`Set Price (${CHAIN_CONFIGS[activeChain].symbol})`}
                    type="number"
                    placeholder="e.g., 2.5"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <Button size="lg" className="flex-1" onClick={handleList} loading={processing}>
                      <DollarSign size={16} />
                      {processing ? 'LISTING...' : 'CONFIRM LIST'}
                    </Button>
                    <Button variant="secondary" size="lg" onClick={() => setShowListForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : showAuctionForm ? (
                <div className="bg-[var(--bg-secondary)] border border-[var(--color-signal-orange)]/20 p-6 space-y-4">
                  <h4 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--color-signal-orange)] mb-1">Create Auction</h4>
                  <Input
                    label={`Starting Price (${CHAIN_CONFIGS[activeChain].symbol})`}
                    type="number"
                    placeholder="e.g., 1.0"
                    value={auctionPrice}
                    onChange={(e) => setAuctionPrice(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Duration (minutes)"
                      type="number"
                      placeholder="30"
                      value={auctionDuration}
                      onChange={(e) => setAuctionDuration(e.target.value)}
                    />
                    <Input
                      label={`Min Increment (${CHAIN_CONFIGS[activeChain].symbol})`}
                      type="number"
                      placeholder="0.5"
                      value={auctionIncrement}
                      onChange={(e) => setAuctionIncrement(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button size="lg" className="flex-1" onClick={handleCreateAuction} loading={processing}>
                      <Gavel size={16} />
                      {processing ? 'CREATING...' : 'START AUCTION'}
                    </Button>
                    <Button variant="secondary" size="lg" onClick={() => setShowAuctionForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-3">
                    <Button size="lg" className="flex-1" onClick={() => setShowListForm(true)}>
                      <Tag size={16} />
                      LIST FOR SALE
                    </Button>
                    <Button size="lg" variant="secondary" className="flex-1" onClick={() => setShowAuctionForm(true)}>
                      <Gavel size={16} />
                      CREATE AUCTION
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Button size="md" variant="cyber-cyan" className="w-full" onClick={() => setShowTransfer(true)}>
                      <Send size={14} />
                      TRANSFER
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Actions (Like / Share) */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 border text-sm transition-all cursor-pointer ${
                liked
                  ? 'border-[var(--color-crimson)] text-[var(--color-crimson)] bg-[var(--color-crimson)]/10'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--color-crimson)] hover:border-[var(--color-crimson)]'
              }`}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              {liked ? 'Liked' : 'Like'}
            </button>
            <button
              onClick={handleShare}
              className={`flex items-center gap-2 px-4 py-2 border text-sm transition-all cursor-pointer ${
                shareSuccess
                  ? 'border-[var(--color-electric-lime)] text-[var(--color-electric-lime)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]'
              }`}
            >
              {shareSuccess ? <Check size={14} /> : <Share2 size={14} />}
              {shareSuccess ? 'Copied!' : 'Share'}
            </button>
          </div>

          {/* Price History Chart */}
          {allActivities.length > 0 && (
            <div className="mb-6">
              <PriceChart activities={allActivities} />
            </div>
          )}

          {/* Activity */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <div className="px-4 py-3 border-b border-[var(--border-color)]">
              <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)]">
                Activity
              </h3>
            </div>
            {allActivities.length > 0 ? (
              <div className="divide-y divide-[var(--border-color)]">
                {allActivities.slice(0, 8).map((act) => (
                  <div key={act.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <Badge
                        variant={act.type === 'sale' ? 'success' : act.type === 'bid' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {act.type.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {shortenAddress(act.from)}
                        {act.to && ` → ${shortenAddress(act.to)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {act.price && (
                        <p className="text-xs font-[family-name:var(--font-mono)] font-semibold">{formatChainCurrency(act.price, nft.chain || activeChain)}</p>
                      )}
                      <p className="text-[10px] text-[var(--text-secondary)]">{timeAgo(act.timestamp)}</p>
                      {act.txSignature && !act.txSignature.startsWith('list_') && !act.txSignature.startsWith('cancel_') && (
                        <a
                          href={getChainExplorerUrl(nft.chain || activeChain, act.txSignature, 'tx')}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[8px] text-[var(--accent)] hover:underline inline-flex items-center gap-0.5"
                        >
                          Explorer <ExternalLink size={7} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-[var(--text-secondary)] text-center">No activity yet</p>
            )}
          </div>

          {/* Offers Panel */}
          {offers.length > 0 && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] mt-6">
              <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--color-signal-orange)]">
                  Offers ({offers.length})
                </h3>
              </div>
              <div className="divide-y divide-[var(--border-color)]">
                {offers.map((offer) => (
                  <div key={offer.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-[family-name:var(--font-mono)] font-bold text-[var(--color-signal-orange)]">
                        {formatChainCurrency(offer.amount, nft.chain || activeChain)}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        by {shortenAddress(offer.bidder)}
                      </p>
                    </div>
                    {isOwner && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespondOffer(offer.id, 'accept', offer.amount)}
                          disabled={processing}
                          className="px-3 py-1.5 text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider bg-[var(--color-electric-lime)]/10 text-[var(--color-electric-lime)] border border-[var(--color-electric-lime)]/20 hover:bg-[var(--color-electric-lime)]/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondOffer(offer.id, 'reject')}
                          disabled={processing}
                          className="px-3 py-1.5 text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider bg-[var(--color-crimson)]/10 text-[var(--color-crimson)] border border-[var(--color-crimson)]/20 hover:bg-[var(--color-crimson)]/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Related NFTs */}
      {relatedNFTs.length > 0 && (
        <section className="mt-16">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-wider mb-6">
            More from this Collection
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedNFTs.map((n, i) => (
              <NFTCard key={n.mint} nft={n} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Bottom Action Bar */}
      {nft && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-md border-t border-[var(--border-color)] p-3 flex items-center gap-3 sm:hidden">
          {displayListed && displayPrice && !isOwner ? (
            <>
              <div className="flex-1">
                <p className="text-[10px] text-[var(--text-secondary)] uppercase">Price</p>
                <p className="text-sm font-[family-name:var(--font-mono)] font-bold text-[var(--accent)]">{formatChainCurrency(displayPrice, nft.chain || activeChain)}</p>
              </div>
              <Button size="md" onClick={handleBuy} loading={processing} disabled={processing}>
                <ShoppingCart size={14} />
                BUY
              </Button>
            </>
          ) : isOwner && !isListed && !hasActiveAuction ? (
            <>
              <Button size="md" className="flex-1" onClick={() => setShowListForm(true)}>
                <Tag size={14} />
                LIST
              </Button>
              <Button size="md" variant="secondary" className="flex-1" onClick={() => setShowAuctionForm(true)}>
                <Gavel size={14} />
                AUCTION
              </Button>
            </>
          ) : isOwner && hasActiveAuction ? (
            <Link href={`/auction/${activeAuction!.id}`} className="flex-1">
              <Button size="md" variant="secondary" className="w-full">
                <Gavel size={14} />
                VIEW AUCTION
              </Button>
            </Link>
          ) : null}
        </div>
      )}

      {/* Transfer Modal */}
      {nft && (
        <TransferModal
          nft={nft}
          isOpen={showTransfer}
          onClose={() => setShowTransfer(false)}
        />
      )}


    </div>
  );
}
