'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useChainStore } from '@/store/useChainStore';
import { CHAIN_CONFIGS, type ChainId } from '@/types/chain';

const chains: ChainId[] = ['solana', 'polygon'];

export default function ChainSwitcher() {
  const { activeChain, setChain } = useChainStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeConfig = CHAIN_CONFIGS[activeChain];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/40 transition-all text-xs font-[family-name:var(--font-display)] uppercase tracking-wider cursor-pointer"
        style={{ borderColor: open ? activeConfig.color : undefined }}
      >
        <span className="text-sm" style={{ color: activeConfig.color }}>
          {activeConfig.icon}
        </span>
        <span className="hidden sm:inline text-[var(--text-primary)]">
          {activeConfig.name}
        </span>
        <ChevronDown
          size={12}
          className={`text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl z-50"
          >
            <div className="p-1">
              {chains.map((chainId) => {
                const config = CHAIN_CONFIGS[chainId];
                const isActive = chainId === activeChain;
                return (
                  <button
                    key={chainId}
                    onClick={() => {
                      setChain(chainId);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[var(--accent)]/10 text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--accent)]/5 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="text-lg" style={{ color: config.color }}>
                      {config.icon}
                    </span>
                    <div>
                      <p className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider">
                        {config.name}
                      </p>
                      <p className="text-[9px] text-[var(--text-secondary)]">
                        {config.testnetName} • {config.currency}
                      </p>
                    </div>
                    {isActive && (
                      <div
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-[var(--border-color)] px-3 py-2">
              <p className="text-[8px] text-[var(--text-secondary)] uppercase tracking-wider">
                Cross-chain bridge available
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
