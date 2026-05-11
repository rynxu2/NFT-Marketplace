'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Loader2, Check, AlertCircle, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';
import { CHAIN_CONFIGS, type ChainId } from '@/types/chain';
import { useBridge, type BridgeStep } from '@/hooks/useBridge';
import type { NFT } from '@/types/nft';

interface BridgeModalProps {
  nft: NFT;
  isOpen: boolean;
  onClose: () => void;
}

const STEP_LABELS: Record<BridgeStep, string> = {
  idle: 'Ready to bridge',
  confirming: 'Confirming...',
  locking: 'Locking on source chain...',
  bridging: 'Bridging cross-chain...',
  minting: 'Minting on destination...',
  complete: 'Bridge complete!',
  error: 'Bridge failed',
};

const STEPS: BridgeStep[] = ['locking', 'bridging', 'minting', 'complete'];

export default function BridgeModal({ nft, isOpen, onClose }: BridgeModalProps) {
  const { bridgeNFT, step } = useBridge();
  const [destChain, setDestChain] = useState<ChainId>(nft.chain === 'solana' ? 'polygon' : 'solana');

  const sourceConfig = CHAIN_CONFIGS[nft.chain];
  const destConfig = CHAIN_CONFIGS[destChain];
  const isProcessing = step !== 'idle' && step !== 'complete' && step !== 'error';

  const handleBridge = async () => {
    const success = await bridgeNFT(nft, destChain);
    if (success) {
      setTimeout(onClose, 2000);
    }
  };

  const getStepIndex = () => STEPS.indexOf(step);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isProcessing) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[var(--accent)]" />
              <h2 className="text-sm font-[family-name:var(--font-display)] uppercase tracking-wider">
                Cross-Chain Bridge
              </h2>
            </div>
            {!isProcessing && (
              <button onClick={onClose} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
                <X size={16} />
              </button>
            )}
          </div>

          {/* NFT Preview */}
          <div className="px-6 py-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--bg-secondary)] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold">{nft.name}</p>
                <p className="text-[10px] text-[var(--text-secondary)] font-[family-name:var(--font-mono)]">
                  {nft.mint.slice(0, 8)}...{nft.mint.slice(-4)}
                </p>
              </div>
            </div>
          </div>

          {/* Chain Flow */}
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              {/* Source Chain */}
              <div className="flex-1 text-center">
                <div
                  className="w-14 h-14 mx-auto flex items-center justify-center border-2 text-2xl mb-2"
                  style={{ borderColor: sourceConfig.color, color: sourceConfig.color }}
                >
                  {sourceConfig.icon}
                </div>
                <p className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider">
                  {sourceConfig.name}
                </p>
                <p className="text-[9px] text-[var(--text-secondary)]">{sourceConfig.testnetName}</p>
              </div>

              {/* Arrow */}
              <div className="px-4">
                <motion.div
                  animate={isProcessing ? { x: [0, 5, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <ArrowRight size={20} className="text-[var(--accent)]" />
                </motion.div>
              </div>

              {/* Destination Chain */}
              <div className="flex-1 text-center">
                <div
                  className="w-14 h-14 mx-auto flex items-center justify-center border-2 text-2xl mb-2"
                  style={{ borderColor: destConfig.color, color: destConfig.color }}
                >
                  {destConfig.icon}
                </div>
                <p className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider">
                  {destConfig.name}
                </p>
                <p className="text-[9px] text-[var(--text-secondary)]">{destConfig.testnetName}</p>
              </div>
            </div>

            {/* Progress Steps */}
            {step !== 'idle' && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  {STEPS.map((s, i) => {
                    const currentIdx = getStepIndex();
                    const isComplete = i < currentIdx || step === 'complete';
                    const isCurrent = i === currentIdx;
                    const isError = step === 'error' && isCurrent;

                    return (
                      <React.Fragment key={s}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 flex items-center justify-center border transition-all ${
                              isError
                                ? 'border-[var(--color-crimson)] bg-[var(--color-crimson)]/20'
                                : isComplete
                                  ? 'border-[var(--color-electric-lime)] bg-[var(--color-electric-lime)]/20'
                                  : isCurrent
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                    : 'border-[var(--border-color)]'
                            }`}
                          >
                            {isError ? (
                              <AlertCircle size={12} className="text-[var(--color-crimson)]" />
                            ) : isComplete ? (
                              <Check size={12} className="text-[var(--color-electric-lime)]" />
                            ) : isCurrent ? (
                              <Loader2 size={12} className="text-[var(--accent)] animate-spin" />
                            ) : (
                              <span className="text-[8px] text-[var(--text-secondary)]">{i + 1}</span>
                            )}
                          </div>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div
                            className={`flex-1 h-px mx-1 transition-colors ${
                              i < currentIdx ? 'bg-[var(--color-electric-lime)]' : 'bg-[var(--border-color)]'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-[var(--text-secondary)]">
                  {STEP_LABELS[step]}
                </p>
              </div>
            )}

            {/* Action */}
            {step === 'idle' && (
              <Button size="lg" className="w-full" onClick={handleBridge}>
                <Zap size={16} />
                BRIDGE TO {destConfig.name.toUpperCase()}
              </Button>
            )}

            {step === 'complete' && (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-[var(--color-electric-lime)]/20 border border-[var(--color-electric-lime)]/40">
                  <Check size={20} className="text-[var(--color-electric-lime)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--color-electric-lime)]">
                  Bridge Complete!
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                  {nft.name} is now on {destConfig.name}
                </p>
              </div>
            )}

            {/* Info */}
            <div className="mt-4 p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <p className="text-[9px] text-[var(--text-secondary)] leading-relaxed">
                ⚡ Cross-chain bridge transfers your NFT between blockchains. The NFT will be locked on{' '}
                {sourceConfig.name} and a new representation will be minted on {destConfig.name}.
                {nft.bridgeOrigin && (
                  <span className="block mt-1 text-[var(--color-signal-orange)]">
                    This NFT was originally bridged from {CHAIN_CONFIGS[nft.bridgeOrigin].name}.
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
