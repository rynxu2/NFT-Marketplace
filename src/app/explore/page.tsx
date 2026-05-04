'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import NFTGrid from '@/components/nft/NFTGrid';
import Input from '@/components/ui/Input';
import { mockNFTs } from '@/data/mock';
import { CATEGORIES, SORT_OPTIONS } from '@/lib/constants';
import type { SortOption } from '@/types/nft';

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const filteredNFTs = useMemo(() => {
    let result = [...mockNFTs];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) => n.name.toLowerCase().includes(q) || n.collection?.toLowerCase().includes(q)
      );
    }

    if (category !== 'All') {
      result = result.filter((n) => {
        const col = n.collection?.toLowerCase() || '';
        return col.includes(category.toLowerCase()) || Math.random() > 0.5;
      });
    }

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
  }, [search, category, sortBy]);

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
          Browse and discover digital collectibles from the Cyber Nexus universe
        </p>
      </motion.div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
        </button>
      </div>

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
      <NFTGrid nfts={filteredNFTs} />
    </div>
  );
}
