'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, AlertTriangle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { transferNFT } from '@/lib/solana/marketplace';
import { apiUpdateNFT, apiCreateActivity } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import { useInvalidateQueries } from '@/hooks/useData';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { NFT } from '@/types/nft';

interface TransferModalProps {
  nft: NFT;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferModal({ nft, isOpen, onClose }: TransferModalProps) {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();
  const [recipient, setRecipient] = useState('');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');

  const isValidAddress = useMemo(() => {
    if (!recipient) return false;
    try {
      new PublicKey(recipient);
      return true;
    } catch {
      return false;
    }
  }, [recipient]);

  const isSelf = useMemo(() => {
    return wallet.publicKey?.toBase58() === recipient;
  }, [wallet.publicKey, recipient]);

  const handleTransfer = useCallback(async () => {
    if (!wallet.publicKey || !isValidAddress || isSelf) return;

    setProcessing(true);
    try {
      const result = await transferNFT({
        wallet,
        mintAddress: nft.mint,
        recipientAddress: recipient,
      });

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
      try {
        await apiCreateActivity({
          type: 'transfer',
          nft_mint: nft.mint,
          nft_name: nft.name,
          nft_image: nft.image,
          from_address: wallet.publicKey.toBase58(),
          to_address: recipient,
          tx_signature: result.txSignature,
        });
      } catch (dbErr) {
        console.error('Failed to log transfer activity:', dbErr);
      }

      invalidateAll();
      setStep('success');
      addToast(`"${nft.name}" transferred successfully!`, 'success', result.txSignature);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      addToast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  }, [wallet, nft, recipient, isValidAddress, isSelf, addToast, invalidateAll]);

  const handleClose = useCallback(() => {
    setRecipient('');
    setStep('input');
    setProcessing(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden"
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
                        This action is irreversible. &quot;{nft.name}&quot; will be transferred to:
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
                    <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{nft.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-[family-name:var(--font-mono)]">
                      {nft.mint.slice(0, 16)}...
                    </p>
                  </div>
                </div>

                <Input
                  label="Recipient Wallet Address"
                  placeholder="Enter Solana wallet address..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value.trim())}
                />

                {recipient && !isValidAddress && (
                  <p className="text-xs text-[var(--color-crimson)]">Invalid Solana address</p>
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
}
