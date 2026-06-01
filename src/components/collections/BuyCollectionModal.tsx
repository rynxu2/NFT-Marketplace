'use client';

import React from 'react';
import { CheckCircle, Loader2, ShoppingCart, User, Layers, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { Collection } from '@/types/collection';
import type { BuyCollectionStep } from '@/hooks/useBuyCollection';
import { formatChainCurrency } from '@/types/chain';
import { shortenAddress } from '@/lib/solana/connection';
import { getChainPriceUSD } from '@/lib/constants';

interface BuyCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  onBuy: () => Promise<boolean>;
  step: BuyCollectionStep;
}

const STEP_LABELS: Record<BuyCollectionStep, string> = {
  idle: '',
  confirming: 'Preparing transaction...',
  paying: 'Processing payment...',
  updating: 'Updating ownership...',
  complete: 'Purchase complete!',
  error: 'Transaction failed',
};

export default function BuyCollectionModal({
  isOpen,
  onClose,
  collection,
  onBuy,
  step,
}: BuyCollectionModalProps) {
  const price = collection.salePrice || 0;
  const currency = collection.saleCurrency || (collection.chain === 'polygon' ? 'POL' : 'SOL');
  const usdPrice = price * getChainPriceUSD(collection.chain);
  const isProcessing = step !== 'idle' && step !== 'complete' && step !== 'error';

  const handleBuy = async () => {
    const success = await onBuy();
    if (success) {
      setTimeout(onClose, 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy Collection">
      <div className="space-y-5">
        {/* Collection info */}
        <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)]">
          <p className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
            {collection.name}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1">
              <User size={12} /> {shortenAddress(collection.owner)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers size={12} /> {collection.stats.items} items
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="text-center py-3">
          <p className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
            {formatChainCurrency(price, collection.chain)}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            ≈ ${usdPrice.toFixed(2)} USD
          </p>
        </div>

        {/* What you get */}
        <div className="space-y-2">
          <p className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
            You will receive
          </p>
          {[
            'Collection ownership',
            `All ${collection.stats.items} NFTs transferred to you`,
            'Active listings will be cancelled',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <CheckCircle size={14} className="text-[var(--color-electric-lime)] shrink-0" />
              {item}
            </div>
          ))}
        </div>

        {/* Progress */}
        {step !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)]"
          >
            {step === 'complete' ? (
              <CheckCircle size={16} className="text-[var(--color-electric-lime)]" />
            ) : step === 'error' ? (
              <XCircle size={16} className="text-[var(--color-crimson)]" />
            ) : (
              <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
            )}
            <p className="text-xs text-[var(--text-secondary)]">
              {STEP_LABELS[step]}
            </p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleBuy}
            loading={isProcessing}
            disabled={isProcessing || step === 'complete'}
            className="flex-1"
          >
            <ShoppingCart size={14} />
            {step === 'complete' ? 'Purchased!' : 'Confirm Purchase'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
