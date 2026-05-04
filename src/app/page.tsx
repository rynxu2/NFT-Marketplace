'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, TrendingUp, Gavel, Users, BarChart3 } from 'lucide-react';
import Button from '@/components/ui/Button';
import NFTCard from '@/components/nft/NFTCard';
import AuctionCard from '@/components/auction/AuctionCard';
import { mockNFTs, mockCollections, mockAuctions } from '@/data/mock';
import { formatSOL } from '@/lib/solana/connection';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const stats = [
  { label: 'Total Volume', value: '10,890 SOL', icon: BarChart3 },
  { label: 'NFTs Created', value: '2,050', icon: Zap },
  { label: 'Artists', value: '1,340', icon: Users },
  { label: 'Auctions Live', value: '24', icon: Gavel },
];

export default function HomePage() {
  const featuredNFTs = mockNFTs.filter(n => n.listed).slice(0, 4);
  const trendingNFTs = mockNFTs.slice(4, 8);

  return (
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
            <motion.div
              className="lg:col-span-7"
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <motion.div variants={fadeUp} className="mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-[family-name:var(--font-display)] uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-[var(--color-electric-lime)] rounded-full animate-pulse" />
                  LIVE ON SOLANA DEVNET
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] mb-6"
              >
                <span className="text-[var(--text-primary)]">DISCOVER &</span>
                <br />
                <span className="gradient-text-cyber">COLLECT</span>
                <br />
                <span className="text-[var(--text-primary)]">DIGITAL ART</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-[var(--text-secondary)] text-base sm:text-lg max-w-[28rem] mb-8 leading-relaxed"
              >
                The next-gen NFT marketplace powered by Solana. Trade at lightning speed with near-zero fees.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
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
              </motion.div>

              {/* Stats */}
              <motion.div
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
              </motion.div>
            </motion.div>

            {/* Right: Featured NFT */}
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, x: 50, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative">
                {/* Decorative border */}
                <div className="absolute -inset-2 border border-[var(--accent)]/10" />
                <div className="absolute -inset-4 border border-[var(--accent)]/5" />

                <div className="relative bg-[var(--bg-secondary)] border border-[var(--accent)]/20 overflow-hidden">
                  <div className="relative aspect-square">
                    <Image
                      src={mockNFTs[0].image}
                      alt={mockNFTs[0].name}
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
                    <h3 className="text-lg font-semibold mb-2">{mockNFTs[0].name}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-[var(--text-secondary)] uppercase">Price</p>
                        <p className="font-[family-name:var(--font-mono)] text-xl font-bold text-[var(--accent)]">
                          ◎ {formatSOL(mockNFTs[0].price || 0)}
                        </p>
                      </div>
                      <Link href={`/nft/${mockNFTs[0].mint}`}>
                        <Button size="sm">VIEW</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== LIVE AUCTIONS ===== */}
      <section className="py-16 relative">
        <div className="max-w-[80rem] mx-auto px-4 sm:px-6">
          <motion.div
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
              <span className="w-2 h-2 bg-[var(--color-signal-orange)] rounded-full animate-pulse" />
            </div>
            <Link href="/explore" className="text-xs font-[family-name:var(--font-display)] text-[var(--accent)] hover:underline uppercase tracking-wider">
              View All →
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockAuctions.slice(0, 3).map((auction, i) => (
              <AuctionCard key={auction.id} auction={auction} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRENDING NFTs ===== */}
      <section className="py-16 relative">
        <div className="max-w-[80rem] mx-auto px-4 sm:px-6">
          <motion.div
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
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredNFTs.map((nft, i) => (
              <NFTCard key={nft.mint} nft={nft} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== TOP COLLECTIONS ===== */}
      <section className="py-16 relative">
        <div className="max-w-[80rem] mx-auto px-4 sm:px-6">
          <motion.div
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
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockCollections.map((col, i) => (
              <motion.div
                key={col.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/collection/${col.slug}`} className="block group">
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden group-hover:border-[var(--accent)]/40 transition-all duration-300">
                    {/* Banner */}
                    <div className="relative h-28 overflow-hidden">
                      <Image
                        src={col.banner}
                        alt={col.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent" />
                    </div>
                    {/* Avatar */}
                    <div className="relative px-4 -mt-8 z-10">
                      <div className="w-16 h-16 border-2 border-[var(--bg-secondary)] overflow-hidden">
                        <Image
                          src={col.image}
                          alt={col.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-4 pt-2">
                      <h3 className="text-sm font-semibold group-hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                        {col.name}
                        {col.verified && (
                          <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </h3>
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
                        <div>
                          <p className="text-[9px] text-[var(--text-secondary)] uppercase">Floor</p>
                          <p className="text-xs font-[family-name:var(--font-mono)] font-semibold">◎ {col.stats.floorPrice}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-[var(--text-secondary)] uppercase">Items</p>
                          <p className="text-xs font-[family-name:var(--font-mono)] font-semibold">{col.stats.items}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-[var(--text-secondary)] uppercase">Owners</p>
                          <p className="text-xs font-[family-name:var(--font-mono)] font-semibold">{col.stats.owners}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 relative">
        <div className="max-w-[80rem] mx-auto px-4 sm:px-6">
          <motion.div
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
          </motion.div>
        </div>
      </section>
    </div>
  );
}
