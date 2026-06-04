'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Wallet, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnect } from 'wagmi';
import { useChainStore } from '@/store/useChainStore';
import { useChainWallet } from '@/hooks/useChainWallet';
import { CHAIN_CONFIGS } from '@/types/chain';
import type { WalletName } from '@solana/wallet-adapter-base';

interface WalletOption {
  name: string;
  icon: string | React.ReactNode;
  detected: boolean;
  onClick: () => void;
}

interface WalletPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletPickerModal({ isOpen, onClose }: WalletPickerModalProps) {
  const { activeChain } = useChainStore();
  const config = CHAIN_CONFIGS[activeChain];

  // --- Solana wallets ---
  const { wallets: solanaWallets, select: selectSolana, connecting: solanaConnecting } = useWallet();

  // --- Polygon wallets ---
  const { connectors, connect: connectPolygon, isPending: polygonConnecting } = useConnect();

  // --- Unified connected state ---
  const { connected } = useChainWallet();

  // Local UI state
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guard: prevent the click event that opened the modal from immediately
  // closing it via the overlay backdrop handler (event bubbles through portal).
  const openedAtRef = useRef<number>(0);

  // Auto-close when connection succeeds
  useEffect(() => {
    if (connected && connectingWallet) {
      // Small delay so user sees the "connected" state briefly
      closeTimerRef.current = setTimeout(() => {
        setConnectingWallet(null);
        setError(null);
        onClose();
      }, 400);
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [connected, connectingWallet, onClose]);

  // Reset state when modal opens & record open timestamp
  useEffect(() => {
    if (isOpen) {
      openedAtRef.current = Date.now();
      setConnectingWallet(null);
      setError(null);
    }
  }, [isOpen]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !connectingWallet) onClose();
    },
    [onClose, connectingWallet]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Handle Solana wallet selection
  // NOTE: We only call selectSolana() here. The WalletProvider has autoConnect
  // enabled, so it will automatically connect once the wallet state updates.
  // Calling connectSolana() manually races against the state update and causes
  // WalletNotSelectedError (emitted via EventEmitter before we can catch it).
  const handleSolanaSelect = useCallback(
    (walletName: string) => {
      setError(null);
      setConnectingWallet(walletName);
      try {
        selectSolana(walletName as WalletName);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed';
        setError(msg);
        setConnectingWallet(null);
      }
    },
    [selectSolana]
  );

  // Handle Polygon wallet selection
  const handlePolygonSelect = useCallback(
    (connector: (typeof connectors)[number]) => {
      setError(null);
      setConnectingWallet(connector.name);
      connectPolygon(
        { connector },
        {
          onError: (err) => {
            const msg = err.message || 'Connection failed';
            if (msg.includes('rejected') || msg.includes('denied')) {
              setError('Connection cancelled');
            } else if (msg.includes('already pending')) {
              setError('A connection request is already open. Check your wallet extension.');
            } else {
              setError(msg);
            }
            setConnectingWallet(null);
          },
        }
      );
    },
    [connectPolygon]
  );

  const walletOptions: WalletOption[] = useMemo(() => {
    if (activeChain === 'polygon') {
      const seen = new Set<string>();

      // Hide Phantom from Polygon list (Phantom is primarily Solana;
      // showing it here confuses users even though it supports EVM).
      // Also hide the generic "Injected" fallback when named wallets exist.
      const isPhantom = (c: (typeof connectors)[number]) =>
        c.id === 'app.phantom' ||
        c.id === 'phantom' ||
        c.name.toLowerCase() === 'phantom';

      const isGenericInjected = (c: (typeof connectors)[number]) =>
        c.id === 'injected' && (c.name === 'Injected' || !c.name);

      const hasNamedConnectors = connectors.some(
        (c) => !isPhantom(c) && !isGenericInjected(c)
      );

      return connectors
        .filter((c) => {
          // Always hide Phantom on Polygon
          if (isPhantom(c)) return false;
          // Hide generic "Injected" when named wallets (MetaMask, Bitget, etc.) exist
          if (isGenericInjected(c) && hasNamedConnectors) return false;
          // Deduplicate by name
          if (seen.has(c.name)) return false;
          seen.add(c.name);
          return true;
        })
        .map((connector) => ({
          name: connector.name || 'Wallet',
          icon: connector.icon || '💎',
          detected: true,
          onClick: () => handlePolygonSelect(connector),
        }));
    }

    return solanaWallets.map((w) => ({
      name: w.adapter.name,
      icon: w.adapter.icon || '',
      detected: w.readyState === 'Installed',
      onClick: () => handleSolanaSelect(w.adapter.name),
    }));
  }, [activeChain, solanaWallets, connectors, handleSolanaSelect, handlePolygonSelect]);

  const detectedWallets = walletOptions.filter((w) => w.detected);
  const otherWallets = walletOptions.filter((w) => !w.detected);

  const isConnecting = !!connectingWallet || solanaConnecting || polygonConnecting;

  if (!isOpen) return null;

  return createPortal(
    <div
      className="wallet-picker-overlay"
      onClick={(e) => {
        // Guard: ignore backdrop clicks within 150ms of modal opening.
        // This prevents the Connect button's click event from bubbling
        // through the React portal and immediately closing the modal.
        if (Date.now() - openedAtRef.current < 150) return;
        if (e.target === e.currentTarget && !isConnecting) onClose();
      }}
    >
      <div className="wallet-picker-modal">
        {/* Header */}
        <div className="wallet-picker-header">
          <div className="wallet-picker-header-left">
            <div className="wallet-picker-chain-icon" style={{ borderColor: config.color, color: config.color }}>
              {config.icon}
            </div>
            <div>
              <h2 className="wallet-picker-title">
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </h2>
              <p className="wallet-picker-subtitle">
                {isConnecting ? `Approve in ${connectingWallet}` : `${config.name} • ${config.testnetName}`}
              </p>
            </div>
          </div>
          {!isConnecting && (
            <button onClick={onClose} className="wallet-picker-close" aria-label="Close">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="wallet-picker-error">
            <AlertCircle size={14} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="wallet-picker-error-dismiss">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Connecting state */}
        {isConnecting ? (
          <div className="wallet-picker-connecting">
            <Loader2 size={32} className="wallet-picker-spinner" />
            <p className="wallet-picker-connecting-name">{connectingWallet}</p>
            <p className="wallet-picker-connecting-hint">
              Waiting for approval in your wallet extension...
            </p>
            <button
              onClick={() => {
                setConnectingWallet(null);
                setError(null);
              }}
              className="wallet-picker-cancel"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* Wallet List */
          <div className="wallet-picker-list">
            {detectedWallets.length > 0 && (
              <div className="wallet-picker-section">
                <p className="wallet-picker-section-label">
                  {activeChain === 'polygon' ? 'Available' : 'Detected'}
                </p>
                {detectedWallets.map((wallet) => (
                  <WalletOptionRow key={wallet.name} wallet={wallet} chainColor={config.color} />
                ))}
              </div>
            )}

            {otherWallets.length > 0 && (
              <div className="wallet-picker-section">
                <p className="wallet-picker-section-label">More Wallets</p>
                {otherWallets.map((wallet) => (
                  <WalletOptionRow key={wallet.name} wallet={wallet} chainColor={config.color} notInstalled />
                ))}
              </div>
            )}

            {walletOptions.length === 0 && (
              <div className="wallet-picker-empty">
                <AlertCircle size={24} />
                <p>No wallets found</p>
                <p className="wallet-picker-empty-hint">
                  Install a {config.name}-compatible wallet to continue
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="wallet-picker-footer">
          <Wallet size={10} />
          <span>
            New to {config.name}?{' '}
            <a
              href={activeChain === 'polygon' ? 'https://metamask.io/download/' : 'https://phantom.app/'}
              target="_blank"
              rel="noreferrer"
            >
              Get a wallet <ExternalLink size={8} />
            </a>
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}

function WalletOptionRow({
  wallet,
  chainColor,
  notInstalled,
}: {
  wallet: WalletOption;
  chainColor: string;
  notInstalled?: boolean;
}) {
  return (
    <button onClick={wallet.onClick} className="wallet-option-row">
      <div className="wallet-option-icon">
        {typeof wallet.icon === 'string' ? (
          wallet.icon.startsWith('http') || wallet.icon.startsWith('data:') ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={wallet.icon} alt={wallet.name} width={24} height={24} />
          ) : (
            <span className="wallet-option-emoji">{wallet.icon || '🔗'}</span>
          )
        ) : (
          wallet.icon
        )}
      </div>

      <div className="wallet-option-info">
        <p className="wallet-option-name">{wallet.name}</p>
        {notInstalled && <p className="wallet-option-status">Not installed</p>}
      </div>

      {!notInstalled && (
        <div className="wallet-option-dot" style={{ backgroundColor: chainColor }} />
      )}
    </button>
  );
}
