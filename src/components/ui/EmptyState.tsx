'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Gavel, Activity, ImageOff, Wallet } from 'lucide-react';
import Button from './Button';

type EmptyVariant = 'nft' | 'explore' | 'auction' | 'activity' | 'collection' | 'profile' | 'listing' | 'generic';

interface EmptyStateProps {
  variant?: EmptyVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const VARIANTS: Record<EmptyVariant, { icon: React.ElementType; title: string; description: string; actionLabel: string; actionHref: string }> = {
  nft: {
    icon: ImageOff,
    title: 'NFT Not Found',
    description: 'This NFT doesn\'t exist or hasn\'t been minted yet.',
    actionLabel: 'EXPLORE NFTS',
    actionHref: '/explore',
  },
  explore: {
    icon: Search,
    title: 'No NFTs Yet',
    description: 'Be the first to mint an NFT on the marketplace.',
    actionLabel: 'CREATE NFT',
    actionHref: '/create',
  },
  auction: {
    icon: Gavel,
    title: 'No Auctions',
    description: 'There are no live auctions right now. Check back later or create one.',
    actionLabel: 'EXPLORE',
    actionHref: '/explore',
  },
  activity: {
    icon: Activity,
    title: 'No Activity Yet',
    description: 'Marketplace activity will appear here once transactions happen.',
    actionLabel: 'EXPLORE NFTS',
    actionHref: '/explore',
  },
  collection: {
    icon: ImageOff,
    title: 'Collection Not Found',
    description: 'This collection doesn\'t exist or has no NFTs yet.',
    actionLabel: 'EXPLORE',
    actionHref: '/explore',
  },
  profile: {
    icon: Wallet,
    title: 'No NFTs',
    description: 'This wallet hasn\'t minted or collected any NFTs yet.',
    actionLabel: 'CREATE NFT',
    actionHref: '/create',
  },
  listing: {
    icon: Plus,
    title: 'No Listings',
    description: 'No NFTs are listed for sale. Be the first to list one!',
    actionLabel: 'CREATE NFT',
    actionHref: '/create',
  },
  generic: {
    icon: Search,
    title: 'Nothing Here',
    description: 'No data to display at the moment.',
    actionLabel: 'GO HOME',
    actionHref: '/',
  },
};

export default function EmptyState({
  variant = 'generic',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const config = VARIANTS[variant];
  const Icon = config.icon;
  const finalTitle = title || config.title;
  const finalDesc = description || config.description;
  const finalAction = actionLabel || config.actionLabel;
  const finalHref = actionHref || config.actionHref;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      {/* Icon container with glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[var(--accent)]/10 blur-2xl rounded-full" />
        <div className="relative w-20 h-20 border border-[var(--accent)]/20 bg-[var(--bg-secondary)] flex items-center justify-center">
          <Icon size={28} className="text-[var(--accent)]/60" />
        </div>
      </div>

      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-wider mb-2 text-[var(--text-primary)]">
        {finalTitle}
      </h3>

      <p className="text-sm text-[var(--text-secondary)] max-w-[20rem] leading-relaxed mb-6">
        {finalDesc}
      </p>

      {onAction ? (
        <Button size="md" onClick={onAction}>
          <Plus size={14} />
          {finalAction}
        </Button>
      ) : (
        <Link href={finalHref}>
          <Button size="md">
            <Plus size={14} />
            {finalAction}
          </Button>
        </Link>
      )}

      {/* Decorative grid lines */}
      <div className="mt-8 w-48 h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />
    </motion.div>
  );
}
