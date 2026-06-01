'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Layers, Tag, BarChart3, DollarSign, ShoppingCart } from 'lucide-react';
import type { Collection } from '@/types/collection';
import { shortenAddress } from '@/lib/solana/connection';
import { formatChainCurrency } from '@/types/chain';
import { useChainStore } from '@/store/useChainStore';
import Badge from '@/components/ui/Badge';

interface CollectionCardProps {
  collection: Collection;
  index?: number;
}

export default function CollectionCard({ collection, index = 0 }: CollectionCardProps) {
  const themeColor = collection.theme_color || collection.themeColor || 'var(--accent)';
  const logoSrc = collection.logo || collection.image;
  const isVerified = collection.isVerified ?? collection.verified;
  const { activeChain } = useChainStore();
  const isForSale = collection.forSale && collection.salePrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
      className="group"
    >
      <Link href={`/collection/${collection.slug}`} className="block">
        <div
          className="relative bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden transition-all duration-300 group-hover:border-[var(--accent)]/40"
          style={{
            // @ts-expect-error -- custom property for themed glow
            '--card-theme': themeColor,
          }}
        >
          {/* Hover glow overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
            style={{
              boxShadow: `inset 0 0 40px ${themeColor}15, 0 0 25px ${themeColor}10`,
            }}
          />

          {/* Banner */}
          <div className="relative h-28 sm:h-32 overflow-hidden">
            {collection.banner ? (
              <Image
                src={collection.banner}
                alt={`${collection.name} banner`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${themeColor}30 0%, var(--bg-primary) 60%, ${themeColor}15 100%)`,
                }}
              />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent" />

            {/* Category badge */}
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="info" size="sm">{collection.category}</Badge>
            </div>

            {/* For Sale badge */}
            {isForSale && (
              <div className="absolute top-3 left-3 z-10">
                <Badge variant="success" size="sm">
                  <DollarSign size={10} />
                  FOR SALE
                </Badge>
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="relative px-4 -mt-8 z-10">
            <div
              className="w-16 h-16 rounded-full border-[3px] overflow-hidden bg-[var(--bg-primary)]"
              style={{ borderColor: themeColor }}
            >
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={collection.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-lg font-bold font-[family-name:var(--font-display)]"
                  style={{ background: `${themeColor}20`, color: themeColor }}
                >
                  {collection.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="px-4 pt-2 pb-4">
            {/* Name & Verified */}
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                {collection.name}
              </h3>
              {isVerified && (
                <CheckCircle
                  size={14}
                  className="shrink-0"
                  style={{ color: themeColor }}
                  fill={themeColor}
                  stroke="var(--bg-secondary)"
                />
              )}
            </div>

            {/* Creator */}
            <p className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--text-secondary)] mb-3">
              by {shortenAddress(collection.creator || collection.owner)}
            </p>

            {/* Stats row */}
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <div className="flex items-center gap-1" title="Items">
                <Layers size={11} className="opacity-60" />
                <span className="text-[10px] font-[family-name:var(--font-mono)]">
                  {collection.stats.items.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-1" title="Floor Price">
                <Tag size={11} className="opacity-60" />
                <span className="text-[10px] font-[family-name:var(--font-mono)]">
                  {formatChainCurrency(collection.stats.floorPrice, activeChain)}
                </span>
              </div>

              <div className="flex items-center gap-1" title="Listed">
                <BarChart3 size={11} className="opacity-60" />
                <span className="text-[10px] font-[family-name:var(--font-mono)]">
                  {collection.stats.listed}
                </span>
              </div>
            </div>

            {/* Sale price bar */}
            {isForSale && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-1.5">
                  <ShoppingCart size={12} className="text-[var(--color-electric-lime)]" />
                  <span className="text-xs font-semibold font-[family-name:var(--font-mono)] text-[var(--color-electric-lime)]">
                    {collection.salePrice} {collection.saleCurrency || (collection.chain === 'polygon' ? 'POL' : 'SOL')}
                  </span>
                </div>
                <span className="text-[9px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                  Buy Collection
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
