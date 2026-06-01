'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  ExternalLink,
  Settings,
  Layers,
  Users,
  Tag,
  BarChart3,
  TrendingUp,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import type { Collection } from '@/types/collection';
import { formatChainCurrency } from '@/types/chain';
import { useChainStore } from '@/store/useChainStore';
import { shortenAddress } from '@/lib/solana/connection';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface CollectionBannerProps {
  collection: Collection;
  isOwner: boolean;
  onSellClick?: () => void;
  onBuyClick?: () => void;
  onCancelSaleClick?: () => void;
}

function SocialIcon({ type }: { type: 'twitter' | 'discord' | 'website' }) {
  if (type === 'twitter') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (type === 'discord') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    );
  }
  return <ExternalLink size={16} />;
}

export default function CollectionBanner({ collection, isOwner, onSellClick, onBuyClick, onCancelSaleClick }: CollectionBannerProps) {
  const themeColor = collection.theme_color || collection.themeColor || 'var(--accent)';
  const logoSrc = collection.logo || collection.image;
  const isVerified = collection.isVerified ?? collection.verified;
  const isForSale = collection.forSale && collection.salePrice;
  const socials = collection.social_links || collection.socialLinks;
  const { activeChain } = useChainStore();

  const stats = [
    { label: 'Items', value: collection.stats.items.toLocaleString(), icon: Layers },
    { label: 'Holders', value: collection.stats.owners.toLocaleString(), icon: Users },
    { label: 'Floor', value: null, formatted: formatChainCurrency(collection.stats.floorPrice, activeChain), icon: Tag },
    { label: 'Volume', value: null, formatted: formatChainCurrency(collection.stats.totalVolume, activeChain), icon: TrendingUp },
    { label: 'Listed', value: collection.stats.listed.toLocaleString(), icon: BarChart3 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Banner image */}
      <div className="relative w-full h-48 sm:h-64 overflow-hidden">
        {collection.banner ? (
          <Image
            src={collection.banner}
            alt={`${collection.name} banner`}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${themeColor}40 0%, var(--bg-primary) 50%, ${themeColor}20 100%)`,
            }}
          />
        )}
        {/* Gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
      </div>

      {/* Content section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 -mt-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
          className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6"
        >
          {/* Logo */}
          <div
            className="w-20 h-20 rounded-full border-4 overflow-hidden bg-[var(--bg-primary)] shrink-0 shadow-xl"
            style={{ borderColor: themeColor }}
          >
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={collection.name}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl font-bold font-[family-name:var(--font-display)]"
                style={{ background: `${themeColor}20`, color: themeColor }}
              >
                {collection.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-2">
            {/* Name row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
                {collection.name}
              </h1>
              {isVerified && (
                <CheckCircle
                  size={18}
                  style={{ color: themeColor }}
                  fill={themeColor}
                  stroke="var(--bg-primary)"
                />
              )}
              <Badge variant="info" size="sm">{collection.category}</Badge>
              {isForSale && (
                <Badge variant="success" size="sm">
                  <DollarSign size={10} />
                  FOR SALE
                </Badge>
              )}
            </div>

            {/* Description */}
            {collection.description && (
              <p className="mt-2 text-sm text-[var(--text-secondary)] font-[family-name:var(--font-body)] line-clamp-2 max-w-2xl">
                {collection.description}
              </p>
            )}

            {/* Owner info */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                Owner
              </span>
              <Link
                href={`/profile/${collection.owner}`}
                className="text-xs font-[family-name:var(--font-mono)] text-[var(--accent)] hover:underline"
              >
                {shortenAddress(collection.owner)}
              </Link>
            </div>

            {/* Social links */}
            {socials && (socials.twitter || socials.discord || socials.website) && (
              <div className="flex items-center gap-3 mt-3">
                {socials.twitter && (
                  <a
                    href={socials.twitter.startsWith('http') ? socials.twitter : `https://x.com/${socials.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    aria-label="Twitter"
                  >
                    <SocialIcon type="twitter" />
                  </a>
                )}
                {socials.discord && (
                  <a
                    href={socials.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    aria-label="Discord"
                  >
                    <SocialIcon type="discord" />
                  </a>
                )}
                {socials.website && (
                  <a
                    href={socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    aria-label="Website"
                  >
                    <SocialIcon type="website" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0 sm:pt-2 flex items-center gap-2">
            {isOwner && (
              <Link href={`/collection/${collection.slug}/manage`}>
                <Button variant="secondary" size="sm">
                  <Settings size={14} />
                  Manage
                </Button>
              </Link>
            )}
            {isOwner && !collection.forSale && onSellClick && (
              <Button variant="cyber-lime" size="sm" onClick={onSellClick}>
                <DollarSign size={14} />
                Sell Collection
              </Button>
            )}
            {isOwner && collection.forSale && onCancelSaleClick && (
              <Button variant="danger" size="sm" onClick={onCancelSaleClick}>
                Cancel Sale
              </Button>
            )}
            {!isOwner && isForSale && onBuyClick && (
              <Button variant="primary" size="sm" onClick={onBuyClick}>
                <ShoppingCart size={14} />
                Buy — {collection.salePrice} {collection.saleCurrency || (collection.chain === 'polygon' ? 'POL' : 'SOL')}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 20 }}
          className="mt-6 grid grid-cols-3 sm:grid-cols-5 gap-px bg-[var(--border-color)] border border-[var(--border-color)] overflow-hidden"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[var(--bg-secondary)] px-4 py-3 text-center"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <stat.icon size={12} className="text-[var(--text-secondary)]" />
                <p className="text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                  {stat.label}
                </p>
              </div>
              <p className="text-sm font-semibold font-[family-name:var(--font-mono)] text-[var(--text-primary)]">
                {stat.formatted || stat.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Sale Banner — visible to everyone when collection is for sale */}
        {isForSale && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
            className="mt-4 border border-[var(--color-electric-lime)]/30 bg-[var(--color-electric-lime)]/5 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4">
              {/* Left: Sale info */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[var(--color-electric-lime)]/10 border border-[var(--color-electric-lime)]/20">
                  <ShoppingCart size={20} className="text-[var(--color-electric-lime)]" />
                </div>
                <div>
                  <p className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--color-electric-lime)]">
                    Collection For Sale
                  </p>
                  <p className="text-lg font-bold font-[family-name:var(--font-mono)] text-[var(--text-primary)] mt-0.5">
                    {collection.salePrice} {collection.saleCurrency || (collection.chain === 'polygon' ? 'POL' : 'SOL')}
                  </p>
                </div>
              </div>

              {/* Right: Buy button (non-owner) or Cancel (owner) */}
              <div className="flex items-center gap-3">
                {!isOwner && onBuyClick && (
                  <Button variant="cyber-lime" size="sm" onClick={onBuyClick}>
                    <ShoppingCart size={14} />
                    Buy Entire Collection
                  </Button>
                )}
                {isOwner && onCancelSaleClick && (
                  <Button variant="danger" size="sm" onClick={onCancelSaleClick}>
                    Cancel Sale
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
