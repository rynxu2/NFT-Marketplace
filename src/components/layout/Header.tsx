'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, Zap, Sun, Moon, Wallet } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useTheme } from 'next-themes';
import { shortenAddress, formatSOL, getNetwork } from '@/lib/solana/connection';
import { useBalance } from '@/hooks/useBalance';
import ChainSwitcher from '@/components/layout/ChainSwitcher';

const NAV_LINKS = [
  { href: '/', label: 'HOME' },
  { href: '/explore', label: 'EXPLORE' },
  { href: '/auctions', label: 'AUCTIONS' },
  { href: '/create', label: 'CREATE' },
  { href: '/activity', label: 'ACTIVITY' },
  { href: '/stats', label: 'STATS' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();
  const { theme, setTheme } = useTheme();
  const { balance } = useBalance();
  const network = getNetwork();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
      <div className="max-w-[80rem] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Zap className="h-7 w-7 text-[var(--accent)] group-hover:drop-shadow-[0_0_8px_var(--accent-glow)] transition-all" />
            </div>
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-wider text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
              NEXUS
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative px-4 py-2 text-xs font-[family-name:var(--font-display)] tracking-wider
                  transition-colors duration-200
                  ${pathname === link.href
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
              aria-label="Toggle search"
            >
              <Search size={18} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {mounted ? (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} />}
            </button>

            {/* Chain Switcher */}
            <ChainSwitcher />

            {/* Network Badge */}
            <span className={`hidden sm:inline-block px-2 py-0.5 text-[9px] font-[family-name:var(--font-mono)] font-bold uppercase tracking-wider ${
              network === 'devnet'
                ? 'bg-[var(--color-signal-orange)]/20 text-[var(--color-signal-orange)]'
                : 'bg-[var(--color-electric-lime)]/20 text-[var(--color-electric-lime)]'
            }`}>
              {network === 'devnet' ? 'TESTNET' : 'MAINNET'}
            </span>

            {/* Wallet / Profile */}
            {connected && publicKey ? (
              <Link
                href={`/profile/${publicKey.toBase58()}`}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-[var(--border-color)] text-xs font-[family-name:var(--font-mono)] text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--color-electric-lime)] animate-pulse" />
                {balance !== null && (
                  <span className="text-[var(--text-primary)]">◎{formatSOL(balance)}</span>
                )}
                <span className="text-[var(--text-secondary)]">{shortenAddress(publicKey.toBase58())}</span>
              </Link>
            ) : null}

            <div className="hidden sm:block">
              <WalletMultiButton />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Bar (expandable) */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[var(--border-color)]"
            >
              <div className="py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search NFTs, collections, artists..."
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 pl-10 pr-4 py-2.5 text-sm font-[family-name:var(--font-body)] focus:outline-none focus:border-[var(--accent)]"
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-[var(--bg-secondary)] border-t border-[var(--border-color)]"
          >
            <nav className="flex flex-col p-4 gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    px-4 py-3 text-xs font-[family-name:var(--font-display)] tracking-wider
                    border-l-2 transition-colors
                    ${pathname === link.href
                      ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile wallet info */}
              {connected && publicKey && (
                <Link
                  href={`/profile/${publicKey.toBase58()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 mt-2 border border-[var(--border-color)] bg-[var(--bg-primary)]"
                >
                  <div className="w-2 h-2 rounded-full bg-[var(--color-electric-lime)] animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase">Wallet</p>
                    <p className="text-xs font-[family-name:var(--font-mono)] text-[var(--accent)] truncate">
                      {shortenAddress(publicKey.toBase58())}
                    </p>
                  </div>
                  {balance !== null && (
                    <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-primary)]">
                      ◎{formatSOL(balance)}
                    </span>
                  )}
                </Link>
              )}

              {/* Mobile network + theme */}
              <div className="flex items-center gap-3 pt-3 mt-2 border-t border-[var(--border-color)]">
                <span className={`px-2 py-0.5 text-[9px] font-[family-name:var(--font-mono)] font-bold uppercase tracking-wider ${
                  network === 'devnet'
                    ? 'bg-[var(--color-signal-orange)]/20 text-[var(--color-signal-orange)]'
                    : 'bg-[var(--color-electric-lime)]/20 text-[var(--color-electric-lime)]'
                }`}>
                  {network === 'devnet' ? 'DEVNET' : 'MAINNET'}
                </span>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  {mounted ? (theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />) : <Sun size={16} />}
                </button>
                <div className="ml-auto">
                  <WalletMultiButton />
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
