'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useChainStore } from '@/store/useChainStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount, useDisconnect as useWagmiDisconnect } from 'wagmi';
import { shortenAddress } from '@/lib/solana/connection';
import { weiToEth } from '@/lib/polygon/connection';
import { useBalance as useWagmiBalance } from 'wagmi';
import { useChainWallet } from '@/hooks/useChainWallet';
import { CHAIN_CONFIGS } from '@/types/chain';
import { Wallet, LogOut } from 'lucide-react';
import WalletPickerModal from './WalletPickerModal';

export default function ChainWalletButton({ compact = false }: { compact?: boolean }) {
  const { activeChain } = useChainStore();

  if (activeChain === 'polygon') {
    return <PolygonWalletButton compact={compact} />;
  }

  return <SolanaWalletButton compact={compact} />;
}

function SolanaWalletButton({ compact }: { compact: boolean }) {
  const { connected, address, balance } = useChainWallet();
  const { disconnect } = useWallet();
  const config = CHAIN_CONFIGS.solana;
  const [showPicker, setShowPicker] = useState(false);

  if (!connected) {
    return (
      <>
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--bg-primary)] text-xs font-[family-name:var(--font-display)] uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Wallet size={14} />
          {compact ? '' : 'Connect'}
        </button>
        <WalletPickerModal isOpen={showPicker} onClose={() => setShowPicker(false)} />
      </>
    );
  }

  const formattedBalance = balance !== null ? balance.toFixed(4) : '0.00';

  return (
    <div className="flex items-center gap-1">
      {/* Balance + Address → links to profile */}
      <Link
        href={`/profile/${address}`}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs hover:border-[var(--accent)]/40 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-[var(--color-electric-lime)] animate-pulse" />
        <span className="font-[family-name:var(--font-mono)] text-[var(--text-primary)] flex gap-1 items-center" style={{ color: config.color }}>
          {config.icon} {formattedBalance}
        </span>
        <span className="text-[var(--text-secondary)] font-[family-name:var(--font-mono)]">
          {shortenAddress(address || '')}
        </span>
      </Link>
      {/* Disconnect */}
      <button
        onClick={() => disconnect()}
        className="p-2 text-[var(--text-secondary)] hover:text-[var(--color-crimson)] transition-colors cursor-pointer"
        title="Disconnect"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}

function PolygonWalletButton({ compact }: { compact: boolean }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useWagmiDisconnect();
  const { data: balance } = useWagmiBalance({ address });
  const config = CHAIN_CONFIGS.polygon;
  const [showPicker, setShowPicker] = useState(false);

  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--bg-primary)] text-xs font-[family-name:var(--font-display)] uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Wallet size={14} />
          {compact ? '' : 'Connect'}
        </button>
        <WalletPickerModal isOpen={showPicker} onClose={() => setShowPicker(false)} />
      </>
    );
  }

  const formattedBalance = balance ? weiToEth(balance.value).toFixed(4) : '0.00';

  return (
    <div className="flex items-center gap-1">
      {/* Balance + Address → links to profile */}
      <Link
        href={`/profile/${address}`}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs hover:border-[var(--accent)]/40 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-[var(--color-electric-lime)] animate-pulse" />
        <span className="font-[family-name:var(--font-mono)] text-[var(--text-primary)] flex gap-1" style={{ color: config.color }}>
          {config.icon} {formattedBalance}
        </span>
        <span className="text-[var(--text-secondary)] font-[family-name:var(--font-mono)]">
          {shortenAddress(address || '')}
        </span>
      </Link>
      {/* Disconnect */}
      <button
        onClick={() => disconnect()}
        className="p-2 text-[var(--text-secondary)] hover:text-[var(--color-crimson)] transition-colors cursor-pointer"
        title="Disconnect"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
