'use client';

import React, { use, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, Grid, List } from 'lucide-react';
import NFTGrid from '@/components/nft/NFTGrid';
import { mockNFTs } from '@/data/mock';
import { shortenAddress } from '@/lib/solana/connection';

export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const [activeTab, setActiveTab] = useState<'owned' | 'created' | 'listed'>('owned');

  const ownedNFTs = mockNFTs.filter((_, i) => i % 2 === 0);
  const createdNFTs = mockNFTs.filter((_, i) => i % 3 === 0);
  const listedNFTs = mockNFTs.filter((n) => n.listed);

  const nfts = activeTab === 'owned' ? ownedNFTs : activeTab === 'created' ? createdNFTs : listedNFTs;

  const tabs = [
    { id: 'owned' as const, label: 'Owned', count: ownedNFTs.length },
    { id: 'created' as const, label: 'Created', count: createdNFTs.length },
    { id: 'listed' as const, label: 'Listed', count: listedNFTs.length },
  ];

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-10">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 sm:p-8 mb-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent)] to-[var(--color-electric-lime)] flex items-center justify-center text-2xl font-bold text-[var(--bg-primary)] font-[family-name:var(--font-display)]">
            {address.slice(0, 2)}
          </div>

          <div className="flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-wider mb-1">
              User Profile
            </h1>
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--text-secondary)]">
                {shortenAddress(address, 8)}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(address)}
                className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                aria-label="Copy address"
              >
                <Copy size={14} />
              </button>
              <a
                href={`https://solscan.io/account/${address}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Owned', val: ownedNFTs.length },
              { label: 'Created', val: createdNFTs.length },
              { label: 'Listed', val: listedNFTs.length },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-[family-name:var(--font-mono)] text-lg font-bold">{s.val}</p>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-[var(--border-color)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-3 text-xs font-[family-name:var(--font-display)] uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === tab.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-[10px] font-[family-name:var(--font-mono)]">({tab.count})</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="profile-tab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <NFTGrid nfts={nfts} />
    </div>
  );
}
