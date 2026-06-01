'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Grid3X3, LayoutList, TrendingUp, Package, Plus, Search, ShoppingCart, DollarSign } from 'lucide-react';
import { useFetchCollections } from '@/hooks/useCollections';
import { useChainStore } from '@/store/useChainStore';
import { useChainWallet } from '@/hooks/useChainWallet';
import { formatChainCurrency, CHAIN_CONFIGS } from '@/types/chain';
import { COLLECTION_CATEGORIES } from '@/types/collection';
import { shortenAddress } from '@/lib/solana/connection';
import CollectionCard from '@/components/collections/CollectionCard';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

export default function CollectionsPage() {
  const { activeChain } = useChainStore();
  const { connected } = useChainWallet();
  const chainConfig = CHAIN_CONFIGS[activeChain];
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [forSaleOnly, setForSaleOnly] = useState(false);

  const { collections: allCollections, loading } = useFetchCollections({
    search: search || undefined,
    category: category || undefined,
  });

  const collections = forSaleOnly
    ? allCollections.filter((c) => c.forSale && c.salePrice)
    : allCollections;
  
  const forSaleCount = allCollections.filter((c) => c.forSale && c.salePrice).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">
              COLLECTIONS
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Browse curated NFT collections on <span style={{ color: chainConfig.color }} className='flex gap-1 items-center'>  {chainConfig.icon} {chainConfig.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {connected && (
              <Link href="/collections/create">
                <button className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-black text-xs font-[family-name:var(--font-display)] uppercase tracking-wider hover:shadow-[0_0_15px_var(--accent-glow)] transition-all cursor-pointer">
                  <Plus size={14} /> Create
                </button>
              </Link>
            )}

            <div className="hidden sm:flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors cursor-pointer ${viewMode === 'grid' ? 'text-[var(--accent)] bg-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors cursor-pointer ${viewMode === 'list' ? 'text-[var(--accent)] bg-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                <LayoutList size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              placeholder="Search collections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            <option value="">All Categories</option>
            {COLLECTION_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          {/* For Sale filter */}
          <button
            onClick={() => setForSaleOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-[family-name:var(--font-display)] uppercase tracking-wider border transition-all cursor-pointer ${
              forSaleOnly
                ? 'border-[var(--color-electric-lime)] text-[var(--color-electric-lime)] bg-[var(--color-electric-lime)]/10 shadow-[0_0_10px_rgba(163,255,18,0.2)]'
                : 'border-[var(--border-color)] text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:border-[var(--color-electric-lime)]/50 hover:text-[var(--color-electric-lime)]'
            }`}
          >
            <ShoppingCart size={12} />
            For Sale
            {forSaleCount > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 text-[9px] ${
                forSaleOnly ? 'bg-[var(--color-electric-lime)]/20' : 'bg-[var(--border-color)]'
              }`}>
                {forSaleCount}
              </span>
            )}
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 mt-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5">
            <Package size={12} className="text-[var(--accent)]" />
            {collections.length} Collections
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingUp size={12} className="text-[var(--accent)]" />
            {collections.reduce((acc, c) => acc + c.stats.items, 0)} Total NFTs
          </span>
        </div>
      </motion.div>

      {collections.length === 0 ? (
        <EmptyState variant="collection" />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {collections.map((col, index) => (
              <CollectionCard key={col.id} collection={col} index={index} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-b border-[var(--border-color)] text-[9px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
            <span>Collection</span>
            <span className="text-right">Floor Price</span>
            <span className="text-right">Volume</span>
            <span className="text-right">Items</span>
            <span className="text-right">Listed</span>
          </div>

          {collections.map((col, index) => (
            <Link
              key={col.id}
              href={`/collection/${col.slug}`}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)]/50 transition-colors group items-center"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--text-secondary)] w-5">{index + 1}</span>
                <div className="w-10 h-10 bg-[var(--bg-primary)] overflow-hidden shrink-0 rounded-full">
                  {col.logo ? (
                    <Image src={col.logo} alt={col.name} width={40} height={40} className="object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: col.themeColor || 'var(--accent)' }} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                    {col.name}
                    {col.isVerified && <span className="ml-1 text-[var(--accent)]">✓</span>}
                  </p>
                  <p className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">
                    by {shortenAddress(col.owner)}
                  </p>
                </div>
                {/* For Sale badge in list view */}
                {col.forSale && col.salePrice && (
                  <Badge variant="success" size="sm">
                    <DollarSign size={9} />
                    {col.salePrice} {col.saleCurrency || (col.chain === 'polygon' ? 'POL' : 'SOL')}
                  </Badge>
                )}
              </div>
              <p className="text-right text-xs font-[family-name:var(--font-mono)] text-[var(--accent)]">
                {col.stats.floorPrice > 0 ? formatChainCurrency(col.stats.floorPrice, activeChain) : '—'}
              </p>
              <p className="text-right text-xs font-[family-name:var(--font-mono)]">
                {col.stats.totalVolume > 0 ? formatChainCurrency(col.stats.totalVolume, activeChain) : '—'}
              </p>
              <p className="text-right text-xs font-[family-name:var(--font-mono)]">{col.stats.items}</p>
              <p className="text-right text-xs font-[family-name:var(--font-mono)]">{col.stats.listed}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
