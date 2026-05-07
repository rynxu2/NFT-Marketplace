'use client';

import React, { use, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import NFTGrid from '@/components/nft/NFTGrid';
import EmptyState from '@/components/ui/EmptyState';
import { formatSOL, shortenAddress } from '@/lib/solana/connection';
import { useFetchNFTs } from '@/hooks/useData';

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { nfts: allNFTs, loading } = useFetchNFTs();

  // Derive collection data from NFTs
  const collectionNFTs = useMemo(() => {
    return allNFTs.filter((n) => n.collectionSlug === slug);
  }, [allNFTs, slug]);

  const collection = useMemo(() => {
    if (collectionNFTs.length === 0) return null;
    const first = collectionNFTs[0];
    const prices = collectionNFTs.filter((n) => n.price).map((n) => n.price!);
    return {
      name: first.collection || slug,
      creator: first.creator,
      description: `A collection of ${collectionNFTs.length} NFTs on the NEXUS marketplace.`,
      image: first.image,
      stats: {
        floorPrice: prices.length > 0 ? Math.min(...prices) : 0,
        totalVolume: prices.reduce((sum, p) => sum + p, 0),
        items: collectionNFTs.length,
        owners: new Set(collectionNFTs.map((n) => n.owner)).size,
        listed: collectionNFTs.filter((n) => n.listed).length,
      },
    };
  }, [collectionNFTs, slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
        <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-4">
          <ArrowLeft size={16} />
          Back
        </Link>
        <EmptyState variant="collection" />
      </div>
    );
  }

  const statItems = [
    { label: 'Floor Price', value: collection.stats.floorPrice > 0 ? `◎ ${collection.stats.floorPrice}` : '—' },
    { label: 'Total Volume', value: `◎ ${formatSOL(collection.stats.totalVolume)}` },
    { label: 'Items', value: collection.stats.items.toString() },
    { label: 'Owners', value: collection.stats.owners.toString() },
    { label: 'Listed', value: `${collection.stats.listed}` },
  ];

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 sm:h-64">
        <Image
          src={collection.image}
          alt={collection.name}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/50 to-transparent" />
      </div>

      <div className="max-w-[80rem] mx-auto px-4 sm:px-6">
        {/* Collection Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="-mt-16 relative z-10 mb-8"
        >
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-4">
            <ArrowLeft size={16} />
            Back
          </Link>

          <div className="flex items-end gap-4 mb-4">
            <div className="w-24 h-24 border-2 border-[var(--bg-primary)] bg-[var(--bg-secondary)] overflow-hidden shrink-0">
              <Image
                src={collection.image}
                alt={collection.name}
                width={96}
                height={96}
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
                {collection.name}
              </h1>
              <p className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">
                by {shortenAddress(collection.creator)}
              </p>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)] max-w-[42rem] leading-relaxed mb-6">
            {collection.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {statItems.map((s) => (
              <div key={s.label} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3 text-center">
                <p className="font-[family-name:var(--font-mono)] text-sm font-bold">{s.value}</p>
                <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* NFTs */}
        <div className="py-8">
          <NFTGrid nfts={collectionNFTs} emptyMessage="No NFTs in this collection" />
        </div>
      </div>
    </div>
  );
}
