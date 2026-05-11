'use client';

import { create } from 'zustand';
import type { ChainId } from '@/types/chain';

interface ChainState {
  activeChain: ChainId;
  setChain: (chain: ChainId) => void;
}

export const useChainStore = create<ChainState>()((set) => ({
  activeChain: (typeof window !== 'undefined'
    ? (localStorage.getItem('nexus-chain') as ChainId) || 'solana'
    : 'solana') as ChainId,
  setChain: (chain) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus-chain', chain);
    }
    set({ activeChain: chain });
  },
}));
