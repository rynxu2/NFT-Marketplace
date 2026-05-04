'use client';

import React, { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Heart, Share2, ShoppingCart, Tag } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { mockNFTs, mockActivities } from '@/data/mock';
import { formatSOL, shortenAddress, timeAgo } from '@/lib/solana/connection';
import { SOL_PRICE_USD } from '@/lib/constants';

export default function NFTDetailPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = use(params);
  const nft = mockNFTs.find((n) => n.mint === mint) || mockNFTs[0];
  const activities = mockActivities.filter((a) => a.nftMint === nft.mint).slice(0, 5);
  const relatedNFTs = mockNFTs.filter((n) => n.collection === nft.collection && n.mint !== nft.mint).slice(0, 4);

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6">
        <ArrowLeft size={16} />
        Back to Explore
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
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
          <div className="mt-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4">
            <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)] mb-3">
              Attributes
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {nft.attributes.map((attr) => (
                <div key={attr.trait_type} className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 text-center">
                  <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">{attr.trait_type}</p>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{attr.value}</p>
                </div>
              ))}
            </div>
          </div>
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

          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold mb-2">
            {nft.name}
          </h1>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            {nft.description}
          </p>

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

          {/* Price + Buy */}
          {nft.listed && nft.price && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--accent)]/20 p-6 mb-6">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">Current Price</p>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-[family-name:var(--font-mono)] text-3xl font-bold text-[var(--accent)]">
                  ◎ {formatSOL(nft.price)}
                </span>
                <span className="text-sm text-[var(--text-secondary)]">
                  ≈ ${(nft.price * SOL_PRICE_USD).toFixed(2)}
                </span>
              </div>
              <div className="flex gap-3">
                <Button size="lg" className="flex-1">
                  <ShoppingCart size={16} />
                  BUY NOW
                </Button>
                <Button variant="secondary" size="lg">
                  <Tag size={16} />
                  MAKE OFFER
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mb-6">
            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:text-[var(--color-crimson)] hover:border-[var(--color-crimson)] transition-all cursor-pointer">
              <Heart size={14} />
              Like
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all cursor-pointer">
              <Share2 size={14} />
              Share
            </button>
          </div>

          {/* Activity */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <div className="px-4 py-3 border-b border-[var(--border-color)]">
              <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)]">
                Activity
              </h3>
            </div>
            {activities.length > 0 ? (
              <div className="divide-y divide-[var(--border-color)]">
                {activities.map((act) => (
                  <div key={act.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <Badge variant={act.type === 'sale' ? 'success' : act.type === 'bid' ? 'warning' : 'info'} size="sm">
                        {act.type.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {shortenAddress(act.from)}
                        {act.to && ` → ${shortenAddress(act.to)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {act.price && (
                        <p className="text-xs font-[family-name:var(--font-mono)] font-semibold">◎ {act.price}</p>
                      )}
                      <p className="text-[10px] text-[var(--text-secondary)]">{timeAgo(act.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-[var(--text-secondary)] text-center">No activity yet</p>
            )}
          </div>
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
              <Link key={n.mint} href={`/nft/${n.mint}`} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden hover:border-[var(--accent)]/40 transition-all group"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image src={n.image} alt={n.name} fill sizes="25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold truncate">{n.name}</p>
                    {n.price && <p className="text-xs font-[family-name:var(--font-mono)] text-[var(--accent)] mt-1">◎ {formatSOL(n.price)}</p>}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
