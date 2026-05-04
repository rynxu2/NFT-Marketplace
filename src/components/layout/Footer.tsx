'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Globe, ExternalLink, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
      <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Zap className="h-6 w-6 text-[var(--accent)]" />
              <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-wider">
                NEXUS
              </span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              The futuristic NFT marketplace built on Solana. Trade, create, and collect digital assets at the speed of light.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-xs uppercase tracking-wider text-[var(--accent)] mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2">
              {['Explore', 'Collections', 'Activity', 'Rankings'].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${item.toLowerCase()}`}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Create */}
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-xs uppercase tracking-wider text-[var(--accent)] mb-4">
              Create
            </h4>
            <ul className="space-y-2">
              {['Mint NFT', 'Create Collection', 'List for Sale', 'Create Auction'].map((item) => (
                <li key={item}>
                  <Link
                    href="/create"
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-xs uppercase tracking-wider text-[var(--accent)] mb-4">
              Community
            </h4>
            <div className="flex items-center gap-3">
              {[
                { icon: Globe, href: '#', label: 'Twitter' },
                { icon: MessageCircle, href: '#', label: 'Discord' },
                { icon: ExternalLink, href: '#', label: 'GitHub' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-2.5 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-secondary)] font-[family-name:var(--font-mono)]">
            © 2026 NEXUS MARKETPLACE — BUILT ON SOLANA
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Powered by <span className="text-[var(--accent)]">Solana Devnet</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
