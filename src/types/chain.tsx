import React from 'react';
import { getChainIcon } from '@/components/ui/ChainIcon';

export type ChainId = 'solana' | 'polygon';

export interface ChainConfig {
  id: ChainId;
  name: string;
  symbol: string;
  currency: string;
  decimals: number;
  testnetName: string;
  chainIdHex?: string; // EVM chain ID
  rpcUrl: string;
  explorerUrl: string;
  faucetUrl?: string;
  icon: React.ReactNode; // standard SVG icon
  color: string; // CSS color var
}

export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    currency: 'SOL',
    decimals: 9,
    testnetName: 'Devnet',
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_DEVNET || 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    faucetUrl: 'https://faucet.solana.com',
    icon: getChainIcon('solana'),
    color: 'var(--accent)',
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'POL',
    currency: 'POL',
    decimals: 18,
    testnetName: 'Amoy',
    chainIdHex: '0x13882', // 80002
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://rpc-amoy.polygon.technology/',
    explorerUrl: 'https://amoy.polygonscan.com',
    faucetUrl: 'https://faucet.polygon.technology/',
    icon: getChainIcon('polygon'),
    color: 'var(--color-signal-orange)',
  },
};

export function getChainConfig(chain: ChainId): ChainConfig {
  return CHAIN_CONFIGS[chain];
}

export function getChainExplorerUrl(chain: ChainId, hash: string, type: 'tx' | 'address' = 'tx'): string {
  const config = CHAIN_CONFIGS[chain];
  if (chain === 'solana') {
    const cluster = '?cluster=devnet';
    return `${config.explorerUrl}/${type}/${hash}${cluster}`;
  }
  return `${config.explorerUrl}/${type}/${hash}`;
}

export function formatChainCurrency(amount: number, chain: ChainId): React.ReactNode {
  const config = CHAIN_CONFIGS[chain];
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0 align-text-bottom">
      {React.cloneElement(config.icon as React.ReactElement<{ size?: number }>, { size: 14 })}
      <span>{formatted}</span>
    </span>
  );
}
