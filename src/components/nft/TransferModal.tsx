'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, AlertTriangle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import { PublicKey } from '@solana/web3.js';
import { isAddress as isEvmAddress } from 'viem';
import { transferNFT } from '@/lib/solana/marketplace';
import { transferNFTPolygon } from '@/lib/polygon/marketplace';
import { apiUpdateNFT, apiCreateActivity } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import { useInvalidateQueries } from '@/hooks/useData';
import { CHAIN_CONFIGS } from '@/types/chain';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { NFT } from '@/types/nft';

interface TransferModalProps {
  nft: NFT;
  isOpen: boolean;
  onClose: () => void;
}

function isValidSolanaAddress(addr: string): boolean {
  try {
    new PublicKey(addr);
    return true;
  } catch {
    return false;
  }
}

export default function TransferModal({ nft, isOpen, onClose }: TransferModalProps) {
  const wallet = useWallet();
  const { address: evmAddress } = useAccount();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();
  const [recipient, setRecipient] = useState('');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');

  const isPolygon = nft.chain === 'polygon';
  const chainConfig = CHAIN_CONFIGS[nft.chain];

  const isValidAddress = useMemo(() => {
    if (!recipient) return false;
    return isPolygon ? isEvmAddress(recipient) : isValidSolanaAddress(recipient);
  }, [recipient, isPolygon]);

  const currentAddress = isPolygon
    ? evmAddress?.toLowerCase()
    : wallet.publicKey?.toBase58();

  const isSelf = useMemo(() => {
    if (!currentAddress || !recipient) return false;
    return isPolygon
      ? recipient.toLowerCase() === currentAddress
      : recipient === currentAddress;
  }, [currentAddress, recipient, isPolygon]);

  const handleTransfer = useCallback(async () => {
    if (!isValidAddress || isSelf) return;

    setProcessing(true);
    try {
      let txSignature = '';

      if (isPolygon) {
        // Polygon ERC-721 transfer
        if (!evmAddress) throw new Error('Connect MetaMask first');
        if (!nft.tokenId) throw new Error('NFT has no token ID on Polygon');

        const result = await transferNFTPolygon(evmAddress, recipient, nft.tokenId);
        txSignature = result.txHash;
      } else {
        // Solana SPL token transfer
        if (!wallet.publicKey) throw new Error('Connect Solana wallet first');

        const result = await transferNFT({
          wallet,
          mintAddress: nft.mint,
          recipientAddress: recipient,
        });
        txSignature = result.txSignature;
      }

      // Update database
      try {
        await apiUpdateNFT({
          mint: nft.mint,
          owner: recipient,
          listed: false,
          price: null,
        });
      } catch (dbErr) {
        console.error('Failed to update NFT owner:', dbErr);
      }

      // Log activity
      const fromAddr = isPolygon ? evmAddress! : wallet.publicKey!.toBase58();
      try {
        await apiCreateActivity({
          type: 'transfer',
          nft_mint: nft.mint,
          nft_name: nft.name,
          nft_image: nft.image,
          from_address: fromAddr,
          to_address: recipient,
          tx_signature: txSignature,
          chain: nft.chain,
        });
      } catch (dbErr) {
        console.error('Failed to log transfer activity:', dbErr);
      }

      invalidateAll();
      setStep('success');
      addToast(`"${nft.name}" transferred successfully!`, 'success', txSignature);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      addToast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  }, [wallet, evmAddress, nft, recipient, isValidAddress, isSelf, isPolygon, addToast, invalidateAll]);

  const handleClose = useCallback(() => {
    setRecipient('');
    setStep('input');
    setProcessing(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const placeholder = isPolygon
    ? 'Enter 0x... wallet address'
    : 'Enter Solana wallet address...';

  const invalidMsg = isPolygon
    ? 'Invalid EVM address (must start with 0x)'
    : 'Invalid Solana address';

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden"
          style={{ maxWidth: '28rem' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)]">
              Transfer NFT
            </h3>
            <button
              onClick={handleClose}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            {step === 'success' ? (
              /* Success State */
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-16 h-16 mx-auto mb-4 bg-[var(--color-electric-lime)]/20 rounded-full flex items-center justify-center"
                >
                  <Send size={24} className="text-[var(--color-electric-lime)]" />
                </motion.div>
                <p className="text-sm text-[var(--text-primary)] mb-1">Transfer Complete!</p>
                <p className="text-xs text-[var(--text-secondary)] font-[family-name:var(--font-mono)]">
                  &quot;{nft.name}&quot; has been sent
                </p>
                <Button size="md" variant="secondary" className="mt-4" onClick={handleClose}>
                  Done
                </Button>
              </div>
            ) : step === 'confirm' ? (
              /* Confirm State */
              <div className="space-y-4">
                <div className="bg-[var(--bg-primary)] border border-[var(--color-signal-orange)]/30 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-[var(--color-signal-orange)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-signal-orange)] mb-1">Confirm Transfer</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        This action is irreversible. &quot;{nft.name}&quot; will be transferred on {chainConfig.name} to:
                      </p>
                      <p className="text-xs font-[family-name:var(--font-mono)] text-[var(--accent)] mt-2 break-all">
                        {recipient}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="md"
                    variant="danger"
                    className="flex-1"
                    onClick={handleTransfer}
                    loading={processing}
                    disabled={processing}
                  >
                    {processing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {processing ? 'TRANSFERRING...' : 'CONFIRM TRANSFER'}
                  </Button>
                  <Button size="md" variant="secondary" onClick={() => setStep('input')} disabled={processing}>
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              /* Input State */
              <div className="space-y-4">
                {/* NFT Preview */}
                <div className="flex items-center gap-3 bg-[var(--bg-primary)] p-3 border border-[var(--border-color)]">
                  <div className="w-12 h-12 bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{nft.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-[family-name:var(--font-mono)]">
                      {nft.mint.slice(0, 16)}... · <span style={{ color: chainConfig.color }}>{chainConfig.name}</span>
                    </p>
                  </div>
                </div>

                <Input
                  label={`Recipient Wallet Address (${chainConfig.name})`}
                  placeholder={placeholder}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value.trim())}
                />

                {recipient && !isValidAddress && (
                  <p className="text-xs text-[var(--color-crimson)]">{invalidMsg}</p>
                )}
                {isSelf && (
                  <p className="text-xs text-[var(--color-signal-orange)]">Cannot transfer to yourself</p>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setStep('confirm')}
                  disabled={!isValidAddress || isSelf}
                >
                  <Send size={16} />
                  TRANSFER
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
