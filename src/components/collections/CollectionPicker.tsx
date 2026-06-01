'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Plus, Layers, FolderOpen } from 'lucide-react';
import type { Collection } from '@/types/collection';

interface CollectionPickerProps {
  value: string | null;
  onChange: (collectionId: string | null, collectionName: string | null) => void;
  ownerAddress: string | null;
  chain: 'solana' | 'polygon';
}

export default function CollectionPicker({
  value,
  onChange,
  ownerAddress,
  chain,
}: CollectionPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCollection = collections.find((c) => c.id === value || c.slug === value);
  const displayName = selectedCollection ? selectedCollection.name : 'No Collection';

  // Fetch user collections
  const fetchCollections = useCallback(async () => {
    if (!ownerAddress) {
      setCollections([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/collections?owner=${encodeURIComponent(ownerAddress)}&chain=${chain}`
      );
      if (res.ok) {
        const json = await res.json();
        const items = json.data || json.collections || (Array.isArray(json) ? json : []);
        setCollections(items);
      }
    } catch {
      // silently fail — user sees empty list
    } finally {
      setLoading(false);
    }
  }, [ownerAddress, chain]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const filtered = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(col: Collection | null) {
    if (col) {
      onChange(col.id || col.slug, col.name);
    } else {
      onChange(null, null);
    }
    setOpen(false);
    setSearch('');
  }

  return (
    <div ref={containerRef} className="relative w-full">

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`
          w-full flex items-center gap-3
          bg-[var(--bg-primary)] border border-[var(--border-color)]
          text-[var(--text-primary)] px-4 py-3 text-sm
          font-[family-name:var(--font-body)]
          transition-all duration-300
          cursor-pointer
          ${open ? 'border-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]' : 'hover:border-[var(--text-secondary)]/30'}
        `}
      >
        {selectedCollection?.logo ? (
          <Image
            src={selectedCollection.logo}
            alt=""
            width={24}
            height={24}
            className="rounded-full object-cover shrink-0"
          />
        ) : (
          <FolderOpen size={16} className="text-[var(--text-secondary)] shrink-0" />
        )}
        <span className="flex-1 text-left truncate">
          {value ? displayName : 'Independent (No Collection)'}
        </span>
        <ChevronDown
          size={16}
          className={`text-[var(--text-secondary)] transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl max-h-72 overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-[var(--border-color)]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search collections..."
                  autoFocus
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 pl-9 pr-3 py-2 text-xs font-[family-name:var(--font-body)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {/* Options */}
            <div className="overflow-y-auto max-h-48 scrollbar-thin">
              {/* Independent option */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm cursor-pointer
                  transition-colors duration-150
                  ${!value ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'}
                `}
              >
                <Layers size={16} className="shrink-0 opacity-60" />
                <span className="font-[family-name:var(--font-body)]">Independent (No Collection)</span>
              </button>

              {/* Loading */}
              {loading && (
                <div className="px-4 py-6 text-center">
                  <div className="inline-block w-5 h-5 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
                </div>
              )}

              {/* Collections list */}
              {!loading && filtered.map((col) => {
                const isSelected = (col.id === value) || (col.slug === value);
                return (
                  <button
                    key={col.id || col.slug}
                    type="button"
                    onClick={() => handleSelect(col)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm cursor-pointer
                      transition-colors duration-150
                      ${isSelected ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}
                    `}
                  >
                    {col.logo ? (
                      <Image
                        src={col.logo}
                        alt=""
                        width={24}
                        height={24}
                        className="rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          background: `${col.themeColor || 'var(--accent)'}20`,
                          color: col.themeColor || 'var(--accent)',
                        }}
                      >
                        {col.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-[family-name:var(--font-body)]">{col.name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] font-[family-name:var(--font-mono)]">
                        {(() => {
                          const stats = col.stats as unknown as Record<string, unknown> | undefined;
                          const count = (stats?.items ?? stats?.item_count ?? 0) as number;
                          return `${count} item${count !== 1 ? 's' : ''}`;
                        })()}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Empty state */}
              {!loading && filtered.length === 0 && search && (
                <p className="px-4 py-4 text-xs text-[var(--text-secondary)] text-center">
                  No collections match &ldquo;{search}&rdquo;
                </p>
              )}
            </div>

            {/* Create new */}
            <a
              href="/collections/create"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 border-t border-[var(--border-color)] text-[var(--accent)] text-xs font-[family-name:var(--font-display)] uppercase tracking-wider hover:bg-[var(--accent)]/5 transition-colors"
            >
              <Plus size={14} />
              Create New Collection
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
