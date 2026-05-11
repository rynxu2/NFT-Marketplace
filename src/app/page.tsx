'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { ArrowRight, Zap, TrendingUp, Gavel, Users, BarChart3 } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { NFTCardSkeleton } from '@/components/ui/Skeleton';
import { useFetchNFTs, useFetchListings, useFetchAuctions } from '@/hooks/useData';
import { formatSOL } from '@/lib/solana/connection';

const NFTCard = dynamic(() => import('@/components/nft/NFTCard'), {
  loading: () => <NFTCardSkeleton />,
});
const AuctionCard = dynamic(() => import('@/components/auction/AuctionCard'), {
  loading: () => <NFTCardSkeleton />,
});

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function HomePage() {
  const { nfts: allNFTs, loading: nftsLoading } = useFetchNFTs();
  const { listings, loading: listingsLoading } = useFetchListings();
  const { auctions, loading: auctionsLoading } = useFetchAuctions();

  const listedNFTs = listings.map((l) => l.nft).slice(0, 4);
  const trendingNFTs = allNFTs.slice(0, 4);
  const liveAuctions = auctions.filter((a) => a.status === 'active' || new Date(a.endTime).getTime() > Date.now()).slice(0, 3);
  const heroNFT = listedNFTs[0] || allNFTs[0];

  // Derive collections from NFTs
  const collections = React.useMemo(() => {
    const grouped = new Map<string, { slug: string; name: string; nfts: typeof allNFTs; creator: string }>();
    for (const nft of allNFTs) {
      if (!nft.collection || !nft.collectionSlug) continue;
      const existing = grouped.get(nft.collectionSlug);
      if (existing) {
        existing.nfts.push(nft);
      } else {
        grouped.set(nft.collectionSlug, { slug: nft.collectionSlug, name: nft.collection, nfts: [nft], creator: nft.creator });
      }
    }
    return Array.from(grouped.values()).slice(0, 4);
  }, [allNFTs]);

  const stats = [
    { label: 'Total Volume', value: `${formatSOL(listings.reduce((sum, l) => sum + l.price, 0))} SOL`, icon: BarChart3 },
    { label: 'NFTs Created', value: String(allNFTs.length), icon: Zap },
    { label: 'Creators', value: String(new Set(allNFTs.map((n) => n.creator)).size), icon: Users },
    { label: 'Auctions Live', value: String(liveAuctions.length), icon: Gavel },
  ];

  const isLoading = nftsLoading || listingsLoading || auctionsLoading;

  return (
    <LazyMotion features={domAnimation}>
    <div className="relative">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-electric-lime)]/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Text */}
            <m.div
              className="lg:col-span-7"
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <m.div variants={fadeUp} className="mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-[family-name:var(--font-display)] uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-[var(--color-electric-lime)] rounded-full animate-pulse" />
                  LIVE ON SOLANA DEVNET
                </span>
              </m.div>

              <m.h1
                variants={fadeUp}
                className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] mb-6"
              >
                <span className="text-[var(--text-primary)]">DISCOVER &</span>
                <br />
                <span className="gradient-text-cyber">COLLECT</span>
                <br />
                <span className="text-[var(--text-primary)]">DIGITAL ART</span>
              </m.h1>

              <m.p
                variants={fadeUp}
                className="text-[var(--text-secondary)] text-base sm:text-lg max-w-[28rem] mb-8 leading-relaxed"
              >
                The next-gen NFT marketplace powered by Solana. Trade at lightning speed with near-zero fees.
              </m.p>

              <m.div variants={fadeUp} className="flex flex-wrap gap-3">
                <Link href="/explore">
                  <Button size="lg">
                    EXPLORE NFTs
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/create">
                  <Button variant="secondary" size="lg">
                    CREATE
                  </Button>
                </Link>
              </m.div>

              {/* Stats */}
              <m.div
                variants={fadeUp}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-[var(--border-color)]"
              >
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <stat.icon size={16} className="text-[var(--accent)] mb-2" />
                    <p className="font-[family-name:var(--font-mono)] text-lg font-bold text-[var(--text-primary)]">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </m.div>
            </m.div>

            {/* Right: Featured NFT */}
            <m.div
              className="lg:col-span-5"
              initial={{ opacity: 0, x: 50, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {heroNFT ? (
                <div className="relative">
                  <div className="absolute -inset-2 border border-[var(--accent)]/10" />
                  <div className="absolute -inset-4 border border-[var(--accent)]/5" />

                  <div className="relative bg-[var(--bg-secondary)] border border-[var(--accent)]/20 overflow-hidden">
                    <div className="relative aspect-square">
                      <Image
                        src={heroNFT.image}
                        alt={heroNFT.name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent" />
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)] mb-1">
                        Featured
                      </p>
                      <h3 className="text-lg font-semibold mb-2">{heroNFT.name}</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-[var(--text-secondary)] uppercase">Price</p>
                          <p className="font-[family-name:var(--font-mono)] text-xl font-bold text-[var(--accent)]">
                            ◎ {formatSOL(heroNFT.price || 0)}
                          </p>
                        </div>
                        <Link href={`/nft/${heroNFT.mint}`}>
                          <Button size="sm">VIEW</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative bg-[var(--bg-secondary)] border border-[var(--accent)]/20 overflow-hidden">
                  <div className="aspect-square flex items-center justify-center">
                    <div className="text-center p-8">
                      <Zap size={48} className="text-[var(--accent)]/30 mx-auto mb-4" />
                      <p className="text-sm text-[var(--text-secondary)]">
                        Mint your first NFT to see it featured here
                      </p>
                      <Link href="/create" className="mt-4 inline-block">
                        <Button size="sm">CREATE NFT</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </m.div>
          </div>
        </div>
      </section>

      {/* ===== LIVE AUCTIONS ===== */}
      <section className="py-16 relative">
        <div className="max-w-[80rem] mx-auto px-4 sm:px-6">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <Gavel className="text-[var(--color-signal-orange)]" size={20} />
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-wider">
                Live Auctions
              </h2>
              {liveAuctions.length > 0 && (
                <span className="w-2 h-2 bg-[var(--color-signal-orange)] rounded-full animate-pulse" />
              )}
            </div>
            <Link href="/explore" className="text-xs font-[family-name:var(--font-display)] text-[var(--accent)] hover:underline uppercase tracking-wider">
              View All →
            </Link>
          </m.div>

          {auctionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <NFTCardSkeleton key={i} />)}
            </div>
          ) : liveAuctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveAuctions.map((auction, i) => (
                <AuctionCard key={auction.id} auction={auction} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState variant="auction" />
          )}
        </div>
      </section>

      {/* ===== TRENDING NFTs ===== */}
      <section className="py-16 relative">
        <div className="max-w-[80rem] mx-auto px-4 sm:px-6">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="text-[var(--color-electric-lime)]" size={20} />
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-wider">
                Trending
              </h2>
            </div>
            <Link href="/explore" className="text-xs font-[family-name:var(--font-display)] text-[var(--accent)] hover:underline uppercase tracking-wider">
              View All →
            </Link>
          </m.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <NFTCardSkeleton key={i} />)}
            </div>
          ) : trendingNFTs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingNFTs.map((nft, i) => (
                <NFTCard key={nft.mint} nft={nft} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState variant="explore" />
          )}
        </div>
      </section>

      {/* ===== TOP COLLECTIONS ===== */}
      {collections.length > 0 && (
        <section className="py-16 relative">
          <div className="max-w-[80rem] mx-auto px-4 sm:px-6">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-wider mb-2">
                Top Collections
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Curated collections from the best creators
              </p>
            </m.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {collections.map((col, i) => (
                <m.div
                  key={col.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/collection/${col.slug}`} className="block group">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden group-hover:border-[var(--accent)]/40 transition-all duration-300">
                      {/* Use first NFT image as banner */}
                      <div className="relative h-28 overflow-hidden">
                        {col.nfts[0]?.image && (
                          <Image
                            src={col.nfts[0].image}
                            alt={col.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent" />
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="text-sm font-semibold group-hover:text-[var(--accent)] transition-colors">
                          {col.name}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
                          <div>
                            <p className="text-[9px] text-[var(--text-secondary)] uppercase">Items</p>
                            <p className="text-xs font-[family-name:var(--font-mono)] font-semibold">{col.nfts.length}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-[var(--text-secondary)] uppercase">Creator</p>
                            <p className="text-xs font-[family-name:var(--font-mono)] font-semibold truncate">
                              {col.creator.slice(0, 4)}...{col.creator.slice(-4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </m.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className="py-20 relative">
        <div className="max-w-[80rem] mx-auto px-4 sm:px-6">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center border border-[var(--border-color)] bg-[var(--bg-secondary)] py-16 px-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 via-transparent to-[var(--color-electric-lime)]/5" />
            <div className="relative z-10">
              <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold uppercase tracking-wider mb-4">
                Start Creating Today
              </h2>
              <p className="text-[var(--text-secondary)] max-w-[28rem] mx-auto mb-8">
                Join the next generation of digital creators. Mint your first NFT on Solana in minutes.
              </p>
              <Link href="/create">
                <Button size="lg">
                  <Zap size={16} />
                  MINT YOUR NFT
                </Button>
              </Link>
            </div>
          </m.div>
        </div>
      </section>
    </div>
    </LazyMotion>
  );
}
