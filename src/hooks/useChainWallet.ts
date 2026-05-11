'use client';

import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount, useBalance as useWagmiBalance } from 'wagmi';
import { useChainStore } from '@/store/useChainStore';
import { weiToEth } from '@/lib/polygon/connection';

export interface UnifiedWallet {
  address: string | null;
  connected: boolean;
  chain: 'solana' | 'polygon';
  balance: number | null;
}

/**
 * Unified wallet hook that returns the active wallet based on selected chain.
 * Solana → Phantom/Solflare via @solana/wallet-adapter
 * Polygon → MetaMask via wagmi
 */
export function useChainWallet(): UnifiedWallet {
  const { activeChain } = useChainStore();
  const solanaWallet = useWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { data: evmBalance } = useWagmiBalance({ address: evmAddress });

  return useMemo(() => {
    if (activeChain === 'polygon') {
      return {
        address: evmAddress || null,
        connected: evmConnected,
        chain: 'polygon' as const,
        balance: evmBalance ? weiToEth(evmBalance.value) : null,
      };
    }

    return {
      address: solanaWallet.publicKey?.toBase58() || null,
      connected: solanaWallet.connected,
      chain: 'solana' as const,
      balance: null, // handled by existing useBalance hook
    };
  }, [activeChain, solanaWallet.publicKey, solanaWallet.connected, evmAddress, evmConnected, evmBalance]);
}
