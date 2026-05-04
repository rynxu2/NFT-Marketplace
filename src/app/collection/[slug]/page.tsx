'use client';

import React, { use } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import NFTGrid from '@/components/nft/NFTGrid';
import { mockCollections, mockNFTs } from '@/data/mock';
import { formatSOL, shortenAddress } from '@/lib/solana/connection';

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const collection = mockCollections.find((c) => c.slug === slug) || mockCollections[0];
  const collectionNFTs = mockNFTs.filter((n) => n.collectionSlug === slug);

  const statItems = [
    { label: 'Floor Price', value: `◎ ${collection.stats.floorPrice}` },
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
          src={collection.banner}
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
              <div className="flex items-center gap-2">
                <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
                  {collection.name}
                </h1>
                {collection.verified && (
                  <CheckCircle size={18} className="text-[var(--accent)]" />
                )}
              </div>
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
