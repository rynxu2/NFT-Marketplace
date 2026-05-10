'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import NFTGrid from '@/components/nft/NFTGrid';
import Input from '@/components/ui/Input';
import { useFetchNFTs, useFetchListings } from '@/hooks/useData';
import { CATEGORIES, SORT_OPTIONS } from '@/lib/constants';
import type { SortOption } from '@/types/nft';

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showListedOnly, setShowListedOnly] = useState(false);
  const { nfts: allNFTs, loading } = useFetchNFTs();
  const { listings } = useFetchListings();

  // Build a set of listed mints for quick lookup
  const listedMints = useMemo(() => new Set(listings.map((l) => l.mint)), [listings]);

  const filteredNFTs = useMemo(() => {
    let result = [...allNFTs];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) => n.name.toLowerCase().includes(q) || n.collection?.toLowerCase().includes(q)
      );
    }

    // Category
    if (category !== 'All') {
      result = result.filter((n) => {
        const col = n.collection?.toLowerCase() || '';
        return col.includes(category.toLowerCase());
      });
    }

    // Listed only
    if (showListedOnly) {
      result = result.filter((n) => listedMints.has(n.mint) || n.listed);
    }

    // Price range
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!isNaN(min)) {
      result = result.filter((n) => {
        const listing = listings.find((l) => l.mint === n.mint);
        const price = listing?.price || n.price || 0;
        return price >= min;
      });
    }
    if (!isNaN(max)) {
      result = result.filter((n) => {
        const listing = listings.find((l) => l.mint === n.mint);
        const price = listing?.price || n.price || 0;
        return price <= max || price === 0;
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [allNFTs, listings, listedMints, search, category, sortBy, showListedOnly, priceMin, priceMax]);

  const activeFilterCount = [
    category !== 'All',
    showListedOnly,
    priceMin !== '',
    priceMax !== '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCategory('All');
    setShowListedOnly(false);
    setPriceMin('');
    setPriceMax('');
  };

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold uppercase tracking-wider mb-2">
          Explore NFTs
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Browse and discover digital collectibles
        </p>
      </motion.div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, collection..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 text-sm font-[family-name:var(--font-body)] focus:outline-none focus:border-[var(--accent)] appearance-none cursor-pointer min-w-[180px]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 border text-sm font-[family-name:var(--font-display)] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${showFilters ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-[var(--accent)] text-[var(--bg-primary)] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)]">
                  Advanced Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--color-crimson)] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X size={12} />
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Price Range */}
                <div>
                  <label className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider block mb-2">
                    Price Range (SOL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] w-full"
                    />
                    <span className="text-[var(--text-secondary)] self-center text-xs">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] w-full"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider block mb-2">
                    Status
                  </label>
                  <button
                    onClick={() => setShowListedOnly(!showListedOnly)}
                    className={`px-4 py-2 text-xs font-[family-name:var(--font-display)] uppercase tracking-wider border transition-all cursor-pointer w-full ${
                      showListedOnly
                        ? 'border-[var(--color-electric-lime)] text-[var(--color-electric-lime)] bg-[var(--color-electric-lime)]/10'
                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30'
                    }`}
                  >
                    {showListedOnly ? '✓ Listed Only' : 'Show All'}
                  </button>
                </div>

                {/* Results Info */}
                <div className="flex items-end">
                  <p className="text-xs text-[var(--text-secondary)] font-[family-name:var(--font-mono)] pb-2">
                    {filteredNFTs.length} results
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 text-xs font-[family-name:var(--font-display)] uppercase tracking-wider border transition-all cursor-pointer ${
              category === cat
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-[var(--text-secondary)] mb-4 font-[family-name:var(--font-mono)]">
        {filteredNFTs.length} items found
      </p>

      {/* NFT Grid */}
      <NFTGrid nfts={filteredNFTs} loading={loading} emptyMessage="No NFTs found. Be the first to mint one!" />
    </div>
  );
}
